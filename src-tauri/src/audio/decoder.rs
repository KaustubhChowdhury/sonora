use std::fs::File;
use std::path::Path;
use symphonia::core::audio::{AudioBufferRef, Signal};
use symphonia::core::codecs::{Decoder, DecoderOptions};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::{FormatOptions, FormatReader, SeekMode, SeekTo};
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use symphonia::core::units::Time;

pub struct AudioMetadataInfo {
    pub codec_name: String,
    pub sample_rate: u32,
    pub bit_depth: Option<u32>,
    pub channels: u32,
    pub duration_ms: u64,
}

pub struct SymphoniaDecoder {
    format_reader: Box<dyn FormatReader>,
    decoder: Box<dyn Decoder>,
    track_id: u32,
    sample_rate: u32,
    channels: u32,
    duration_ms: u64,
    current_frame: u64,
    total_frames: u64,
}

impl SymphoniaDecoder {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<(Self, AudioMetadataInfo), String> {
        let file = File::open(path.as_ref())
            .map_err(|e| format!("Failed to open file: {}", e))?;
        let mss = MediaSourceStream::new(Box::new(file), Default::default());

        let mut hint = Hint::new();
        if let Some(ext) = path.as_ref().extension().and_then(|e| e.to_str()) {
            hint.with_extension(ext);
        }

        let format_opts = FormatOptions {
            enable_gapless: true,
            ..Default::default()
        };
        let meta_opts = MetadataOptions::default();

        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &format_opts, &meta_opts)
            .map_err(|e| format!("Unsupported format or corrupt audio container: {}", e))?;

        let format_reader = probed.format;

        let track = format_reader
            .default_track()
            .ok_or_else(|| "No default audio track found".to_string())?;

        let track_id = track.id;
        let codec_params = &track.codec_params;

        let sample_rate = codec_params
            .sample_rate
            .unwrap_or(44100);
        let channels = codec_params
            .channels
            .map(|c| c.count() as u32)
            .unwrap_or(2);

        let bit_depth = codec_params.bits_per_sample;

        let duration_ms = if let Some(n_frames) = codec_params.n_frames {
            (n_frames as f64 / sample_rate as f64 * 1000.0) as u64
        } else {
            0
        };

        let total_frames = codec_params.n_frames.unwrap_or(0);

        let decoder_opts = DecoderOptions::default();
        let decoder = symphonia::default::get_codecs()
            .make(codec_params, &decoder_opts)
            .map_err(|e| format!("Unsupported codec: {}", e))?;

        let codec_name = format!("{:?}", codec_params.codec).replace("CODEC_TYPE_", "");

        let meta = AudioMetadataInfo {
            codec_name,
            sample_rate,
            bit_depth,
            channels,
            duration_ms,
        };

        let decoder_instance = Self {
            format_reader,
            decoder,
            track_id,
            sample_rate,
            channels,
            duration_ms,
            current_frame: 0,
            total_frames,
        };

        Ok((decoder_instance, meta))
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    pub fn channels(&self) -> u32 {
        self.channels
    }

    pub fn duration_ms(&self) -> u64 {
        self.duration_ms
    }

    pub fn total_frames(&self) -> u64 {
        self.total_frames
    }

    pub fn current_position_ms(&self) -> u64 {
        if self.sample_rate == 0 {
            0
        } else {
            (self.current_frame as f64 / self.sample_rate as f64 * 1000.0) as u64
        }
    }

    pub fn seek(&mut self, time_ms: u64) -> Result<(), String> {
        let sec = (time_ms / 1000) as u64;
        let frac = (time_ms % 1000) as f64 / 1000.0;
        let seek_to = SeekTo::Time {
            time: Time::new(sec, frac),
            track_id: Some(self.track_id),
        };

        self.format_reader
            .seek(SeekMode::Accurate, seek_to)
            .map_err(|e| format!("Seek failed: {}", e))?;

        self.decoder.reset();
        self.current_frame = (time_ms as f64 / 1000.0 * self.sample_rate as f64) as u64;
        Ok(())
    }

    // Read next packet, decode, and return interleaved stereo (2-channel) f32 samples
    pub fn next_packet_interleaved(&mut self) -> Result<Option<Vec<f32>>, String> {
        loop {
            let packet = match self.format_reader.next_packet() {
                Ok(p) => p,
                Err(SymphoniaError::IoError(e)) if e.kind() == std::io::ErrorKind::UnexpectedEof => {
                    return Ok(None); // End of stream
                }
                Err(SymphoniaError::IoError(_)) => return Ok(None),
                Err(e) => return Err(format!("Error reading packet: {}", e)),
            };

            if packet.track_id() != self.track_id {
                continue;
            }

            match self.decoder.decode(&packet) {
                Ok(decoded) => {
                    let samples = Self::convert_buffer_to_stereo_f32(&decoded);
                    let frames = (samples.len() / 2) as u64;
                    self.current_frame += frames;
                    return Ok(Some(samples));
                }
                Err(SymphoniaError::DecodeError(e)) => {
                    // Non-fatal packet decode error, try next packet
                    eprintln!("Warning: decode error, skipping packet: {}", e);
                    continue;
                }
                Err(e) => return Err(format!("Fatal decode error: {}", e)),
            }
        }
    }

    fn convert_buffer_to_stereo_f32(buf_ref: &AudioBufferRef) -> Vec<f32> {
        match buf_ref {
            AudioBufferRef::F32(buf) => {
                let n_channels = buf.spec().channels.count();
                let n_frames = buf.frames();
                let mut out = Vec::with_capacity(n_frames * 2);
                if n_channels == 1 {
                    let plane = buf.chan(0);
                    for &s in plane {
                        out.push(s);
                        out.push(s);
                    }
                } else {
                    let left = buf.chan(0);
                    let right = buf.chan(1);
                    for i in 0..n_frames {
                        out.push(left[i]);
                        out.push(right[i]);
                    }
                }
                out
            }
            AudioBufferRef::S16(buf) => {
                let n_channels = buf.spec().channels.count();
                let n_frames = buf.frames();
                let mut out = Vec::with_capacity(n_frames * 2);
                let norm = 1.0 / 32768.0;
                if n_channels == 1 {
                    let plane = buf.chan(0);
                    for &s in plane {
                        let sample = s as f32 * norm;
                        out.push(sample);
                        out.push(sample);
                    }
                } else {
                    let left = buf.chan(0);
                    let right = buf.chan(1);
                    for i in 0..n_frames {
                        out.push(left[i] as f32 * norm);
                        out.push(right[i] as f32 * norm);
                    }
                }
                out
            }
            AudioBufferRef::S24(buf) => {
                let n_channels = buf.spec().channels.count();
                let n_frames = buf.frames();
                let mut out = Vec::with_capacity(n_frames * 2);
                let norm = 1.0 / 8388608.0;
                if n_channels == 1 {
                    let plane = buf.chan(0);
                    for &s in plane {
                        let sample = s.0 as f32 * norm;
                        out.push(sample);
                        out.push(sample);
                    }
                } else {
                    let left = buf.chan(0);
                    let right = buf.chan(1);
                    for i in 0..n_frames {
                        out.push(left[i].0 as f32 * norm);
                        out.push(right[i].0 as f32 * norm);
                    }
                }
                out
            }
            AudioBufferRef::S32(buf) => {
                let n_channels = buf.spec().channels.count();
                let n_frames = buf.frames();
                let mut out = Vec::with_capacity(n_frames * 2);
                let norm = 1.0 / 2147483648.0;
                if n_channels == 1 {
                    let plane = buf.chan(0);
                    for &s in plane {
                        let sample = s as f32 * norm;
                        out.push(sample);
                        out.push(sample);
                    }
                } else {
                    let left = buf.chan(0);
                    let right = buf.chan(1);
                    for i in 0..n_frames {
                        out.push(left[i] as f32 * norm);
                        out.push(right[i] as f32 * norm);
                    }
                }
                out
            }
            AudioBufferRef::U8(buf) => {
                let n_channels = buf.spec().channels.count();
                let n_frames = buf.frames();
                let mut out = Vec::with_capacity(n_frames * 2);
                if n_channels == 1 {
                    let plane = buf.chan(0);
                    for &s in plane {
                        let sample = (s as f32 - 128.0) / 128.0;
                        out.push(sample);
                        out.push(sample);
                    }
                } else {
                    let left = buf.chan(0);
                    let right = buf.chan(1);
                    for i in 0..n_frames {
                        out.push((left[i] as f32 - 128.0) / 128.0);
                        out.push((right[i] as f32 - 128.0) / 128.0);
                    }
                }
                out
            }
            _ => Vec::new(),
        }
    }
}
