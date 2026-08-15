# CHANGELOG — 变更记录归档

> AGENTS.md「四、变更记录」超过 30 条后的归档存放处（按原格式、时间倒序）。最新记录始终在 AGENTS.md。

### 2026-08-15 新增 chat-width-customizer 主题插件 v1（复用上游仓库并部署 112）

- 变更内容：新建 `chat-width-customizer/` 文件夹，复用 magicOF2/dsh-chat-width-customizer（MIT）全部代码作为主题插件 v1（第一版零修改）；README 注明复用来源与部署目标；已安装到 AI-2（192.168.31.112）的 dsh web profile（`dsh plugin add link:/root/.dsh/external/chat-width-customizer`，112 上补装 pnpm 11.21.0），重启 dsh web 后页面已注入插件 client bundle，待用户浏览器验证效果；`.gitignore` 的 `lib/` 规则修正为 `/lib/`（避免忽略功能文件夹的 lib 代码）
- 涉及路径：`chat-width-customizer/`（package.json、lib/index.js、lib/client.js、cordis.patch.yml、README.md、LICENSE）、`.gitignore`、`AGENTS.md`
- 备注：112 上插件目录位于 `/root/.dsh/external/chat-width-customizer`（link 方式安装），后续迭代只需同步该目录并重启 dsh web 即可生效；回滚可用 `dsh plugin --profile web remove dsh-chat-width-customizer`

### 2026-08-15 新增"部署验证"约定：插件先装到 AI-2 (31.112) 验证

- 变更内容：第三节新增第 6 点"部署验证（适用时）"——功能完成且满足 DoD 后，如需实际环境验证，先安装到 AI-2（192.168.31.112）检查验证，验证通过才视为交付完成；登录方式指向知识库 autu.md
- 涉及路径：`AGENTS.md`
- 备注：用户指示"插件开发查看效果先安装到31.112上检查验证效果"；当前暂不开发具体插件

### 2026-08-15 关联远程仓库 LQFHUB/dsh-plugin 并推送

- 变更内容：添加远程 `origin`（https://github.com/LQFHUB/dsh-plugin.git）并推送 main；git 身份更新为 LQFHUB / 15809601162@163.com；第七节新增远程同步约定；认证 token 存入本地凭据存储（不入库）
- 涉及路径：`AGENTS.md`、`.git/config`、`/root/.git-credentials`（仅本地，不入库）
- 备注：用户新建 GitHub 仓库并提供 token；token 已存本地凭据存储，不写入任何代码/文档/提交

### 2026-08-15 新增"七、Git 版本管理约定"，初始化 git 仓库

- 变更内容：初始化 git 仓库（main 分支，仓库级身份 dsh-plugin）；新增第七节 Git 约定（每功能一次提交、提交信息 `<type>: <描述>`、提交前检查 status）；新建 `.gitignore`（忽略 IDE 配置与构建产物）
- 涉及路径：`AGENTS.md`、`.gitignore`、`.git/`
- 备注：用户确认使用 git 并写入约定

### 2026-08-15 补充完成标准、敏感信息安全与语言约定

- 变更内容：第三节新增第 5 点"功能完成标准（DoD）"（代码可用、README 写好、测试通过、变更记录追加）；第五节新增"敏感信息安全"（凭证不硬编码，存入知识库/环境变量）与"语言约定"（文档与注释默认中文）两条规则
- 涉及路径：`AGENTS.md`
- 备注：用户询问 AGENTS.md 还缺什么，评估后补充

### 2026-08-15 社区参考内容内联化：删除"社区参考仓库"小节

- 变更内容：按用户指示删除"社区参考仓库"小节，将其有价值的规范直接内联进"核心规范要点"：新增"插件包标准结构"（dsh.bundle.patch + cordis.patch.yml + tsdown 自包含构建）、"皮肤/UI 插件开发契约"（纯呈现层、body 属性作用域样式、ctx.effect 全部收回、内联资源）、"插件测试"（apply 契约测试）三个小节
- 涉及路径：`AGENTS.md`
- 备注：用户口头指示（不新增社区参考仓库小节，有价值的内容直接写入 AGENTS.md）

### 2026-08-15 添加社区参考仓库 zhu1090093659/dsh-web-ui

- 变更内容：在"六、官方文档索引"新增"社区参考仓库"小节，收录 dsh-web-ui 仓库及其插件包结构、皮肤开发契约、契约测试等参考价值说明
- 涉及路径：`AGENTS.md`
- 备注：用户提供仓库链接，评估后认为有参考价值（插件/皮肤开发契约），已注明其 skill 仅抽取规范结论

### 2026-08-15 建立变更记录归档机制

- 变更内容：新增归档规则（见本节末尾"归档机制"），防止 AGENTS.md 无限膨胀占用会话上下文
- 涉及路径：`AGENTS.md`
- 备注：AGENTS.md 会被作为工作区指令完整注入每个会话，需控制体积

### 2026-08-15 修订规则：AGENTS.md 更新无需询问用户

- 变更内容：新增规则"AGENTS.md 的更新由 Agent 自行决定，无需询问用户"；删除/移动/重命名文件需询问的规则明确排除 `AGENTS.md` 本身
- 涉及路径：`AGENTS.md`
- 备注：用户口头指示（改 AGENTS.md 不需要问，Agent 自行决定是否更新）

### 2026-08-15 添加"六、官方文档索引"章节

- 变更内容：新增官方文档索引章节，收录 DSH（DeepSeek Harness）官方插件开发文档链接（开发基础、框架层、Cordis 教程、Cookbook）与核心规范要点
- 涉及路径：`AGENTS.md`
- 备注：官方仓库 [deepseek-ai/DeepSeek-Harness](https://github.com/deepseek-ai/DeepSeek-Harness)，文档位于其 `docs/` 目录

### 2026-08-15 创建 AGENTS.md，确立本目录开发约定

- 变更内容：创建本文件，确立目录用途（个人插件开发）、每功能一个文件夹的结构约定、添加新功能前先询问用户、变更必须记录等规则
- 涉及路径：`AGENTS.md`


