import zhCN from './localized-tools/zh-CN.json';
import zhTW from './localized-tools/zh-TW.json';
import en from './localized-tools/en.json';
import ja from './localized-tools/ja.json';
import ko from './localized-tools/ko.json';
import de from './localized-tools/de.json';

export const TOOL_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de'];
export const TOOL_SLUGS = [
  'c2pa-validator',
  'c2pa-viewer',
  'exif-xmp-reader',
  'png-parameter-extractor',
  'mp4-metadata-inspector',
];

const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,video/mp4,video/quicktime,video/webm,video/x-m4v,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.mp4,.mov,.m4v,.webm';

export const TOOL_TECH = {
  'c2pa-validator': { accept: MEDIA_ACCEPT },
  'c2pa-viewer': { accept: MEDIA_ACCEPT },
  'exif-xmp-reader': { accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff' },
  'png-parameter-extractor': { accept: 'image/png,.png' },
  'mp4-metadata-inspector': { accept: 'video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v' },
};

export const TOOL_LOCALES = { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ko, de };
