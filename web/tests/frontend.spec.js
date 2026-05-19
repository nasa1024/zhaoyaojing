import { test, expect } from '@playwright/test';

const mockCapabilities = {
  supported_platforms: ['Midjourney', 'OpenAI', 'Adobe Firefly'],
  supported_formats: ['JPEG', 'PNG', 'WebP'],
  supported_signal_types: ['EXIF', 'XMP', 'PNG 文本块'],
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

test.beforeEach(async ({ page }) => {
  await page.route('**/pkg/aicheck.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        export default async function init() {}
        export function initPanicHook() {}
        export async function supportedImageCapabilities() { return ${JSON.stringify(mockCapabilities)}; }
        export async function analyzeImage(bytes, name) { return { ...${JSON.stringify(mockReport)}, file_name: name }; }
      `,
    });
  });
});

test('shows trust indicators, selected file metadata, and accessible controls', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'AI 图片来源信号检测' })).toBeVisible();
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

test('keeps the primary interface usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'AI 图片来源信号检测' })).toBeVisible();
  await expect(page.getByLabel('点击选择图片')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
});
