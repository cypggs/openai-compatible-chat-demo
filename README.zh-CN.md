# OpenAI Compatible Chat Demo

[English](README.md) | 简体中文

支持 OpenAI 兼容接口、FreeAPI 网页搜索和 DeepSeek 的浏览器聊天应用。本项目是 [deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo) 的独立社区衍生版本，沿用 MIT 许可证。

## 功能

- **OpenAI 兼容 Chat Completions**：自定义 Base URL 或完整 `/chat/completions` 地址、API Key 和模型 ID。
- **模型列表拉取**：验证 Key 时调用 `GET /models`，自动加载模型 ID；支持手动刷新、搜索选择及自由输入。
- **流式回答**：支持标准 `delta.content`，以及常见的 `reasoning_content`、`reasoning` 思考内容扩展。
- **FreeAPI 智能搜索**：调用 `POST /v1/search`，展示可点击来源，把编号结果注入模型上下文并引导回答添加引用。
- **DeepSeek 模式**：保留原项目的 Anthropic 兼容 Messages / Files、深度思考、搜索、链接阅读、附件和语音能力。
- 多会话与消息分支、编辑提问、重新生成、Markdown、代码高亮、KaTeX、Mermaid、中英文、深浅主题和历史导入导出。

OpenAI 兼容模式目前支持文本对话；附件和语音请使用 DeepSeek 模式。DeepSeek 和 FreeAPI 会显示智能搜索开关，其他 OpenAI 兼容服务只需提供允许浏览器跨域访问的 `/models` 与 `/chat/completions` 接口。

## 运行

准备 Node.js 22.12+ 和 pnpm：

```sh
pnpm install
pnpm build
pnpm start
```

打开 **http://localhost:8091**。Node 服务会提供 `dist/` 静态文件，并包含目标受限的 FreeAPI 同源代理。

开发界面时可运行 `pnpm dev`，Rspack 开发服务器使用 8090 端口。测试 FreeAPI 时请使用生产构建和 `pnpm start`，因为开发服务器没有 FreeAPI 代理。

## 配置

打开 **设置 → 数据管理 → 模型接口**。

### OpenAI 兼容

1. 输入 Base URL，例如 `https://api.openai.com/v1`，也可以输入完整的 `/v1/chat/completions` 地址。
2. 输入 API Key 并确定。应用会调用 `GET /models` 验证并加载模型 ID。
3. 选择或手动输入模型 ID。
4. 使用 FreeAPI 时填写 `https://freeapi.cypggs.com/v1`，需要搜索时开启输入框中的 **智能搜索**。

除固定的 FreeAPI 集成外，浏览器会直接请求配置的服务商，服务商必须允许 CORS。不要填写不可信地址：Key 和对话内容会发送给该服务。

### DeepSeek

选择 DeepSeek 并输入 DeepSeek API Key，即可使用原项目的 Messages、Files、搜索和语音功能。

## FreeAPI 代理与安全

FreeAPI 目前不允许浏览器直接跨域请求，因此可选 Node 服务只转发以下固定路由：

- `/api/freeapi/models` → `https://freeapi.cypggs.com/v1/models`
- `/api/freeapi/chat/completions` → `https://freeapi.cypggs.com/v1/chat/completions`
- `/api/freeapi/search` → `https://freeapi.cypggs.com/v1/search`

浏览器不能指定目标主机，因此它不是任意 URL 代理。请求必须携带调用方自己的 Authorization 头，请求体限制为 2 MiB，跨域代理访问会被拒绝。服务端不持久化 API Key 或会话数据。

反向代理如果改写 Host 头，可配置 Origin 校验使用的公开 Host：

```sh
PORT=8091 PUBLIC_HOST=chat.example.com pnpm start
```

仅部署 `dist/` 静态产物也支持允许 CORS 的服务商，但不包含 FreeAPI 代理。

## 数据

API Key 和设置保存在浏览器 `localStorage`，会话和附件原件保存在 IndexedDB，并按浏览器用户配置及站点源隔离。DeepSeek 与 OpenAI 兼容服务的 Key 分开保存。

使用 Node 服务时，FreeAPI 请求会经过目标受限的同源代理；其他 OpenAI 兼容请求由浏览器直接发送给配置的服务商。发送对话、搜索、上传附件或使用语音时，相应内容会提交给对应服务。

历史导出不包含 API Key 和设置。归档格式见[历史导入导出文档](src/services/chat/history/README.md)。

## 开发

| 命令          | 用途                             |
| ------------- | -------------------------------- |
| `pnpm dev`    | 启动 8090 端口的 Rspack 开发服务 |
| `pnpm build`  | 构建生产静态产物到 `dist/`       |
| `pnpm start`  | 启动静态服务和受限 FreeAPI 代理  |
| `pnpm type`   | TypeScript 类型检查              |
| `pnpm lint`   | oxlint 检查                      |
| `pnpm format` | oxfmt 格式化                     |

```text
server.mjs            静态服务器和固定目标 FreeAPI 代理
src/
  app/                应用布局、主题与全局样式
  components/         聊天、设置、搜索结果等界面组件
  i18n/               中英文文案
  services/
    api/              DeepSeek/OpenAI 请求、SSE 与协议类型
    chat/             会话、消息分支、本地存储与历史
    markdown/         Markdown、代码高亮、公式与图表
    speech/           DeepSeek 录音与朗读
  utils/              通用工具
```

## 致谢

基于 [DeepSeek Chat Demo](https://github.com/deepseek-ai/chat-demo)，保留原版权与许可证声明。本衍生项目与 DeepSeek、OpenAI 或 FreeAPI 无隶属关系，也未获得其背书。

## 许可证

[MIT](LICENSE)。构建会将许可证复制到 `dist/LICENSE`，分发时请一并保留；第三方依赖遵循各自的许可证。
