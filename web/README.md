# AICheck Browser Demo

这是一个静态前端 demo，目标是把 AICheck 的图片来源信号检测能力搬到浏览器里执行。

## 当前范围

- 只做图片
- 当前重点支持：EXIF / XMP / PNG 文本块 / 文件名启发式
- 不上传图片到服务器
- 明确只对站点里列出的平台/工具来源信号负责

## 本地运行

先准备 Rust + wasm-pack，然后在仓库根目录执行：

```bash
wasm-pack build --target web --out-dir web/pkg
python3 -m http.server 4173 -d web
```

打开：<http://localhost:4173>

## 说明

如果 `web/pkg` 不存在，页面会提示先构建 WASM 包。
