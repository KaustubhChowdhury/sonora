use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DspConfig {
    pub bypass: bool,
    pub preamp_gain_db: f32, // -12 to +12 dB
    pub eq_bands: Vec<f32>,  // 10 bands (-12 to +12 dB)
    pub eq_preset: String,
    pub replay_gain_mode: String, // "off", "track", "album"
    pub crossfade_seconds: f32,
}

impl Default for DspConfig {
    fn default() -> Self {
        Self {
            bypass: false,
            preamp_gain_db: 0.0,
            eq_bands: vec![0.0; 10],
            eq_preset: "Flat".to_string(),
            replay_gain_mode: "off".to_string(),
            crossfade_seconds: 0.0,
        }
    }
}

// Second-order IIR peaking filter (RBJ Audio EQ Cookbook)
#[derive(Clone, Debug)]
struct BiquadFilter {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl BiquadFilter {
    fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
        }
    }

    fn update_peaking(&mut self, sample_rate: f32, freq: f32, gain_db: f32, q: f32) {
        if gain_db.abs() < 0.05 {
            // Identity filter if gain is approximately 0 dB
            self.b0 = 1.0;
            self.b1 = 0.0;
            self.b2 = 0.0;
            self.a1 = 0.0;
            self.a2 = 0.0;
            return;
        }

        let a = 10.0f32.powf(gain_db / 40.0);
        let omega = 2.0 * std::f32::consts::PI * freq / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let a0 = 1.0 + alpha / a;
        self.b0 = (1.0 + alpha * a) / a0;
        self.b1 = (-2.0 * cos_omega) / a0;
        self.b2 = (1.0 - alpha * a) / a0;
        self.a1 = (-2.0 * cos_omega) / a0;
        self.a2 = (1.0 - alpha / a) / a0;
    }

    #[inline(always)]
    fn process(&mut self, sample: f32) -> f32 {
        let out = self.b0 * sample + self.b1 * self.x1 + self.b2 * self.x2
            - self.a1 * self.y1 - self.a2 * self.y2;
        self.x2 = self.x1;
        self.x1 = sample;
        self.y2 = self.y1;
        self.y1 = out;
        out
    }
}

pub struct DspProcessor {
    config: DspConfig,
    sample_rate: f32,
    // Per channel (left, right) 10-band filters
    filters_left: Vec<BiquadFilter>,
    filters_right: Vec<BiquadFilter>,
}

const EQ_CENTERS: [f32; 10] = [
    31.25, 62.5, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0,
];

impl DspProcessor {
    pub fn new(sample_rate: f32) -> Self {
        let mut filters_left = Vec::with_capacity(10);
        let mut filters_right = Vec::with_capacity(10);
        for _ in 0..10 {
            filters_left.push(BiquadFilter::new());
            filters_right.push(BiquadFilter::new());
        }

        let mut dsp = Self {
            config: DspConfig::default(),
            sample_rate,
            filters_left,
            filters_right,
        };
        dsp.recompute_filters();
        dsp
    }

    pub fn set_sample_rate(&mut self, sample_rate: f32) {
        self.sample_rate = sample_rate;
        self.recompute_filters();
    }

    pub fn set_config(&mut self, config: DspConfig) {
        self.config = config;
        self.recompute_filters();
    }

    pub fn get_config(&self) -> &DspConfig {
        &self.config
    }

    fn recompute_filters(&mut self) {
        let q = 1.414; // ~1 octave bandwidth
        for i in 0..10 {
            let gain = if i < self.config.eq_bands.len() {
                self.config.eq_bands[i]
            } else {
                0.0
            };
            let freq = EQ_CENTERS[i];
            self.filters_left[i].update_peaking(self.sample_rate, freq, gain, q);
            self.filters_right[i].update_peaking(self.sample_rate, freq, gain, q);
        }
    }

    // Process interleaved stereo samples in-place
    pub fn process_interleaved(&mut self, samples: &mut [f32]) {
        // If strict DSP bypass is enabled, do not modify samples (bit-perfect path)
        if self.config.bypass {
            return;
        }

        let preamp_linear = 10.0f32.powf(self.config.preamp_gain_db / 20.0);

        for chunk in samples.chunks_exact_mut(2) {
            let mut left = chunk[0] * preamp_linear;
            let mut right = chunk[1] * preamp_linear;

            for filter in &mut self.filters_left {
                left = filter.process(left);
            }
            for filter in &mut self.filters_right {
                right = filter.process(right);
            }

            // Soft limiting to prevent harsh digital clipping
            chunk[0] = left.clamp(-1.0, 1.0);
            chunk[1] = right.clamp(-1.0, 1.0);
        }
    }
}
