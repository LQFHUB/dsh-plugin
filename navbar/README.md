# navbar — 对话节点导航条

对话区左缘的等距节点串（每 user 消息一节点，贴左侧边栏右缘展示）：激活药丸跟随阅读位置、悬停预览卡、点击平滑滚动跳转。实现 [dsh-external/issues#144](https://github.com/deepseek-ai/dsh-external/issues/144) 规格，形态为官方 **bundle 插件**（`dsh.bundle` + dshClient 通道，**纯浏览器端**，Node half 为空 apply）。

> **复用声明**：本插件基于 [vlln/dsh-navbar](https://github.com/vlln/dsh-navbar)（MIT License，上游提交 `10e9d1546db2`，2026-08-15）——初始零修改复用；**2026-08-16 本地化改造**：定位由对话区右缘改为**贴左侧边栏右缘**（`sidebar.right + 12`，折叠态自动跟随窄条；窄窗口时钳制在对话流左缘左侧 8px，绝不侵入对话流；侧边栏定位两级锚点——按钮 aria-label 英文+中文，兜底官方分隔条 `[data-side="sidebar"]`），悬停预览卡由节点左侧弹出改为**右侧弹出**（朝对话区），定位参照与尺寸观察同步扩展（`src/client/index.ts` 与构建产物 `lib/client.js` 已同步）。所有代码、资源与许可归属上游；本目录仅做随仓库分发、部署与说明。

## 功能

| 功能 | 说明 |
|---|---|
| 节点导航条 | 对话区左缘纵向节点串（贴左侧边栏右缘，窄窗口自动避让对话流），每 user 消息一个圆点节点 |
| 跟随阅读位置 | 激活药丸（品牌蓝胶囊）随当前阅读位置移动 |
| 悬停预览 | 悬停节点显示消息预览卡（6 行截断，对齐官方 HoverCard 视觉） |
| 连续悬停 | 整条导航条（含节点间隙）连续响应悬停：预览随最近节点切换 + 对应药丸加长（灰色）指示点击落点，无死区 |
| 滚轮切换 | 光标悬停导航条时滚动滚轮：向上滚=上一条、向下滚=下一条（阻止对话区滚动） |
| 点击跳转 | 整条导航条可点（含间隙，按最近节点跳转）+ 药丸命中区放大 |
| 滑动窗口 | >11 节点时只显示窗口内节点（避免溢出），端点细点暗示更多 |
| 自动隐藏 | <2 条 user 消息或非对话页不显示 |
| 消息精选 pin | assistant 操作条（copy 与 Good response 之间）📌 按钮；精选轮次在导航条渲染为金色细长椭圆盘（恒可见、预览卡带 📌 徽标、点击直达被精选的回复），状态按会话持久化到 localStorage |

零数据通道依赖：只靠官方锚点属性（`data-time-hover-root`，0806 起 user 行）驱动，无轮询、无路由、无工具。

## 安装

**本机（111，AI 主机，正式使用）与 AI-2（112，验证机）均已部署**（`/root/.dsh/external/navbar`，link 方式安装，bundles 已登记）。

在任意机器安装：

```sh
# 方式一：npm 安装（已发布到 npm registry，推荐）
dsh plugin --profile web add @npm-liqingfeng/dsh-navbar

# 方式二：link 安装（源码目录，用于本地开发）
scp -r navbar/ root@<目标机>:/root/.dsh/external/navbar
dsh plugin --profile web add link:/root/.dsh/external/navbar
# 编辑 package.json：把 "@npm-liqingfeng/dsh-navbar" 追加进 dsh.profile.bundles
# 重启 web（112：/root/restart-dsh.sh；111：systemctl restart dsh-web.service）
```

装完**重启 web** 生效；**浏览器需强制刷新（Ctrl+Shift+R）** 加载新 client bundle；设置页「插件」面板可停用/启用。

## 使用

安装即用，无命令、无工具。对话页（Chat 视图）左缘（贴左侧边栏右侧）出现节点条；悬停看预览、点击跳转。`prefers-reduced-motion` 下禁用动画。

**精选 pin**：hover assistant 消息操作条，点 📌 把该回复选为精选——对应轮次的导航节点变为金色细长椭圆盘（点击直达该回复；预览卡显示 📌 徽标与回复文本）。精选状态按会话保存在浏览器 localStorage，刷新后保留；再点一次取消精选。

## 卸载 / 回滚

```sh
cd /root/.dsh/profiles/web
dsh plugin --profile web remove @npm-liqingfeng/dsh-navbar
# 编辑 package.json：从 dsh.profile.bundles 移除 "@npm-liqingfeng/dsh-navbar"
# 重启 web 生效；或直接删除 /root/.dsh/external/navbar 后重启
```

## 构建（如需改版重建）

```sh
pnpm install
pnpm run build      # tsdown：产出 lib/client.js（CJS + __ModuleLoader__ 包装）
```

- client：`src/client/index.ts`（自渲染 DOM + 官方锚点契约；pin 按钮走官方 `conversation.chat.assistant-actions` 插槽，React 由 client runtime 提供；访问的 ctx 服务须在插件对象 `inject` 中声明）
- Node half：`src/index.mjs`（空 apply，bundle 挂载载体）

## 许可

MIT License（DSH 生态示例插件，版权归上游 [vlln/dsh-navbar](https://github.com/vlln/dsh-navbar)）。
