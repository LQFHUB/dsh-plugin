# web-lan：dsh Web 局域网直连支持（精简版）

`@npm-liqingfeng/dsh-web-lan` —— 一个 **host 侧** dsh 插件，让 dsh Web UI 可以从局域网（或远程）直接访问，**无需 Nginx 等反向代理**，并且局域网客户端能获得完整配置能力。

> 🏗️ **v2.0（适配 dsh v0.1.2-alpha.2）**：官方已原生覆盖"局域网访问"的绝大部分，本插件大幅精简——**移除 apiProxy 特权 API relay**（官方 `trustedHosts` + LAN IP 自动推导已放行特权方法，且 `dsh-host-apiproxy` 在 alpha 系列已不存在），只保留官方未覆盖的两件事。

## 解决什么问题

官方 v0.1.2-alpha.2 已原生支持局域网访问的骨架（`webserver host:0.0.0.0` + `trustedHosts` 放行 + token 认证），但仍有两处未覆盖，由本插件补齐：

1. **`crypto.randomUUID` 不可用**：该 Web API 只在安全上下文（HTTPS / localhost）存在，纯 HTTP 的局域网页面里浏览器没有它，前端部分逻辑可能报错。
2. **插件配置卡片不渲染**：浏览器端 `isLoopback` 标志为 false 时，官方 settings 配置面走 memory 模式（`settings describe` 不可用），插件配置 UI（设置卡等）不渲染。

## 功能（两件事）

1. **randomUUID polyfill**：向 `index.html` 的 `<head>` 注入 RFC 4122 v4 实现（基于 `crypto.getRandomValues`），标记为 `<!--dsh-web-lan-polyfill-->`。
2. **isLoopback 重写**：把安装的 `dsh-client-connection` 包 `lib/client.js` 里的 `isLoopback` 表达式重写为恒 `true`。官方 `client-modules` 的 `serveBundle` 从磁盘文件构建 bundle 响应，改文件即改响应内容——局域网设备的浏览器因此走 host 配置模式，插件配置卡正常渲染。

## 依赖前提

- webserver 必须绑定 `0.0.0.0`（本插件的 `cordis.patch.yml` 已配置 `host: 0.0.0.0, port: 3080`），官方 runtime 自动把局域网 IP 推导进 `trustedHosts`（特权 `/api` 围栏放行，无需本插件 relay）。
- 访问认证走官方 token 机制（首次 `?token=` 访问种 30 天 cookie）。
- 插件通过 `inject: ['webServer']` 使用宿主服务（不再需要 `apiProxy`）。
- dsh 安装位置探测：`/usr/local/lib/node_modules/@deepseek-ai/dsh` 或 `/usr/lib/node_modules/@deepseek-ai/dsh`（当前 111/112 均为前者）。

## 安装

### 标准安装（推荐，dsh plugin add）

```bash
# 方式一：npm 安装（已发布到 npm registry，推荐）
dsh plugin --profile web add @npm-liqingfeng/dsh-web-lan

# 方式二：link 安装（源码目录，用于本地开发）
rsync -a web-lan/ root@<host>:/root/.dsh/external/web-lan/
dsh plugin --profile web add link:/root/.dsh/external/web-lan
# 安装后重启 dsh web 生效
```

安装时 `package.json` 的 `dsh.bundle.patch → cordis.patch.yml` 会自动作为 profile 的 patch 层应用（webserver 0.0.0.0 + insert web-lan），**无需再手动改 profile 的 `cordis.patch.yml`**。

> ⚠️ **isLoopback 重写生效时机**：`client-modules` 在服务启动时从磁盘文件构建 bundle 响应，因此**部署后需重启 dsh web** 使重写生效（apply 会在每次启动时幂等重写文件；若你的 profile 已手动配置了 webserver 0.0.0.0 而无需本插件的 patch，可手动从 `cordis.patch.yml` 移除 webserver 行，只保留 insert）。

## 卸载

标准安装的：`dsh plugin --profile web remove @npm-liqingfeng/dsh-web-lan`，再重启 dsh web。

> 卸载后 `dsh-client-connection` 的 client.js 保持重写状态（`isLoopback: true`），如需还原请用 `npm -g install @deepseek-ai/dsh@alpha --force` 重装或手动还原该文件。

## 验证方法（部署后）

```bash
# 1. 端口绑定（应为 0.0.0.0:3080）
ss -tlnp | grep 3080

# 2. index.html 已注入 polyfill（含标记）
curl -s http://127.0.0.1:3080/ | grep dsh-web-lan-polyfill

# 3. client.js isLoopback 已重写（磁盘文件）
grep -o "isLoopback: true" /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.js

# 4. 局域网设备（非 loopback）访问：官方特权 API 已放行（trustedHosts 原生），
#    配置卡经 isLoopback 重写正常渲染。从另一台电脑打开：
#    http://<本机局域网IP>:3080/?token=<dsh web 启动日志中的 token>
#    首次认证后进「设置 → 插件配置」应看到主题 / 提示音 / 图像理解等配置卡。
```

## 注意事项

- 插件会改写 `dsh-client-connection` 的 client.js（`isLoopback` 恒 true）与 index.html（polyfill）。isLoopback=true 让局域网浏览器获得 host 配置模式，但**服务器端信任边界仍在**（`trustedHosts`/token 认证），不会向公网开放。
- 纯 HTTP 局域网场景下，浏览器把 `192.168.31.x` 视为"不安全来源"，polyfill 正是为此设计；若走 HTTPS 则不需要第 1 项。
- dsh 升级（npm -g 重装）会覆盖 client.js，本插件 apply 会在下次启动时幂等重写（重启后生效）。
- 本插件由 dsh-plugin 仓库维护（本目录 `web-lan/`），早期临时版本曾存放于 `/root/AI/deepseek/dsh-web-lan`（已废弃，正式部署以本目录为准）。

## 部署目标

- **AI-2（192.168.31.112）**：验证机，先部署验证。
- **AI 主机（192.168.31.111）**：正式使用；部署时先卸载旧版（`/root/AI/deepseek/dsh-web-lan` 手动安装），再按上述标准方式安装。
