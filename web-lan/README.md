# web-lan：dsh Web 局域网直连支持（精简版）

`@npm-liqingfeng/dsh-web-lan` —— 一个 **host 侧** dsh 插件，让局域网（或远程）设备访问 dsh Web 时能获得**完整配置能力**（插件配置卡等）。

> 🏗️ **v2.1（适配 dsh v0.1.2-alpha.2）**：官方已原生覆盖"局域网访问"的绝大部分，本插件只保留官方未覆盖的一件事。已移除：apiProxy 特权 API relay（官方 `trustedHosts` + LAN IP 自动推导已放行，且 `dsh-host-apiproxy` 在 alpha 系列已不存在）、randomUUID polyfill（官方前端一律用 `crypto.getRandomValues` 自实现 UUID，明确针对纯 HTTP 局域网非安全来源，无需 polyfill）。

## 解决什么问题

官方 v0.1.2-alpha.2 已原生支持局域网访问骨架（`webserver host:0.0.0.0` + `trustedHosts` 放行 + token 认证），但仍有一处未覆盖：

**插件配置卡片不渲染**：浏览器端 `isLoopback` 标志为 false 时，官方 settings 配置面走 memory 模式（`settings describe` 不可用），插件配置 UI（设置卡等）不在非本机渲染。

## 功能（一件事）

**isLoopback 重写**：把安装的 `dsh-client-connection` 包 `lib/client.js` 里的 `isLoopback` 表达式重写为恒 `true`。官方 `client-modules` 的 `serveBundle` 从磁盘文件构建 bundle 响应，改文件即改响应内容——局域网设备的浏览器因此走 host 配置模式，插件配置卡正常渲染。

> 📝 不需要做的事（官方已覆盖）：
> - **特权 API 放行**：webserver 绑定 `0.0.0.0` 后，官方 runtime 自动把局域网 IP 推导进 `trustedHosts`，`/api` 特权方法对局域网放行（无需 relay）。
> - **crypto.randomUUID polyfill**：官方前端 UUID 一律基于 `crypto.getRandomValues` 自实现（`@deepseek-ai/dsh-util-crypto` 的 `randomUUID` / connection 的 `randomUuid`），纯 HTTP 局域网非安全来源同样可用，且 lint 禁止直接调用 `crypto.randomUUID`。
> - **访问认证**：走官方 token 机制（首次 `?token=` 访问种 30 天 cookie）。

## 依赖前提

- webserver 必须绑定 `0.0.0.0`（本插件的 `cordis.patch.yml` 已配置 `host: 0.0.0.0, port: 3080`），官方 runtime 自动把局域网 IP 推导进 `trustedHosts`。
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

> ⚠️ **isLoopback 重写生效时机**：`client-modules` 在服务启动时从磁盘文件构建 bundle 响应，因此**部署后需重启 dsh web** 使重写生效。建议部署时先执行 `patchClientJsFile()`（`node --input-type=module -e "import('./node_modules/@npm-liqingfeng/dsh-web-lan/lib/index.js').then(m=>m.patchClientJsFile())"`）再重启，一次到位。

## 卸载

标准安装的：`dsh plugin --profile web remove @npm-liqingfeng/dsh-web-lan`，再重启 dsh web。

> ⚠️ 卸载后 `dsh-client-connection` 的 client.js 保持重写状态（`isLoopback: true`）——如需还原官方默认行为，请用 `npm -g install @deepseek-ai/dsh@alpha --force` 重装，或手动把该文件的 `isLoopback: true` 还原为原始表达式（或在 112 上执行 `npm -g install @deepseek-ai/dsh@alpha --force` 后重启）。

## 验证方法（部署后）

```bash
# 1. 端口绑定（应为 0.0.0.0:3080）
ss -tlnp | grep 3080

# 2. client.js isLoopback 已重写（磁盘文件）
grep -o "isLoopback: true" /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.js

# 3. 局域网设备（非 loopback）访问：官方特权 API 已放行（trustedHosts 原生），
#    配置卡经 isLoopback 重写正常渲染。从另一台电脑打开：
#    http://<本机局域网IP>:3080/?token=<dsh web 启动日志中的 token>
#    首次认证后进「设置 → 插件配置」应看到主题 / 提示音 / 图像理解等配置卡。
```

## 注意事项

- 插件会改写 `dsh-client-connection` 的 client.js（`isLoopback` 恒 true）。isLoopback=true 让局域网浏览器获得 host 配置模式，但**服务器端信任边界仍在**（`trustedHosts`/token 认证），不会向公网开放。
- dsh 升级（npm -g 重装）会覆盖 client.js，本插件 apply 会在下次启动时幂等重写（重启后生效）。
- 重写正则依赖 `isLoopback` 表达式不含逗号（alpha.2 满足）；若未来 dsh 版本表达式引入逗号，`patchClientJsFile` 会告警提示正则需更新。
- 本插件由 dsh-plugin 仓库维护（本目录 `web-lan/`），早期临时版本曾存放于 `/root/AI/deepseek/dsh-web-lan`（已废弃，正式部署以本目录为准）。

## 部署目标

- **AI-2（192.168.31.112）**：验证机，先部署验证。
- **AI 主机（192.168.31.111）**：正式使用；部署时先卸载旧版（`/root/AI/deepseek/dsh-web-lan` 手动安装），再按上述标准方式安装。
