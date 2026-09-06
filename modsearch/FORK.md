# ModSearch 自维护版（fork 说明）

本目录是从上游 [liustack/modsearch](https://github.com/liustack/modsearch)（v5.10.1）拉取的**自维护 fork**，由本仓库（`dsh-plugin`）维护。上游源码与文档（`README.md`、`AGENTS.md`、`docs/`、`skills/`）原样保留，本文件只说明 fork 差异与维护方法。

## 为什么 fork

上游 5.10.1 的 dsh 插件设置卡路由 `/modsearch/config` 使用**独立实现的 loopback fence**（`dsh/index.js` 的 `isTrustedRequest`），只信任 `localhost`/`127.x`/`::1` Host。当 dsh web 绑定 `0.0.0.0`、用户经局域网 IP（如 `http://192.168.31.111:3080`）访问时，设置卡请求一律 403：

```json
{"error":"request refused: this route answers same-origin loopback only"}
```

官方 dsh 的 `/api` fence 则有 `trustedHosts` 机制：`dsh-web-app` 从 all-interface bind 自动推导 LAN IP 字面量（`resolveLanTrust`），`client-connection` 用它放行 LAN 访问。modsearch 的独立 fence 没跟上该机制，导致 **LAN 部署下官方 UI 一切正常、唯独 modsearch 设置卡 403**。

> 影响面：仅浏览器设置卡（引擎 key / 首选引擎 / 自动引擎链配置）。`web_search` / `x_search` / `read_page` 工具走服务端 CLI 子进程，不经此 HTTP 路由，**不受影响**。

## 与上游的差异（相对 v5.10.1）

| 文件 | 差异 | 说明 |
|:---|:---|:---|
| `dsh/index.js` | ① 设置卡路由的 scoped inject 由 `['webServer']` 改为 `['webServer','connection']`；② 新增 `isTrustedAuthorityHost()`（复刻官方 `client-connection` 的 `isTrustedAuthority` 匹配逻辑：无端口条目匹配任意端口、带端口条目精确匹配）；③ `isTrustedRequest(req, trustedHosts)` 增加 trustedHosts 判定，`registerConfigRoute` 从 `ctx.connection.trustedHosts` 读取 | 核心修复：卡片 fence 跟随官方 `/api` fence 的受信 Host 列表（all-interface 推导的 LAN IP + `--trusted-host` 条目），`sec-fetch-site`/`origin` 同源检查保留不变 |
| `src/dshPlugin.test.ts` | ① 注入断言改为 `['webServer','connection']`；② `house()`/`withConfig()` 支持注入 `connection.trustedHosts`；③ 新增「LAN 受信 Host 放行 / 未受信局域网 IP 仍 403」测试 | 与修复同步的测试 |
| `pnpm-workspace.yaml` | `allowBuilds.esbuild: true` | pnpm 11 默认忽略构建脚本，esbuild 需放行否则 `pnpm build` 失败（上游留了占位待维护者填写） |
| `FORK.md` | 本文件 | fork 说明 |

## 构建

```bash
pnpm install   # 已放行 esbuild 构建脚本
pnpm build     # 生成 dist/main.js（CLI，dsh/index.js 运行时依赖 ../dist/main.js）
pnpm test      # 单元测试（含 fork 新增用例）
```

## 部署（111 实测流程）

工作区在 NFS（`/mnt/ug/share`，111 已挂载），但 **dsh 服务读取的是 111 本机路径**，故部署到 `/root/.dsh/external/modsearch`（与 theme-center/describe-image/notify-sound 同机制）：

```bash
# 1. 先在工作区构建（见上）
# 2. rsync 到 111 本机（排除 node_modules 与构建缓存）
rsync -a --exclude node_modules/ --exclude .git/ \
  /mnt/ug/share/devInstall/project/deepseek/dsh-plugin/modsearch/ \
  /root/.dsh/external/modsearch/
# 3. web profile 改为 link: 引用
#    /root/.dsh/profiles/web/package.json:
#      "@liustack/modsearch": "^5.10.1" → "link:/root/.dsh/external/modsearch"
# 4. 重装依赖 + 重启 dsh web（111 为 systemd 服务 dsh-web.service）
cd /root/.dsh/profiles/web && pnpm install
systemctl restart dsh-web
# 5. 验证：局域网 IP Host 不再 403
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: 192.168.31.111:3080" \
  http://127.0.0.1:3080/modsearch/config   # 期望 200
```

回滚：`package.json` 改回 `^5.10.1` + `pnpm install` + 重启。

## 升级跟随（上游发布新版本时）

```bash
# 在 modsearch/ 目录内（或临时 clone 对比）：
git diff <上游新版本> -- dsh/index.js src/dshPlugin.test.ts   # 查看上游是否动过这两处
```

- 若上游 `dsh/index.js` 有更新：合并到本 fork 后**重打本 fork 的 3 处修改**（可用 `git diff` 对比本 fork 与上游，见上表）。
- 若上游**已原生修复** LAN 信任问题（`isTrustedRequest` 开始读取 `trustedHosts`）：可放弃 fork、改回官方包。
- 升级后必须重新 `pnpm build` 并重新部署（见上）。

## 备注

- 未改动的上游约定（`modsearch/AGENTS.md`）继续适用：`dsh/` 保持 node builtins only、无构建步骤、与 `src/schema.ts` 的 schema 同步等。
- 本 fork 改动可作为上游 PR 素材（设置卡 fence 与 `/api` fence 对齐是合理修复方向），是否提交由用户决定。
