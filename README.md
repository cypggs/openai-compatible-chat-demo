# OpenAI Compatible Chat Demo

English | [简体中文](README.zh-CN.md)

A browser chat UI for OpenAI-compatible APIs, FreeAPI web search, and DeepSeek. This is an independent community fork of [deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo), distributed under the same MIT license.

## Highlights

- **OpenAI-compatible Chat Completions**: configure a custom base URL or full `/chat/completions` URL, API key, and model ID.
- **Model discovery**: verify a key with `GET /models`, automatically load model IDs, refresh the list, and search or manually enter a model.
- **Streaming replies**: supports standard `delta.content` plus common `reasoning_content` and `reasoning` extensions.
- **FreeAPI web search**: uses `POST /v1/search`, displays clickable sources, injects numbered results into the model context, and asks for inline citations.
- **DeepSeek mode**: preserves the original Anthropic-compatible Messages / Files integration, reasoning, search, link reading, attachments, and speech.
- Multiple conversations and branches, prompt editing, regeneration, Markdown, syntax highlighting, KaTeX, Mermaid, Chinese and English, light and dark themes, and local history import/export.

OpenAI-compatible mode currently supports text conversations. Attachments and speech remain available in DeepSeek mode. The search toggle is shown for DeepSeek and FreeAPI; other OpenAI-compatible providers need only CORS-enabled `/models` and `/chat/completions` endpoints.

## Quick start

Requirements: Node.js 22.12+ and pnpm.

```sh
pnpm install
pnpm build
pnpm start
```

Open **http://localhost:8091**. The Node server serves `dist/` and includes a restricted same-origin proxy for FreeAPI.

For UI development, `pnpm dev` starts Rspack on port 8090. Use the production build plus `pnpm start` when testing FreeAPI, because the development server does not provide the FreeAPI proxy.

### Configuration

Open **Settings → Data → Model API** and choose a provider.

#### OpenAI-compatible

1. Enter a base URL such as `https://api.openai.com/v1`, or a full `/v1/chat/completions` URL.
2. Enter an API key and confirm. The app calls `GET /models` and loads the available model IDs.
3. Select or enter a model ID.
4. For FreeAPI, use `https://freeapi.cypggs.com/v1` and enable **Search** in the chat input when needed.

Except for the fixed FreeAPI integration, the browser requests the configured provider directly. The provider must allow browser CORS requests. Do not enter an untrusted endpoint: your key and conversation content are sent to that service.

#### DeepSeek

Select DeepSeek and enter a DeepSeek API key to use the original demo's Messages, Files, search, and speech capabilities.

## FreeAPI proxy and security

FreeAPI does not currently allow direct browser CORS requests. The optional Node server therefore forwards only these fixed routes:

- `/api/freeapi/models` → `https://freeapi.cypggs.com/v1/models`
- `/api/freeapi/chat/completions` → `https://freeapi.cypggs.com/v1/chat/completions`
- `/api/freeapi/search` → `https://freeapi.cypggs.com/v1/search`

The target host cannot be supplied by the browser, so this is not an arbitrary URL proxy. Requests must include the caller's Authorization header, request bodies are limited to 2 MiB, and cross-origin proxy access is rejected. The server does not persist API keys or conversation data.

For a reverse proxy that rewrites the Host header, set the public host used by the Origin check:

```sh
PORT=8091 PUBLIC_HOST=chat.example.com pnpm start
```

A static deployment of `dist/` also works for CORS-enabled providers, but does not include the FreeAPI proxy.

## Data and storage

API keys and settings are stored in the browser's `localStorage`; conversations and original attachments are stored in IndexedDB. Data is isolated by browser profile and site origin. DeepSeek and OpenAI-compatible keys are stored separately.

FreeAPI requests pass through the restricted same-origin proxy when the Node server is used. Other OpenAI-compatible requests go directly from the browser to the configured provider. Sending messages, searching, uploading attachments, or using speech sends the relevant content to the corresponding service.

History exports exclude API keys and settings. See the [history archive documentation (Chinese)](src/services/chat/history/README.md) for format details.

## Development

| Command       | Description                                  |
| ------------- | -------------------------------------------- |
| `pnpm dev`    | Start the Rspack development server on 8090  |
| `pnpm build`  | Build production assets into `dist/`         |
| `pnpm start`  | Serve the build and restricted FreeAPI proxy |
| `pnpm type`   | Run TypeScript type checks                   |
| `pnpm lint`   | Lint with oxlint                             |
| `pnpm format` | Format with oxfmt                            |

```text
server.mjs            Static server and fixed-target FreeAPI proxy
src/
  app/                Application layout, themes, and global styles
  components/         Chat, settings, search results, and other UI
  i18n/               English and Chinese translations
  services/
    api/              DeepSeek/OpenAI requests, SSE, and protocol types
    chat/             Conversations, branches, storage, and history
    markdown/         Markdown, highlighting, math, and diagrams
    speech/           DeepSeek recording and read-aloud playback
  utils/              Shared utilities
```

## Acknowledgements

Based on [DeepSeek Chat Demo](https://github.com/deepseek-ai/chat-demo). The original copyright and license notices are retained. This fork is not affiliated with or endorsed by DeepSeek, OpenAI, or FreeAPI.

## License

[MIT](LICENSE). The build copies the license to `dist/LICENSE`; include it when distributing the app. Third-party dependencies are subject to their own licenses.
