#[derive(Debug, Clone, PartialEq)]
pub(crate) struct WebWatermarkSignal {
    pub source: &'static str,
    pub confidence: &'static str,
    pub description: String,
    pub details: Vec<(String, String)>,
}

const MAX_DIM: u32 = 1024;
const DWT_BLOCK: usize = 4;
const MIN_DIM: usize = 64;
const QUANT_STEP: f64 = 36.0;
const ALT_QUANT_STEPS: &[f64] = &[25.0, 30.0, 40.0, 50.0];
const EMBED_INDICES: &[usize] = &[1, 2, 10, 11];
const MIN_INDICATORS: usize = 2;
const NOISE_ASYMMETRY_THRESHOLD: f64 = 0.08;
const BIT_AGREEMENT_THRESHOLD: f64 = 0.62;
const STRONG_BIT_AGREEMENT: f64 = 0.90;
const STRONG_ENERGY_SPREAD: f64 = 1.0;
const STRONG_NOISE_ASYMMETRY: f64 = 0.25;

const VISIBLE_MIN_DIM: u32 = 200;
const CORNER_WIDTH_FRAC: f64 = 0.22;
const CORNER_HEIGHT_FRAC: f64 = 0.12;
const CORNER_MIN_WIDTH_PX: u32 = 80;
const CORNER_MIN_HEIGHT_PX: u32 = 50;
const BRIGHT_DELTA: f64 = 35.0;
const MIN_RUN_LENGTH: u32 = 3;
const MAX_RUN_LENGTH: u32 = 60;
const MIN_RUNS_PER_ROW: u32 = 2;
const MIN_TEXT_ROWS_FRACTION: f64 = 0.12;
const MAX_BBOX_HEIGHT_FRAC: f64 = 0.50;
const MAX_CLUSTER_GAP: u32 = 3;
const MIN_BRIGHT_RATIO: f64 = 0.03;
const MAX_BRIGHT_RATIO: f64 = 0.50;
const MIN_TEXT_ROW_COUNT: u32 = 3;
const MIN_BBOX_WIDTH: u32 = 30;
const MIN_BBOX_HEIGHT: u32 = 12;
const BIMODAL_CENTER_DIFF: f64 = 50.0;

pub(crate) fn detect_invisible_rgba(
    rgba: &[u8],
    width: u32,
    height: u32,
    timestamp_seconds: Option<f64>,
) -> Vec<WebWatermarkSignal> {
    if rgba.len() < width as usize * height as usize * 4 {
        return Vec::new();
    }

    let mut channels = extract_rgb_channels(rgba, width as usize, height as usize);
    let (mut w, mut h) = (width as usize, height as usize);
    if width > MAX_DIM || height > MAX_DIM {
        let (scaled, sw, sh) = downscale_nearest_rgba(rgba, width, height, MAX_DIM);
        channels = extract_rgb_channels(&scaled, sw as usize, sh as usize);
        w = sw as usize;
        h = sh as usize;
    }

    if w < MIN_DIM || h < MIN_DIM {
        return Vec::new();
    }

    let mut indicators: Vec<&str> = Vec::new();
    let mut details = Vec::new();
    let mut has_exceptionally_strong = false;
    let cw = w - (w % 2);
    let ch = h - (h % 2);
    if cw < DWT_BLOCK * 4 || ch < DWT_BLOCK * 4 {
        return Vec::new();
    }

    let channel_pixels: Vec<Vec<f64>> = channels
        .iter()
        .map(|channel| {
            channel
                .iter()
                .take(ch * w)
                .enumerate()
                .filter_map(|(i, &v)| if i % w < cw { Some(v) } else { None })
                .collect()
        })
        .collect();

    let channel_subbands: Vec<DwtSubbands> = channel_pixels
        .iter()
        .map(|px| haar_dwt_2d(px, cw, ch))
        .collect();
    let sub_w = cw / 2;
    let sub_h = ch / 2;

    let channel_noises: Vec<f64> = channels
        .iter()
        .map(|c| estimate_noise_level(c, w, h))
        .collect();
    let mean_noise = channel_noises.iter().sum::<f64>() / 3.0;
    if mean_noise > 0.01 {
        let max_noise = channel_noises.iter().cloned().fold(f64::MIN, f64::max);
        let min_noise = channel_noises.iter().cloned().fold(f64::MAX, f64::min);
        let asymmetry = (max_noise - min_noise) / mean_noise;
        details.push(("noise_asymmetry".to_string(), format!("{:.3}", asymmetry)));
        if asymmetry > NOISE_ASYMMETRY_THRESHOLD {
            indicators.push("channel noise asymmetry");
            if asymmetry > STRONG_NOISE_ASYMMETRY {
                has_exceptionally_strong = true;
            }
        }
    }

    let all_quant_steps: Vec<f64> = std::iter::once(QUANT_STEP)
        .chain(ALT_QUANT_STEPS.iter().copied())
        .collect();
    let mut best_agreement = 0.0f64;
    let mut best_q = 0.0f64;
    for &q_step in &all_quant_steps {
        let channel_bits: Vec<Vec<u8>> = channel_subbands
            .iter()
            .map(|sb| extract_bits(&sb.ll, sub_w, sub_h, q_step, EMBED_INDICES))
            .collect();
        if channel_bits.iter().all(|b| !b.is_empty()) {
            let min_len = channel_bits.iter().map(|b| b.len()).min().unwrap_or(0);
            if min_len > 0 {
                let mut total_agree = 0usize;
                let mut total_compared = 0usize;
                for i in 0..3 {
                    for j in (i + 1)..3 {
                        for (bi, bj) in channel_bits[i]
                            .iter()
                            .zip(channel_bits[j].iter())
                            .take(min_len)
                        {
                            if bi == bj {
                                total_agree += 1;
                            }
                            total_compared += 1;
                        }
                    }
                }
                if total_compared > 0 {
                    let agreement = total_agree as f64 / total_compared as f64;
                    if agreement > best_agreement {
                        best_agreement = agreement;
                        best_q = q_step;
                    }
                }
            }
        }
    }
    details.push((
        "cross_channel_agreement".to_string(),
        format!("{:.3}", best_agreement),
    ));
    if best_agreement > BIT_AGREEMENT_THRESHOLD {
        indicators.push("cross-channel bit consistency");
        details.push(("best_quant_step".to_string(), format!("{:.0}", best_q)));
        if best_agreement > STRONG_BIT_AGREEMENT {
            has_exceptionally_strong = true;
        }
    }

    let mut energy_ratios = Vec::new();
    for sb in &channel_subbands {
        let ll_energy: f64 = sb.ll.iter().map(|v| v * v).sum::<f64>();
        let detail_energy: f64 = sb.lh.iter().map(|v| v * v).sum::<f64>()
            + sb.hl.iter().map(|v| v * v).sum::<f64>()
            + sb.hh.iter().map(|v| v * v).sum::<f64>();
        if ll_energy > 0.0 {
            energy_ratios.push(detail_energy / ll_energy);
        }
    }
    if energy_ratios.len() >= 2 {
        let max_ratio = energy_ratios.iter().cloned().fold(f64::MIN, f64::max);
        let min_ratio = energy_ratios.iter().cloned().fold(f64::MAX, f64::min);
        let mean_ratio = energy_ratios.iter().sum::<f64>() / energy_ratios.len() as f64;
        if mean_ratio > 0.0 {
            let ratio_spread = (max_ratio - min_ratio) / mean_ratio;
            details.push((
                "energy_ratio_spread".to_string(),
                format!("{:.4}", ratio_spread),
            ));
            if ratio_spread > 0.25 {
                indicators.push("asymmetric DWT energy distribution");
                if ratio_spread > STRONG_ENERGY_SPREAD {
                    has_exceptionally_strong = true;
                }
            }
        }
    }

    if indicators.len() < MIN_INDICATORS {
        return Vec::new();
    }

    if let Some(ts) = timestamp_seconds {
        details.push(("frame_timestamp".to_string(), format!("{:.1}s", ts)));
    }
    let confidence = if indicators.len() >= 3 || (indicators.len() >= 2 && has_exceptionally_strong)
    {
        "medium"
    } else {
        "low"
    };
    let description = if let Some(ts) = timestamp_seconds {
        format!("视频帧 {:.1}s 命中隐形水印信号。", ts)
    } else {
        "发现疑似隐形水印信号。".to_string()
    };

    vec![WebWatermarkSignal {
        source: "WATERMARK",
        confidence,
        description,
        details,
    }]
}

pub(crate) fn detect_visible_rgba(rgba: &[u8], width: u32, height: u32) -> Vec<WebWatermarkSignal> {
    if rgba.len() < width as usize * height as usize * 4
        || width < VISIBLE_MIN_DIM
        || height < VISIBLE_MIN_DIM
    {
        return Vec::new();
    }

    let gray = rgba_to_gray(rgba, width as usize, height as usize);
    detect_visible_gray(&gray, width, height)
}

fn extract_rgb_channels(rgba: &[u8], w: usize, h: usize) -> [Vec<f64>; 3] {
    let mut r = Vec::with_capacity(w * h);
    let mut g = Vec::with_capacity(w * h);
    let mut b = Vec::with_capacity(w * h);
    for pixel in rgba.chunks_exact(4).take(w * h) {
        r.push(pixel[0] as f64);
        g.push(pixel[1] as f64);
        b.push(pixel[2] as f64);
    }
    [r, g, b]
}

fn downscale_nearest_rgba(
    rgba: &[u8],
    width: u32,
    height: u32,
    max_dim: u32,
) -> (Vec<u8>, u32, u32) {
    let scale = (max_dim as f64 / width.max(height) as f64).min(1.0);
    let sw = ((width as f64 * scale).round() as u32).max(1);
    let sh = ((height as f64 * scale).round() as u32).max(1);
    let mut out = vec![0u8; sw as usize * sh as usize * 4];
    for y in 0..sh {
        for x in 0..sw {
            let src_x = ((x as f64 / scale).floor() as u32).min(width - 1);
            let src_y = ((y as f64 / scale).floor() as u32).min(height - 1);
            let src = ((src_y * width + src_x) * 4) as usize;
            let dst = ((y * sw + x) * 4) as usize;
            out[dst..dst + 4].copy_from_slice(&rgba[src..src + 4]);
        }
    }
    (out, sw, sh)
}

fn estimate_noise_level(channel: &[f64], width: usize, height: usize) -> f64 {
    if width < 3 || height < 3 {
        return 0.0;
    }
    let mut laplacian_values = Vec::new();
    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let center = channel[y * width + x];
            let top = channel[(y - 1) * width + x];
            let bottom = channel[(y + 1) * width + x];
            let left = channel[y * width + (x - 1)];
            let right = channel[y * width + (x + 1)];
            laplacian_values.push((4.0 * center - top - bottom - left - right).abs());
        }
    }
    if laplacian_values.is_empty() {
        return 0.0;
    }
    laplacian_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    laplacian_values[laplacian_values.len() / 2] / 0.6745
}

fn extract_bits(
    ll_subband: &[f64],
    width: usize,
    height: usize,
    quant_step: f64,
    coeff_indices: &[usize],
) -> Vec<u8> {
    let blocks_x = width / DWT_BLOCK;
    let blocks_y = height / DWT_BLOCK;
    if blocks_x * blocks_y < 32 {
        return vec![];
    }
    let mut bits = Vec::new();
    for by in 0..blocks_y {
        for bx in 0..blocks_x {
            let mut block = [0.0f64; 16];
            for row in 0..DWT_BLOCK {
                for col in 0..DWT_BLOCK {
                    let y = by * DWT_BLOCK + row;
                    let x = bx * DWT_BLOCK + col;
                    if y < height && x < width {
                        block[row * DWT_BLOCK + col] = ll_subband[y * width + x];
                    }
                }
            }
            apply_2d_dct_ortho(&mut block, DWT_BLOCK);
            for &idx in coeff_indices {
                if idx < 16 {
                    let coeff = block[idx];
                    let q = (coeff / quant_step).round() as i64;
                    bits.push((q.abs() % 2) as u8);
                }
            }
        }
    }
    bits
}

fn apply_2d_dct_ortho(block: &mut [f64], size: usize) {
    let n = size as f64;
    for row in 0..size {
        let start = row * size;
        let input: Vec<f64> = block[start..start + size].to_vec();
        for k in 0..size {
            let mut sum = 0.0;
            for (i, val) in input.iter().enumerate() {
                sum += val
                    * (std::f64::consts::PI * (2.0 * i as f64 + 1.0) * k as f64 / (2.0 * n)).cos();
            }
            let scale = if k == 0 {
                (1.0 / n).sqrt()
            } else {
                (2.0 / n).sqrt()
            };
            block[start + k] = sum * scale;
        }
    }
    for col in 0..size {
        let input: Vec<f64> = (0..size).map(|row| block[row * size + col]).collect();
        for k in 0..size {
            let mut sum = 0.0;
            for (i, val) in input.iter().enumerate() {
                sum += val
                    * (std::f64::consts::PI * (2.0 * i as f64 + 1.0) * k as f64 / (2.0 * n)).cos();
            }
            let scale = if k == 0 {
                (1.0 / n).sqrt()
            } else {
                (2.0 / n).sqrt()
            };
            block[k * size + col] = sum * scale;
        }
    }
}

struct DwtSubbands {
    ll: Vec<f64>,
    lh: Vec<f64>,
    hl: Vec<f64>,
    hh: Vec<f64>,
}

fn haar_dwt_2d(data: &[f64], width: usize, height: usize) -> DwtSubbands {
    let half_w = width / 2;
    let half_h = height / 2;
    let inv_sqrt2 = 1.0 / std::f64::consts::SQRT_2;
    let mut row_low = vec![0.0; half_w * height];
    let mut row_high = vec![0.0; half_w * height];
    for y in 0..height {
        for x in 0..half_w {
            let a = data[y * width + 2 * x];
            let b = data[y * width + 2 * x + 1];
            row_low[y * half_w + x] = (a + b) * inv_sqrt2;
            row_high[y * half_w + x] = (a - b) * inv_sqrt2;
        }
    }
    let mut ll = vec![0.0; half_w * half_h];
    let mut lh = vec![0.0; half_w * half_h];
    let mut hl = vec![0.0; half_w * half_h];
    let mut hh = vec![0.0; half_w * half_h];
    for x in 0..half_w {
        for y in 0..half_h {
            let a_low = row_low[2 * y * half_w + x];
            let b_low = row_low[(2 * y + 1) * half_w + x];
            ll[y * half_w + x] = (a_low + b_low) * inv_sqrt2;
            lh[y * half_w + x] = (a_low - b_low) * inv_sqrt2;
            let a_high = row_high[2 * y * half_w + x];
            let b_high = row_high[(2 * y + 1) * half_w + x];
            hl[y * half_w + x] = (a_high + b_high) * inv_sqrt2;
            hh[y * half_w + x] = (a_high - b_high) * inv_sqrt2;
        }
    }
    DwtSubbands { ll, lh, hl, hh }
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Corner {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

impl Corner {
    fn name(&self) -> &'static str {
        match self {
            Corner::TopLeft => "top-left",
            Corner::TopRight => "top-right",
            Corner::BottomLeft => "bottom-left",
            Corner::BottomRight => "bottom-right",
        }
    }

    fn is_known_ai_position(&self) -> bool {
        matches!(self, Corner::TopLeft | Corner::BottomRight)
    }
}

struct TextBbox {
    x0: u32,
    y0: u32,
    x1: u32,
    y1: u32,
}

struct TextCluster {
    start_row: u32,
    end_row: u32,
}

struct TextAnalysis {
    bright_ratio: f64,
    text_row_fraction: f64,
    is_bimodal: bool,
    mean_lum: f64,
}

fn rgba_to_gray(rgba: &[u8], w: usize, h: usize) -> Vec<u8> {
    rgba.chunks_exact(4)
        .take(w * h)
        .map(|px| {
            (0.299 * px[0] as f64 + 0.587 * px[1] as f64 + 0.114 * px[2] as f64).round() as u8
        })
        .collect()
}

fn detect_visible_gray(gray: &[u8], w: u32, h: u32) -> Vec<WebWatermarkSignal> {
    let region_w = ((w as f64 * CORNER_WIDTH_FRAC) as u32)
        .max(CORNER_MIN_WIDTH_PX)
        .min(w / 2);
    let region_h = ((h as f64 * CORNER_HEIGHT_FRAC) as u32)
        .max(CORNER_MIN_HEIGHT_PX)
        .min(h / 2);
    let corners = [
        Corner::TopLeft,
        Corner::TopRight,
        Corner::BottomLeft,
        Corner::BottomRight,
    ];
    let mut signals = Vec::new();

    for &corner in &corners {
        let (ox, oy) = corner_offset(corner, w, h, region_w, region_h);
        let region = extract_region(gray, w, ox, oy, region_w, region_h);
        let region_mean = compute_mean(&region);
        let bright_threshold = (region_mean + BRIGHT_DELTA).min(255.0) as u8;
        let text_rows = find_text_rows(&region, region_w, region_h, bright_threshold);
        let total_text_rows = text_rows.iter().filter(|&&v| v).count() as u32;
        if total_text_rows < MIN_TEXT_ROW_COUNT {
            continue;
        }
        let clusters = find_text_clusters(&text_rows);
        for cluster in &clusters {
            let cluster_h = cluster.end_row - cluster.start_row;
            if cluster_h < MIN_BBOX_HEIGHT
                || cluster_h as f64 > region_h as f64 * MAX_BBOX_HEIGHT_FRAC
            {
                continue;
            }
            let bbox = match find_cluster_bbox(
                &region,
                region_w,
                cluster.start_row,
                cluster.end_row,
                bright_threshold,
            ) {
                Some(b) => b,
                None => continue,
            };
            if bbox.x1 - bbox.x0 < MIN_BBOX_WIDTH {
                continue;
            }
            let analysis = analyze_text_cluster(&region, region_w, &bbox, bright_threshold);
            let mut indicator_count = 0usize;
            let mut indicators = Vec::new();
            if analysis.bright_ratio >= MIN_BRIGHT_RATIO
                && analysis.bright_ratio <= MAX_BRIGHT_RATIO
            {
                indicator_count += 1;
                indicators.push(format!(
                    "bright pixel ratio {:.0}%",
                    analysis.bright_ratio * 100.0
                ));
            }
            if analysis.text_row_fraction >= MIN_TEXT_ROWS_FRACTION {
                indicator_count += 1;
                indicators.push("horizontal text runs".to_string());
            }
            if analysis.is_bimodal {
                indicator_count += 1;
                indicators.push("bimodal luminance".to_string());
            }
            if indicator_count < MIN_INDICATORS {
                continue;
            }
            let confidence = if corner.is_known_ai_position() && indicator_count >= 3 {
                "medium"
            } else {
                "low"
            };
            signals.push(WebWatermarkSignal {
                source: "WATERMARK",
                confidence,
                description: format!("视频帧角落发现疑似可见 AI 水印：{}。", corner.name()),
                details: vec![
                    ("corner".to_string(), corner.name().to_string()),
                    (
                        "region_mean_luminance".to_string(),
                        format!("{:.1}", analysis.mean_lum),
                    ),
                    (
                        "bright_pixel_ratio".to_string(),
                        format!("{:.3}", analysis.bright_ratio),
                    ),
                    (
                        "text_row_fraction".to_string(),
                        format!("{:.3}", analysis.text_row_fraction),
                    ),
                    ("indicator_count".to_string(), indicator_count.to_string()),
                    ("indicators".to_string(), indicators.join("; ")),
                ],
            });
            break;
        }
    }
    signals
}

fn corner_offset(corner: Corner, w: u32, h: u32, rw: u32, rh: u32) -> (u32, u32) {
    match corner {
        Corner::TopLeft => (0, 0),
        Corner::TopRight => (w.saturating_sub(rw), 0),
        Corner::BottomLeft => (0, h.saturating_sub(rh)),
        Corner::BottomRight => (w.saturating_sub(rw), h.saturating_sub(rh)),
    }
}

fn extract_region(gray: &[u8], width: u32, ox: u32, oy: u32, rw: u32, rh: u32) -> Vec<u8> {
    let mut region = Vec::with_capacity((rw * rh) as usize);
    for y in oy..oy + rh {
        for x in ox..ox + rw {
            region.push(gray[(y * width + x) as usize]);
        }
    }
    region
}

fn compute_mean(region: &[u8]) -> f64 {
    if region.is_empty() {
        return 128.0;
    }
    let sum: u64 = region.iter().map(|&v| v as u64).sum();
    sum as f64 / region.len() as f64
}

fn find_text_rows(region: &[u8], rw: u32, rh: u32, bright_threshold: u8) -> Vec<bool> {
    let mut text_rows = Vec::with_capacity(rh as usize);
    for y in 0..rh {
        let mut run_len = 0u32;
        let mut runs_in_row = 0u32;
        for x in 0..rw {
            if region[(y * rw + x) as usize] >= bright_threshold {
                run_len += 1;
            } else {
                if (MIN_RUN_LENGTH..=MAX_RUN_LENGTH).contains(&run_len) {
                    runs_in_row += 1;
                }
                run_len = 0;
            }
        }
        if (MIN_RUN_LENGTH..=MAX_RUN_LENGTH).contains(&run_len) {
            runs_in_row += 1;
        }
        text_rows.push(runs_in_row >= MIN_RUNS_PER_ROW);
    }
    text_rows
}

fn find_text_clusters(text_rows: &[bool]) -> Vec<TextCluster> {
    let mut clusters = Vec::new();
    let mut start: Option<u32> = None;
    let mut gap = 0u32;
    for (y, &is_text) in text_rows.iter().enumerate() {
        let y = y as u32;
        if is_text {
            if start.is_none() {
                start = Some(y);
            }
            gap = 0;
        } else if let Some(s) = start {
            gap += 1;
            if gap > MAX_CLUSTER_GAP {
                let end = y - gap;
                if end > s + MIN_TEXT_ROW_COUNT {
                    clusters.push(TextCluster {
                        start_row: s,
                        end_row: end,
                    });
                }
                start = None;
                gap = 0;
            }
        }
    }
    if let Some(s) = start {
        let end = text_rows.len() as u32 - gap;
        if end > s + MIN_TEXT_ROW_COUNT {
            clusters.push(TextCluster {
                start_row: s,
                end_row: end,
            });
        }
    }
    clusters.sort_by(|a, b| {
        let a_size = a.end_row - a.start_row;
        let b_size = b.end_row - b.start_row;
        b_size.cmp(&a_size)
    });
    clusters
}

fn find_cluster_bbox(
    region: &[u8],
    rw: u32,
    start_row: u32,
    end_row: u32,
    bright_threshold: u8,
) -> Option<TextBbox> {
    let mut min_x = rw;
    let mut max_x = 0u32;
    for y in start_row..end_row {
        for x in 0..rw {
            if region[(y * rw + x) as usize] >= bright_threshold {
                min_x = min_x.min(x);
                max_x = max_x.max(x);
            }
        }
    }
    if max_x > min_x {
        let pad_x = ((max_x - min_x) / 10).max(2);
        let pad_y = ((end_row - start_row) / 10).max(1);
        Some(TextBbox {
            x0: min_x.saturating_sub(pad_x),
            y0: start_row.saturating_sub(pad_y),
            x1: (max_x + pad_x).min(rw),
            y1: (end_row + pad_y).min(region.len() as u32 / rw),
        })
    } else {
        None
    }
}

fn analyze_text_cluster(
    region: &[u8],
    rw: u32,
    bbox: &TextBbox,
    bright_threshold: u8,
) -> TextAnalysis {
    let bw = bbox.x1 - bbox.x0;
    let bh = bbox.y1 - bbox.y0;
    let mut bright_count = 0u32;
    let mut sum_lum = 0u64;
    let total = bw * bh;
    for y in bbox.y0..bbox.y1 {
        for x in bbox.x0..bbox.x1 {
            let v = region[(y * rw + x) as usize];
            sum_lum += v as u64;
            if v >= bright_threshold {
                bright_count += 1;
            }
        }
    }
    let bright_ratio = if total > 0 {
        bright_count as f64 / total as f64
    } else {
        0.0
    };
    let mean_lum = if total > 0 {
        sum_lum as f64 / total as f64
    } else {
        0.0
    };
    let mut text_rows_in_bbox = 0u32;
    for y in bbox.y0..bbox.y1 {
        let mut run_len = 0u32;
        let mut runs = 0u32;
        for x in bbox.x0..bbox.x1 {
            if region[(y * rw + x) as usize] >= bright_threshold {
                run_len += 1;
            } else {
                if (MIN_RUN_LENGTH..=MAX_RUN_LENGTH).contains(&run_len) {
                    runs += 1;
                }
                run_len = 0;
            }
        }
        if (MIN_RUN_LENGTH..=MAX_RUN_LENGTH).contains(&run_len) {
            runs += 1;
        }
        if runs >= MIN_RUNS_PER_ROW {
            text_rows_in_bbox += 1;
        }
    }
    let text_row_fraction = if bh > 0 {
        text_rows_in_bbox as f64 / bh as f64
    } else {
        0.0
    };
    let is_bimodal = check_bimodal(region, rw, bbox, bright_threshold);
    TextAnalysis {
        bright_ratio,
        text_row_fraction,
        is_bimodal,
        mean_lum,
    }
}

fn check_bimodal(region: &[u8], rw: u32, bbox: &TextBbox, threshold: u8) -> bool {
    let mut dark_sum = 0u64;
    let mut dark_count = 0u64;
    let mut bright_sum = 0u64;
    let mut bright_count = 0u64;
    for y in bbox.y0..bbox.y1 {
        for x in bbox.x0..bbox.x1 {
            let v = region[(y * rw + x) as usize] as u64;
            if v >= threshold as u64 {
                bright_sum += v;
                bright_count += 1;
            } else {
                dark_sum += v;
                dark_count += 1;
            }
        }
    }
    if dark_count == 0 || bright_count == 0 {
        return false;
    }
    let dark_mean = dark_sum as f64 / dark_count as f64;
    let bright_mean = bright_sum as f64 / bright_count as f64;
    let total = (dark_count + bright_count) as f64;
    let smaller = dark_count.min(bright_count) as f64;
    (bright_mean - dark_mean) > BIMODAL_CENTER_DIFF
        && smaller / total >= 0.03
        && smaller / total <= 0.50
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rgba(width: usize, height: usize, value: u8) -> Vec<u8> {
        let mut out = Vec::with_capacity(width * height * 4);
        for _ in 0..width * height {
            out.extend_from_slice(&[value, value, value, 255]);
        }
        out
    }

    #[test]
    fn raw_rgba_watermark_skips_tiny_frames() {
        let pixels = rgba(32, 32, 128);
        let signals = detect_invisible_rgba(&pixels, 32, 32, None);
        assert!(signals.is_empty());
    }

    #[test]
    fn raw_rgba_visible_watermark_does_not_flag_uniform_frame() {
        let pixels = rgba(800, 600, 128);
        let signals = detect_visible_rgba(&pixels, 800, 600);
        assert!(signals.is_empty());
    }
}
