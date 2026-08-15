# describe-image — 图像理解插件

模型侧 `describe_image` 工具：为**纯文本模型**（DeepSeek V4 等）提供图像理解能力。
每次调用加载一张图片——本地文件路径、http(s) URL、会话附件引用——交给
OpenAI 兼容的视觉模型端点（Xiaomi MiMo、Qwen-VL、GLM-4V、GPT-4o、本地 Ollama 等）
回答，支持 Chat Completions 与 Responses 两种协议；**只有返回的文本进入对话，
图片本身绝不进入会话记录**。

移植自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) 的
`dsh-tool-describe-image`（Apache-2.0，原版权归 deepseek-ai / whitelonng），
按本机官方 DSH 环境适配（详见「与上游差异」）。

## 能力

| 能力 | 说明 |
| --- | --- |
| 四种输入 | 本地绝对路径、http(s) URL（拒绝重定向）、`[image attachment …]` JSON 附件引用、或 `![图片](/describe-image/raw/sha256:…)` 短 markdown 引用里的裸附件 id |
| 直接发图 | 在纯文本会话里拖拽或粘贴图片，发送时被改写为 describe-image 引用（`![图片](/describe-image/raw/sha256:…)`），而不是模型读不了的图片块——图片在会话里正常渲染，模型经工具分析它 |
| 自定义指令 | `prompt` 参数携带你的精确指令（OCR、图表解读、UI 诊断、翻译…）；`defaultPrompt` 配置设置模型未传指令时的兜底文案 |
| 实时配置卡 | 设置 → 插件配置 → 「图像理解」卡修改 `baseURL` / `apiStyle` / `model` / API key / 默认指令 / 各项上限（走设置服务），即时生效，无需重启 |
| 双协议 | `apiStyle: chat-completions`（默认）请求 `baseURL/chat/completions`；`apiStyle: responses` 请求 `baseURL/responses`，使用 `input` / `max_output_tokens` 并读取 `output_text` |
| 原图路由 | `GET /describe-image/raw/<id>` 回读已存字节（仅回环、内容寻址 id），让贴入的引用在会话中渲染 |
| 每次调用解析密钥 | 内联 `apiKey` → 凭证服务（`apiKeyEnv`，默认 `VISION_API_KEY`）→ 启动环境，逐级回退 |
| 安全与边界 | 上传/回读路由同源护栏；所有请求拒绝重定向；`maxBytes` / `maxOutputTokens` / `timeoutMs` 上限；magic-byte 类型门；错误摘要有界（200 字符）；密钥不进日志 |
| 返回规范值 | `{ text, model, image, mimeType, bytes }`——模型只看到 `text` |

## 安全模型

- 视觉请求与图片下载均拒绝 HTTP 重定向（`redirect: 'error'`），bearer 凭证与图片字节
  不会转发到部署配置之外的源。
- `/describe-image/attach` 与 `/describe-image/raw/<id>` 均带同源护栏：浏览器跨站
  请求一律 403（恶意网页不能 CSRF 借用本地服务）。
- 请求体携带 base64 图片但不携带密钥；不记录请求头与已解析凭证。
- 仅接受 `http(s)` URL 与本地路径，其余 URL 协议一律拒绝。
- attach 路由先校验 base64、magic bytes 与字节上限，再交给附件存储持久化；
  只有引用 JSON（文本）进入会话。
- 响应体先按上限（`maxOutputTokens * 8 + 64 KiB`）截断再解析。

## 安装

```sh
# 本机（link 方式安装，profile web）
dsh plugin --profile web add link:/root/.dsh/external/describe-image
```

插件默认**无配置挂载**：加载不受影响，首次调用会以清晰的错误提示
（`describe-image: baseURL must be an absolute http(s) URL`）告知尚未配置。
在「设置 → 插件配置 → 图像理解」卡填写端点与模型即可立即使用，无需重启。

## 配置

| 键 | 默认 | 含义 |
| --- | --- | --- |
| `baseURL` | —（必填） | OpenAI 兼容端点根（如 `https://api.xiaomimimo.com/v1`），末尾斜杠自动去除 |
| `apiStyle` | `chat-completions` | 接口协议：`chat-completions` 追加 `/chat/completions`；`responses` 追加 `/responses`（OpenAI Responses API 的 `input` / `max_output_tokens` / `output_text` 形态） |
| `model` | —（必填） | 视觉模型 id |
| `apiKey` | — | 内联密钥；本地调试用。建议用 `!!js process.env.VISION_API_KEY` 从环境注入，勿写死明文 |
| `apiKeyEnv` | `VISION_API_KEY` | 凭证引用（环境变量名）；空字符串禁用引用解析 |
| `defaultPrompt` | 见源码 | 调用未带 `prompt` 时的指令——按你的场景调优（OCR、UI 评审、翻译…） |
| `maxBytes` | `10485760` | 图片字节上限（本地文件与下载一致） |
| `maxOutputTokens` | `1024` | 输出 token 上限：`chat-completions` 发 `max_tokens`，`responses` 发 `max_output_tokens` |
| `timeoutMs` | `60000` | 单次视觉请求超时 |

带配置的挂载示例（profile 的 `cordis.patch.yml` / 组合文件；密钥经环境变量注入，不写明文）：

```yaml
- id: describe-image
  name: 'dsh-describe-image'
  config:
    baseURL: https://api.xiaomimimo.com/v1
    model: mimo-v2.5
    apiKey: !!js process.env.XIAOMI_MIMO_API_KEY
```

只开放 Responses API 的端点设置 `apiStyle: responses`：

```yaml
- id: describe-image
  name: 'dsh-describe-image'
  config:
    baseURL: https://api.openai.com/v1
    apiStyle: responses
    model: gpt-4o-mini
    apiKey: !!js process.env.VISION_API_KEY
```

## 使用

### 自定义指令

工具接受 `prompt` 参数：告诉视觉模型你具体要什么——「转录全部文字」、「把表格提取为 CSV」、
「诊断这个 UI 的布局问题」、「把文字翻译成中文」。针对性指令远胜泛泛描述；工具描述会引导
文本模型优先传指令。未传 `prompt` 的调用回退到 `defaultPrompt`。

### 从输入框发送图片

DSH 输入框对纯文本模型没有图片入口，因此在输入框里拖拽或粘贴图片：发送时插件会把携带图片的
发送改写为 describe-image 引用（`![图片](/describe-image/raw/sha256:…)`），而不是模型读不了的
图片块——图片在会话里正常渲染，模型经工具分析它。图片字节经 host 端 `/describe-image/attach`
路由上传（校验大小与 magic bytes，持久化到附件存储）；只有引用文本进入会话记录。

## 已知限制

- 仅 magic-byte 门校验类型、不解码图片：头合法但内容损坏的文件会在视觉端点才报错。
- 单图单答：不支持多图输入、追问上一张图、结构化输出（坐标 / 框）。
- 抽取文本仍消耗一次 VLM 调用：仅需 OCR 的部署可把 `baseURL` 指向更便宜的 OCR 模型。
- 仅 OpenAI 兼容协议：支持 Chat Completions（`/chat/completions`）与 Responses（`/responses`）
  两种形态，请求 / 响应形态不同的厂商需要单独适配。

## 与上游差异（本仓库适配点）

- **设置卡槽位**：上游挂在全家桶槽位 `web-ui.plugin.item`（依赖 dsh-web-ui-settings 组插件）；
  本实现改为官方槽位 `settings.plugin.item`（与官方 bash/agent-loop 卡片同列），
  在官方 DSH Web 上开箱即用。
- **样式**：上游 CSS Modules（全家桶 shared preset + lightningcss 构建）；本实现改为
  内联样式字符串（`body[data-dsh-describe-image]` 作用域，`di-*` 类名前缀），构建不依赖
  全家桶构建设施，符合本仓库 UI 插件契约。
- **同源护栏**：上游 attach 路由无 CSRF 防护；本实现新增同源护栏（theme-center 同款防线）。
- **包名**：`dsh-describe-image`（上游为 `@linxin666/dsh-tool-describe-image`）。

## 开发

```sh
pnpm install    # 安装 devDependencies（tsdown / vitest / react / schemastery / cordis）
pnpm build      # tsdown：lib/index.js（node 半区）+ lib/client.js（浏览器 bundle）
pnpm test       # vitest（123 用例：工具端到端 / attach 路由 / 设置 / Loader 组合 / 缓存 / 发送改写）
```

- 构建按 AGENTS.md 约定不做强制类型检查（`@deepseek-ai/dsh-*` 未发布到 npm 的
  0.1.0-rc.6，运行时由宿主模块表提供）；测试经 `vitest.config.ts` 的 alias 从
  本机 DSH 全局安装树解析这些包，**运行 `pnpm test` 的机器需装有 DSH**。
- `lib/` 为构建产物，随源码一并提交（link 安装直接可用）。

## 部署目标

- **验证**：AI-2（192.168.31.112，`/root/.dsh/external/describe-image` link 安装）
- **正式使用**：AI（192.168.31.111，systemd `dsh-web.service`）
- 密钥：部署时经环境变量注入（如 `XIAOMI_MIMO_API_KEY`）或设置卡内填写（secret role），
  不写入仓库、不写进配置文件明文。

## 来源与版权

- **来源**：本包移植自 [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui)
  的 `packages/dsh-tool-describe-image`（原版权归 deepseek-ai / whitelonng），
  测试随源码一并移植。
- **版权**：原代码版权归原作者所有，本仓库仅托管与维护，不主张版权；
  移植与适配部分由贡献者以 Apache-2.0 授权发布。
- **许可证**：[Apache-2.0](LICENSE)。
