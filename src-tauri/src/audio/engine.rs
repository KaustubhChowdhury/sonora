use std::sync::atomic::{AtomicBool, AtomicU64, AtomicU32, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use parking_lot::Mutex;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Stream, StreamConfig};
use crossbeam_channel::{bounded, Receiver, Sender};
use serde::{Deserialize, Serialize};

use super::decoder::SymphoniaDecoder;
use super::dsp::{DspConfig, DspProcessor};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub sample_rates: Vec<u32>,
    pub channels: u16,
    pub exclusive_supported: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackStatus {
    pub is_playing: bool,
    pub current_position_ms: u64,
    pub duration_ms: u64,
    pub sample_rate: u32,
    pub bit_depth: Option<u32>,
    pub channels: u32,
    pub codec: String,
    pub volume: f32,
    pub output_mode: String,
    pub device_name: String,
    pub is_bit_perfect: bool,
    pub dsp_bypassed: bool,
    pub underrun_count: u64,
}

enum EngineCommand {
    Play(String),
    Pause,
    Resume,
    Seek(u64),
    Stop,
    SetVolume(f32),
    SetDsp(DspConfig),
    SetDevice(String),
    SetOutputMode(String), // "shared" | "exclusive"
}

pub struct AudioEngine {
    cmd_sender: Sender<EngineCommand>,
    status: Arc<AudioEngineStatus>,
}

struct AudioEngineStatus {
    is_playing: AtomicBool,
    current_position_ms: AtomicU64,
    duration_ms: AtomicU64,
    sample_rate: AtomicU32,
    bit_depth: AtomicU32,
    channels: AtomicU32,
    codec: Mutex<String>,
    volume: Mutex<f32>,
    output_mode: Mutex<String>,
    device_name: Mutex<String>,
    is_bit_perfect: AtomicBool,
    dsp_bypassed: AtomicBool,
    underrun_count: AtomicU64,
}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        let (cmd_tx, cmd_rx) = bounded::<EngineCommand>(64);

        let status = Arc::new(AudioEngineStatus {
            is_playing: AtomicBool::new(false),
            current_position_ms: AtomicU64::new(0),
            duration_ms: AtomicU64::new(0),
            sample_rate: AtomicU32::new(44100),
            bit_depth: AtomicU32::new(16),
            channels: AtomicU32::new(2),
            codec: Mutex::new("Unknown".to_string()),
            volume: Mutex::new(0.85),
            output_mode: Mutex::new("shared".to_string()),
            device_name: Mutex::new("Windows Default Audio Endpoint".to_string()),
            is_bit_perfect: AtomicBool::new(false),
            dsp_bypassed: AtomicBool::new(false),
            underrun_count: AtomicU64::new(0),
        });

        let worker_status = status.clone();

        thread::Builder::new()
            .name("sonora-audio-worker".to_string())
            .spawn(move || {
                run_audio_worker(cmd_rx, worker_status);
            })
            .map_err(|e| format!("Failed to spawn audio engine thread: {}", e))?;

        Ok(Self {
            cmd_sender: cmd_tx,
            status,
        })
    }

    pub fn play(&self, path: String) {
        let _ = self.cmd_sender.send(EngineCommand::Play(path));
    }

    pub fn pause(&self) {
        let _ = self.cmd_sender.send(EngineCommand::Pause);
    }

    pub fn resume(&self) {
        let _ = self.cmd_sender.send(EngineCommand::Resume);
    }

    pub fn seek(&self, time_ms: u64) {
        let _ = self.cmd_sender.send(EngineCommand::Seek(time_ms));
    }

    pub fn stop(&self) {
        let _ = self.cmd_sender.send(EngineCommand::Stop);
    }

    pub fn set_volume(&self, volume: f32) {
        let _ = self.cmd_sender.send(EngineCommand::SetVolume(volume.clamp(0.0, 1.0)));
    }

    pub fn set_dsp(&self, dsp: DspConfig) {
        let _ = self.cmd_sender.send(EngineCommand::SetDsp(dsp));
    }

    pub fn set_device(&self, device_id: String) {
        let _ = self.cmd_sender.send(EngineCommand::SetDevice(device_id));
    }

    pub fn set_output_mode(&self, mode: String) {
        let _ = self.cmd_sender.send(EngineCommand::SetOutputMode(mode));
    }

    pub fn get_status(&self) -> PlaybackStatus {
        let is_playing = self.status.is_playing.load(Ordering::Relaxed);
        let current_position_ms = self.status.current_position_ms.load(Ordering::Relaxed);
        let duration_ms = self.status.duration_ms.load(Ordering::Relaxed);
        let sample_rate = self.status.sample_rate.load(Ordering::Relaxed);
        let bit_depth = {
            let bd = self.status.bit_depth.load(Ordering::Relaxed);
            if bd > 0 { Some(bd) } else { None }
        };
        let channels = self.status.channels.load(Ordering::Relaxed);
        let codec = self.status.codec.lock().clone();
        let volume = *self.status.volume.lock();
        let output_mode = self.status.output_mode.lock().clone();
        let device_name = self.status.device_name.lock().clone();
        let is_bit_perfect = self.status.is_bit_perfect.load(Ordering::Relaxed);
        let dsp_bypassed = self.status.dsp_bypassed.load(Ordering::Relaxed);
        let underrun_count = self.status.underrun_count.load(Ordering::Relaxed);

        PlaybackStatus {
            is_playing,
            current_position_ms,
            duration_ms,
            sample_rate,
            bit_depth,
            channels,
            codec,
            volume,
            output_mode,
            device_name,
            is_bit_perfect,
            dsp_bypassed,
            underrun_count,
        }
    }

    pub fn list_devices() -> Vec<DeviceInfo> {
        let host = cpal::default_host();
        let default_device = host.default_output_device();
        let default_name = default_device.and_then(|d| d.name().ok());

        let mut devices = Vec::new();
        if let Ok(dev_iter) = host.output_devices() {
            for (idx, dev) in dev_iter.enumerate() {
                if let Ok(name) = dev.name() {
                    let is_default = default_name.as_ref().map(|d| d == &name).unwrap_or(false);
                    let sample_rates = vec![44100, 48000, 88200, 96000, 192000];
                    let id = format!("device-{}", idx);
                    devices.push(DeviceInfo {
                        id,
                        name,
                        is_default,
                        sample_rates,
                        channels: 2,
                        exclusive_supported: true,
                    });
                }
            }
        }

        if devices.is_empty() {
            devices.push(DeviceInfo {
                id: "default".to_string(),
                name: "Windows Default Audio Device".to_string(),
                is_default: true,
                sample_rates: vec![44100, 48000, 96000],
                channels: 2,
                exclusive_supported: true,
            });
        }

        devices
    }
}

fn run_audio_worker(
    cmd_rx: Receiver<EngineCommand>,
    status: Arc<AudioEngineStatus>,
) {
    let host = cpal::default_host();
    let current_device: Option<Device> = host.default_output_device();

    if let Some(ref d) = current_device {
        if let Ok(name) = d.name() {
            *status.device_name.lock() = name;
        }
    }

    let mut _current_stream: Option<Stream> = None;
    let (sample_tx, sample_rx) = bounded::<Vec<f32>>(16);
    let sample_rx = Arc::new(Mutex::new(sample_rx));

    let mut decoder: Option<SymphoniaDecoder> = None;
    let mut dsp = DspProcessor::new(48000.0);
    let mut current_volume = 0.85f32;
    let mut is_playing = false;
    let mut _active_output_mode = "shared".to_string();

    let sample_rx_for_stream = sample_rx.clone();
    let status_for_stream = status.clone();

    // Helper to recreate CPAL stream
    let init_stream = |device: &Device, output_sr: u32| -> Option<Stream> {
        let config = StreamConfig {
            channels: 2,
            sample_rate: cpal::SampleRate(output_sr),
            buffer_size: cpal::BufferSize::Default,
        };

        let rx_clone = sample_rx_for_stream.clone();
        let stat_clone = status_for_stream.clone();
        let mut local_buf: Vec<f32> = Vec::new();
        let mut buf_idx = 0;

        let stream_result = device.build_output_stream(
            &config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                for sample in data.iter_mut() {
                    if buf_idx >= local_buf.len() {
                        let rx = rx_clone.lock();
                        match rx.try_recv() {
                            Ok(new_samples) => {
                                local_buf = new_samples;
                                buf_idx = 0;
                            }
                            Err(_) => {
                                *sample = 0.0;
                                stat_clone.underrun_count.fetch_add(1, Ordering::Relaxed);
                                continue;
                            }
                        }
                    }

                    if buf_idx < local_buf.len() {
                        *sample = local_buf[buf_idx];
                        buf_idx += 1;
                    } else {
                        *sample = 0.0;
                    }
                }
            },
            move |err| {
                eprintln!("Audio output stream error: {}", err);
            },
            None,
        );

        match stream_result {
            Ok(s) => {
                let _ = s.play();
                Some(s)
            }
            Err(e) => {
                eprintln!("Failed to build audio output stream: {}", e);
                None
            }
        }
    };

    if let Some(ref dev) = current_device {
        _current_stream = init_stream(dev, 48000);
    }

    loop {
        // Handle incoming commands
        while let Ok(cmd) = cmd_rx.try_recv() {
            match cmd {
                EngineCommand::Play(path) => {
                    match SymphoniaDecoder::open(&path) {
                        Ok((dec, meta)) => {
                            status.sample_rate.store(meta.sample_rate, Ordering::Relaxed);
                            status.bit_depth.store(meta.bit_depth.unwrap_or(16), Ordering::Relaxed);
                            status.channels.store(meta.channels, Ordering::Relaxed);
                            status.duration_ms.store(meta.duration_ms, Ordering::Relaxed);
                            status.current_position_ms.store(0, Ordering::Relaxed);
                            *status.codec.lock() = meta.codec_name;

                            dsp.set_sample_rate(meta.sample_rate as f32);

                            decoder = Some(dec);
                            is_playing = true;
                            status.is_playing.store(true, Ordering::Relaxed);
                        }
                        Err(e) => {
                            eprintln!("Failed to open track: {}", e);
                            is_playing = false;
                            status.is_playing.store(false, Ordering::Relaxed);
                        }
                    }
                }
                EngineCommand::Pause => {
                    is_playing = false;
                    status.is_playing.store(false, Ordering::Relaxed);
                }
                EngineCommand::Resume => {
                    if decoder.is_some() {
                        is_playing = true;
                        status.is_playing.store(true, Ordering::Relaxed);
                    }
                }
                EngineCommand::Seek(pos_ms) => {
                    if let Some(ref mut dec) = decoder {
                        let _ = dec.seek(pos_ms);
                        status.current_position_ms.store(pos_ms, Ordering::Relaxed);
                    }
                }
                EngineCommand::Stop => {
                    is_playing = false;
                    decoder = None;
                    status.is_playing.store(false, Ordering::Relaxed);
                    status.current_position_ms.store(0, Ordering::Relaxed);
                }
                EngineCommand::SetVolume(vol) => {
                    current_volume = vol;
                    *status.volume.lock() = vol;
                }
                EngineCommand::SetDsp(config) => {
                    dsp.set_config(config);
                    status.dsp_bypassed.store(dsp.get_config().bypass, Ordering::Relaxed);
                }
                EngineCommand::SetDevice(dev_id) => {
                    let host = cpal::default_host();
                    if let Ok(devices) = host.output_devices() {
                        for (idx, d) in devices.enumerate() {
                            if format!("device-{}", idx) == dev_id {
                                if let Ok(name) = d.name() {
                                    *status.device_name.lock() = name;
                                }
                                _current_stream = None;
                                _current_stream = init_stream(&d, 48000);
                                break;
                            }
                        }
                    }
                }
                EngineCommand::SetOutputMode(mode) => {
                    _active_output_mode = mode.clone();
                    *status.output_mode.lock() = mode.clone();
                    if mode == "exclusive" {
                        status.is_bit_perfect.store(true, Ordering::Relaxed);
                        status.dsp_bypassed.store(true, Ordering::Relaxed);
                        let mut cfg = dsp.get_config().clone();
                        cfg.bypass = true;
                        dsp.set_config(cfg);
                    } else {
                        status.is_bit_perfect.store(false, Ordering::Relaxed);
                    }
                }
            }
        }

        // If playing and decoder available, decode frames and feed output queue
        if is_playing {
            if let Some(ref mut dec) = decoder {
                if sample_tx.len() < 8 {
                    match dec.next_packet_interleaved() {
                        Ok(Some(mut samples)) => {
                            // Apply DSP (EQ, Preamp, Soft limiter) unless bypassed
                            dsp.process_interleaved(&mut samples);

                            // Apply master volume unless in strict bit-perfect mode
                            if !status.is_bit_perfect.load(Ordering::Relaxed) {
                                for s in samples.iter_mut() {
                                    *s *= current_volume;
                                }
                            }

                            status.current_position_ms.store(dec.current_position_ms(), Ordering::Relaxed);
                            let _ = sample_tx.try_send(samples);
                        }
                        Ok(None) => {
                            // Track ended
                            is_playing = false;
                            status.is_playing.store(false, Ordering::Relaxed);
                        }
                        Err(e) => {
                            eprintln!("Decoder error: {}", e);
                            is_playing = false;
                            status.is_playing.store(false, Ordering::Relaxed);
                        }
                    }
                } else {
                    thread::sleep(Duration::from_millis(5));
                }
            } else {
                thread::sleep(Duration::from_millis(20));
            }
        } else {
            thread::sleep(Duration::from_millis(20));
        }
    }
}
