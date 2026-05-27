# AICheck Browser Demo

这是一个静态前端 demo，目标是把 AICheck 的图片/视频来源信号检测能力搬到浏览器里执行。

## 当前范围

- 支持图片和视频；音频仍以 CLI 为主
- 当前重点支持：EXIF / XMP / PNG 文本块 / MP4/MOV 元数据 / C2PA-lite / 文件名启发式 / 视频帧水印
- 不上传图片或视频到服务器
- 明确只对站点里列出的平台/工具来源信号负责
- 视频帧分析使用单线程 `@ffmpeg/ffmpeg`，按需从固定版本 CDN 加载 `@ffmpeg/core`，不要求 COOP/COEP

## 本地运行

先准备 Rust + wasm-pack，然后在仓库根目录执行：

```bash
wasm-pack build --target web --out-dir web/public/pkg
cd web
npm install
npm run build
python3 -m http.server 4173 -d dist
```

打开：<http://localhost:4173>

## 说明

如果 `web/public/pkg` 不存在，页面会提示先构建 WASM 包。
