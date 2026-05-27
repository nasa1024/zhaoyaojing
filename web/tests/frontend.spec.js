import { test, expect } from '@playwright/test';

const mockCapabilities = {
  supported_platforms: ['Midjourney', 'OpenAI', 'Adobe Firefly'],
  supported_formats: ['JPEG', 'PNG', 'WebP', 'MP4', 'MOV'],
  supported_signal_types: ['EXIF', 'XMP', 'PNG 文本块', 'MP4 元数据', '视频帧水印'],
};

const mockReport = {
  ai_generated: true,
  overall_confidence: 'high',
  file_name: 'sample.png',
  mime_type: 'image/png',
  mode: 'browser-image-alpha',
  signals: [
    {
      source: 'OpenAI',
      confidence: 'high',
      tool: 'gpt-image-1',
      description: '检测到 OpenAI 生成图片元数据。',
      details: [{ key: 'Software', value: 'OpenAI' }],
    },
  ],
  limitations: ['截图或二次导出可能移除元数据。'],
};

const mockVideoReport = {
  ai_generated: true,
  overall_confidence: 'medium',
  file_name: 'sample.mp4',
  mime_type: 'video/mp4',
  media_type: 'video',
  mode: 'browser-video-alpha',
  signals: [
    {
      source: 'MP4',
      confidence: 'medium',
      tool: 'kling',
      description: 'MP4 SEI marker 命中已知 AI 视频工具。',
      details: [{ key: 'SEI marker', value: 'kling-ai' }],
    },
  ],
  limitations: ['视频帧分析可能较慢。'],
};

const mockFrameReport = {
  ai_generated: false,
  overall_confidence: 'none',
  file_name: 'clean-video.mp4',
  mime_type: 'video/mp4',
  media_type: 'video',
  mode: 'browser-video-alpha',
  signals: [],
  limitations: ['视频帧分析可能较慢。'],
};

const mockFrameSignal = {
  ai_generated: true,
  overall_confidence: 'medium',
  file_name: null,
  mime_type: 'video/frame-rgba',
  media_type: 'video-frame',
  mode: 'browser-video-frame',
  signals: [
    {
      source: 'WATERMARK',
      confidence: 'medium',
      tool: null,
      description: '视频帧 1.0s 命中隐形水印信号。',
      details: [{ key: 'frame_timestamp', value: '1.0s' }],
    },
  ],
  limitations: [],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/pkg/aicheck.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        export default async function init() {}
        export function initPanicHook() {}
        export async function supportedImageCapabilities() { return ${JSON.stringify(mockCapabilities)}; }
        export async function supportedMediaCapabilities() { return ${JSON.stringify(mockCapabilities)}; }
        export async function analyzeImage(bytes, name) { return { ...${JSON.stringify(mockReport)}, file_name: name }; }
        export async function analyzeMedia(bytes, name) {
          if (name.endsWith('.mp4')) {
            return name === 'clean-video.mp4'
              ? { ...${JSON.stringify(mockFrameReport)}, file_name: name }
              : { ...${JSON.stringify(mockVideoReport)}, file_name: name };
          }
          return { ...${JSON.stringify(mockReport)}, file_name: name };
        }
        export async function analyzeVideoFrameRgba(bytes, width, height, timestamp) {
          return { ...${JSON.stringify(mockFrameSignal)}, file_name: null };
        }
      `,
    });
  });
});

test('shows trust indicators, selected file metadata, and accessible controls', async ({ page }) => {
  await page.goto('/zh-CN/');

  await expect(page.getByRole('heading', { name: 'AI 图片/视频来源信号检测' })).toBeVisible();
  await expect(page.getByText('本地分析，不上传服务器')).toBeVisible();
  await expect(page.getByText('隐私优先')).toBeVisible();
  await expect(page.getByText('适合原图检测')).toBeVisible();

  await expect(page.locator('#platform-list li')).toHaveCount(mockCapabilities.supported_platforms.length);
  await expect(page.locator('#format-list li')).toHaveCount(mockCapabilities.supported_formats.length);

  await page.setInputFiles('#file-input', {
    name: 'sample.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71]),
  });

  await expect(page.locator('#file-meta').getByText('sample.png', { exact: true })).toBeVisible();
  await expect(page.locator('#file-meta').getByText('4 B')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始检测' })).toBeEnabled();

  await page.getByRole('button', { name: '开始检测' }).click();
  await expect(page.locator('#report').getByText('检测到 AI 来源信号')).toBeVisible();
  await expect(page.locator('#report .signal-source').getByText('OpenAI', { exact: true })).toBeVisible();
});

test('accepts and renders video metadata reports', async ({ page }) => {
  await page.goto('/zh-CN/');

  await page.setInputFiles('#file-input', {
    name: 'sample.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('fake-video'),
  });

  await expect(page.locator('#file-meta').getByText('sample.mp4', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始检测' })).toBeEnabled();

  await page.getByRole('button', { name: '开始检测' }).click();
  await expect(page.locator('#report').getByText('检测到 AI 来源信号')).toBeVisible();
  await expect(page.locator('#report .signal-source').getByText('MP4', { exact: true })).toBeVisible();
  await expect(page.locator('#report').getByText('video/mp4')).toBeVisible();
});

test('merges video frame watermark analysis when video metadata has no signals', async ({ page }) => {
  await page.addInitScript(() => {
    window.__AICHECK_TEST_FRAME_EXTRACTOR__ = async () => [
      { rgba: new Uint8Array([128, 128, 128, 255]), width: 1, height: 1, timestamp: 1 },
    ];
  });
  await page.goto('/zh-CN/');

  await page.setInputFiles('#file-input', {
    name: 'clean-video.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('fake-video'),
  });

  await page.getByRole('button', { name: '开始检测' }).click();
  await expect(page.locator('#report').getByText('视频帧 1.0s 命中隐形水印信号。')).toBeVisible();
  await expect(page.locator('#report .signal-source').getByText('WATERMARK', { exact: true })).toBeVisible();
});

test('keeps the primary interface usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/zh-CN/');

  await expect(page.getByRole('heading', { name: 'AI 图片/视频来源信号检测' })).toBeVisible();
  await expect(page.getByLabel('点击选择图片或视频')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
});

test('keeps language in the URL and localized links', async ({ page }) => {
  await page.goto('/en/platforms/midjourney/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://aicheck365.com/en/platforms/midjourney/'
  );
  await expect(page.locator('.site-logo')).toHaveAttribute('href', '/en/');
  await expect(page.locator('.site-nav a').first()).toHaveAttribute('href', '/en/platforms/');
  await expect(page.locator('.related-links a').first()).toHaveAttribute('href', '/en/platforms/dall-e/');

  await page.locator('#lang-switch').selectOption('ja');
  await expect(page).toHaveURL('/ja/platforms/midjourney/');
});

test('serves sitemap entrypoint and includes localized routes', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(sitemap.headers()['content-type']).toMatch(/xml/);

  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain('https://aicheck365.com/sitemap-0.xml');

  const urlset = await request.get('/sitemap-0.xml');
  expect(urlset.ok()).toBeTruthy();

  const urlsetText = await urlset.text();
  expect(urlsetText).toContain('https://aicheck365.com/en/platforms/midjourney/');
  expect(urlsetText).toContain('https://aicheck365.com/zh-CN/blog/how-to-detect-ai-videos/');
});
