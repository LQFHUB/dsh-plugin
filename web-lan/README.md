# web-lan：dsh Web 局域网直连支持（精简版）

`@npm-liqingfeng/dsh-web-lan` —— 一个 **host 侧** dsh 插件，让局域网（或远程）设备访问 dsh Web 时**免 token 直连**并**获得完整配置能力**（插件配置卡等）。

> 🏗️ **v2.2（适配 dsh v0.1.2-alpha.2）**：官方已原生覆盖局域网访问的绝大部分，本插件只补官方未覆盖的两件事。已移除：apiProxy 特权 API relay（官方 `trustedHosts` 原生放行，且 `dsh-host-apiproxy` 在 alpha 系列已不存在）、randomUUID polyfill（官方前端用 `crypto.getRandomValues` 自实现 UUID）。

## 解决什么问题

官方 v0.1.2-alpha.2 已原生支持局域网访问骨架（`webserver host:0.0.0.0` + `trustedHosts` 放行 + token 认证），但仍有两处未覆盖：

1. **插件配置卡片不渲染**：浏览器端 `isLoopback` 标志为 false 时，官方 settings 配置面走 memory 模式，插件配置 UI（设置卡等）不在非本机渲染。
2. **局域网首次访问需 token**：官方 index 认证（browser-auth）对无 cookie 请求一律 401 + 提示，且 token 每次启动随机——局域网设备首次访问体验差。

## 功能（两件事）

1. **isLoopback 重写**：把安装的 `dsh-client-connection` 包 `lib/client.js` 里的 `isLoopback` 表达式重写为恒 `true`。官方 `client-modules` 的 `serveBundle` 从磁盘文件构建 bundle 响应，改文件即改响应内容——局域网设备的浏览器因此走 host 配置模式，插件配置卡正常渲染。

2. **局域网免 token 认证**：把 `dsh-client-connection` 的 host 半区（`lib/index.js`，含 browser-auth 认证逻辑）改为——本机 / 局域网私有 IP（`10.x` / `192.168.x` / `172.16-31.x`）来源的请求在 index 认证层**直接放行**（免 token、免首次带 token 访问）；**公网 Host（非私有 IP）仍走官方 token 认证**，安全边界保留。

> 📝 不需要做的事（官方已覆盖）：
> - **特权 API 放行**：webserver 绑定 `0.0.0.0` 后，官方 runtime 自动把局域网 IP 推导进 `trustedHosts`，`/api` 特权方法对局域网放行。
> - **crypto.randomUUID polyfill**：官方前端 UUID 一律基于 `crypto.getRandomValues` 自实现，纯 HTTP 局域网非安全来源同样可用。

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

> ⚠️ **生效时机**：两个补丁都修改 dsh-client-connection 包文件，host / client-modules 在启动时从磁盘加载，**部署后需重启 dsh web** 生效。建议部署时先执行补丁再重启，一次到位：
>
> ```bash
> cd /root/.dsh/profiles/web
> node --input-type=module -e "import('./node_modules/@npm-liqingfeng/dsh-web-lan/lib/index.js').then(m=>{m.patchClientJsFile();m.patchBrowserAuthFile()})"
> ```

## 卸载

标准安装的：`dsh plugin --profile web remove @npm-liqingfeng/dsh-web-lan`，再重启 dsh web。

> ⚠️ 卸载后 `dsh-client-connection` 包文件保持补丁状态（`isLoopback: true` / 局域网免认证）——如需还原官方默认行为，请用 `npm -g install @deepseek-ai/dsh@alpha --force` 重装，或手动还原该包两个文件。

## 验证方法（部署后）

```bash
# 1. 端口绑定（应为 0.0.0.0:3080）
ss -tlnp | grep 3080

# 2. client.js isLoopback 已重写（磁盘文件）
grep -o "isLoopback: true" /usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/client.js

# 3. 局域网免认证生效：无 cookie 直接从局域网访问根路径应 200（而非 401）
curl -s -o /dev/null -w "%{http_code}\n" http://192.168.31.112:3080/

# 4. 局域网设备打开 http://<本机局域网IP>:3080/ 直接进入（免 token），
#    进「设置 → 插件配置」应看到主题 / 提示音 / 图像理解等配置卡。
```

## 注意事项

- **安全权衡**：局域网私有 IP（`10.x` / `192.168.x` / `172.16-31.x`）来源**免 token 直接访问**——局域网内任意设备可打开 dsh（无密码）。**公网 Host（如域名 / 公网 IP）仍走官方 token 认证**，除非你把 dsh 暴露到公网私有段无法识别。仅在可信局域网启用本插件。
- 插件会改写 `dsh-client-connection` 包两个文件（`lib/client.js` 的 `isLoopback`、`lib/index.js` 的认证放行）。服务器端信任边界（`trustedHosts`/token）在公网场景仍生效。
- dsh 升级（npm -g 重装）会覆盖这两个文件，本插件 apply 会在下次启动时幂等重写（重启后生效）。
- 重写正则依赖官方实现形态（`isLoopback` 表达式不含逗号、authorizeIndex 放行行文本）；若未来 dsh 版本结构变化，补丁会告警或不再命中（`patch*File` 有完整性/幂等校验，不静默破坏）。
- 本插件由 dsh-plugin 仓库维护（本目录 `web-lan/`），早期临时版本曾存放于 `/root/AI/deepseek/dsh-web-lan`（已废弃，正式部署以本目录为准）。

## 部署目标

- **AI-2（192.168.31.112）**：验证机，先部署验证。
- **AI 主机（192.168.31.111）**：正式使用；部署时先卸载旧版（`/root/AI/deepseek/dsh-web-lan` 手动安装），再按上述标准方式安装。
