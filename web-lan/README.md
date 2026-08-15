# web-lan：dsh Web 局域网直连支持（免反代）

`@user/dsh-web-lan` —— 一个 **host 侧** dsh 插件，让 dsh Web UI 可以从局域网（或远程）直接访问，**无需 Nginx 等反向代理**，并且局域网客户端能完整使用配置类功能。

## 解决什么问题

dsh Web 默认只监听 loopback（`127.0.0.1`），且两类能力默认对非本机来源关闭：

1. **`crypto.randomUUID` 不可用**：该 Web API 只在安全上下文（HTTPS / localhost）存在，纯 HTTP 的局域网页面里浏览器没有它，前端部分逻辑会报错。
2. **特权 `/api` 方法仅限 loopback**：`settings` / `credentials` / `host` / `agentPreset` / `llm.discoverModels` 等配置类接口默认只信任本机，局域网访问会 403。
3. **插件配置卡片不渲染**：浏览器端 `isLoopback` 标志为 false 时，部分插件配置 UI 不在非本机渲染。

## 功能（三件事）

1. **randomUUID polyfill**：向 `index.html` 的 `<head>` 注入 RFC 4122 v4 实现（基于 `crypto.getRandomValues`），标记为 `<!--dsh-web-lan-polyfill-->`。
2. **特权 API relay**：把以下 15 个仅限 loopback 的方法经 `apiProxy` 原样转发，局域网客户端即可配置模型与插件：

   `agentPreset.read / copy / openDocument / remove`、`host.pickDirectory / openPath`、`settings.describe / openDocument / update / replace / mutate`、`credentials.describe / set / unset`、`llm.discoverModels`

3. **isLoopback 重写**：重写所服务的 `dsh-client-connection` 的 client.js，使浏览器端 `isLoopback` 恒为 `true`，插件配置卡片可在非本机渲染。

## 依赖前提

- webserver 必须绑定 `0.0.0.0`（本插件的 `cordis.patch.yml` 已配置 `host: 0.0.0.0, port: 3080`），此时 `resolveLanTrust` 会自动把全部局域网 IPv4 加入信任名单（非特权 `/api` 围栏）。
- 插件通过 `inject: ['webServer', 'apiProxy']` 使用宿主服务。
- dsh 安装位置探测：`/usr/local/lib/node_modules/@deepseek-ai/dsh` 或 `/usr/lib/node_modules/@deepseek-ai/dsh`（当前 111/112 均为前者）。

## 安装

### 标准安装（推荐，dsh plugin add）

```bash
# 1. 把本文件夹同步到目标机（以 112 为例）
rsync -a web-lan/ root@<host>:/root/.dsh/external/web-lan/
# 2. 安装（link 方式，包名 @user/dsh-web-lan 自动进入 profile 依赖并登记 bundle）
dsh plugin --profile web add link:/root/.dsh/external/web-lan
# 3. 重启 dsh web 后生效
```

安装时 `package.json` 的 `dsh.bundle.patch → cordis.patch.yml` 会自动作为 profile 的 patch 层应用（webserver 0.0.0.0 + insert web-lan），**无需再手动改 profile 的 `cordis.patch.yml`**。

### 手动安装（旧方式，不推荐）

```bash
# 在 profile 的 node_modules 下建 symlink：
#   /root/.dsh/profiles/node_modules/@user/dsh-web-lan -> <插件目录>
# 并在 profile 的 cordis.patch.yml 中手动加入：
#   - id: webserver
#     config: { host: 0.0.0.0, port: 3080 }
#   - insert:
#       - id: web-lan
#         name: '@user/dsh-web-lan'
```

## 卸载

标准安装的：`dsh plugin --profile web remove @user/dsh-web-lan`，再重启 dsh web。

旧手动安装的：删除 `profiles/node_modules/@user/dsh-web-lan` symlink，并移除 profile `cordis.patch.yml` 里的 webserver + insert 两行，再重启。

## 验证方法（部署后）

```bash
# 1. 端口绑定（应为 0.0.0.0:3080）
ss -tlnp | grep 3080

# 2. index.html 已注入 polyfill（含标记）
curl -s http://127.0.0.1:3080/ | grep dsh-web-lan-polyfill

# 3. client.js isLoopback 已重写（局域网 IP 访问，验证非 loopback 场景）
curl -s http://<本机局域网IP>:3080/plugins/@deepseek-ai/dsh-client-connection/client.js | grep isLoopback

# 4. 特权 API relay 生效：从另一台机器访问（非 loopback 来源），
#    返回正常业务响应（而非 403/404/500）
curl -X POST http://<本机局域网IP>:3080/api/settings.describe -H 'content-type: application/json' -d '{}'
```

## 注意事项

- 插件会改写 `dsh-client-connection` 的 client.js 与 index.html，**全局开放**特权 API——仅建议在可信局域网使用；如需暴露公网请搭配认证/反代。
- 纯 HTTP 局域网场景下，浏览器把 `192.168.31.x` 视为"不安全来源"，polyfill 正是为此设计；若走 HTTPS 则不需要第 1 项。
- 本插件由 dsh-plugin 仓库维护（本目录 `web-lan/`），早期临时版本曾存放于 `/root/AI/deepseek/dsh-web-lan`（已废弃，正式部署以本目录为准）。

## 部署目标

- **AI-2（192.168.31.112）**：验证机，先部署验证。
- **AI 主机（192.168.31.111）**：正式使用；部署时先卸载旧版（`/root/AI/deepseek/dsh-web-lan` 手动安装），再按上述标准方式安装。
