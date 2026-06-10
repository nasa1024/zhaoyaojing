// Per-language full article bodies for the localized blog routes (/[lang]/blog/<slug>/).
// Each entry: { title, desc, lead, sections: [{ h, ps?: string[], list?: string[] }] }
import howToDetectAiImages from './articles/how-to-detect-ai-images.mjs';
import whatIsC2pa from './articles/what-is-c2pa.mjs';
import aiImageMetadataGuide from './articles/ai-image-metadata-guide.mjs';
import howToDetectAiVideos from './articles/how-to-detect-ai-videos.mjs';
import howToDetectGeminiGeneratedImages from './articles/how-to-detect-gemini-generated-images.mjs';

export const localizedArticles = {
  'how-to-detect-ai-images': howToDetectAiImages,
  'what-is-c2pa': whatIsC2pa,
  'ai-image-metadata-guide': aiImageMetadataGuide,
  'how-to-detect-ai-videos': howToDetectAiVideos,
  'how-to-detect-gemini-generated-images': howToDetectGeminiGeneratedImages,
};
