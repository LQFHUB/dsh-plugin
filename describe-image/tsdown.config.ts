/**
 * dsh-describe-image 自包含构建配置（tsdown）。
 *
 * 两个构建面：
 * - node 半区（lib/index.js + lib/invariant.js，ESM）：工具注册 + attach
 *   路由 + 设置 section + HTTP 客户端。`@deepseek-ai/*` 与 schemastery
 *   一律 external（运行时由宿主模块表提供 / 宿主安装携带）。
 * - 浏览器半区（lib/client.js，CJS）：入口 src/client/index.ts。external
 *   依赖经注入的 require 从 loader 模块表解析（react 与官方 client 包，
 *   与 DSH 官方 client bundle 一致）；banner/footer 把 CJS 产物包装成
 *   window.__ModuleLoader__.load({ id, factory(require) }) 格式。
 */
import { defineConfig } from 'tsdown'

/** client bundle 注册 id（与 cordis.patch.yml insert id 一致）。 */
const CLIENT_ID = 'dsh-describe-image'

/** 浏览器半区经 loader 模块表解析的 external：react 与官方 client 包。 */
const CLIENT_EXTERNALS: readonly string[] = [
  'react',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-runtime/client',
  '@deepseek-ai/dsh-client-ui-conversation/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-slots',
]

/** __ModuleLoader__ 包装头：factory 闭包内的 CJS 宿主。 */
const CLIENT_BANNER = `window.__ModuleLoader__.load({
\tid: ${JSON.stringify(CLIENT_ID)},
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
`

/** __ModuleLoader__ 包装尾：返回表层并闭合调用。 */
const CLIENT_FOOTER = `
\t\treturn module.exports;
\t}
});
`

export default defineConfig([
  {
    // node 半区：ESM，node 目标。
    name: 'lib',
    entry: {
      index: 'src/index.ts',
      invariant: 'src/invariant.ts',
    },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir: 'lib',
    deps: {
      // @deepseek-ai/*（含 @deepseek-ai/schemastery）：运行时由宿主安装树提供。
      neverBundle: [/^@deepseek-ai\//],
    },
    outExtension: () => ({ js: '.js' }),
    clean: true,
  },
  {
    // 浏览器半区：CJS + __ModuleLoader__ 包装，输出 lib/client.js。
    name: 'client',
    entry: {
      client: 'src/client/index.ts',
    },
    format: ['cjs'],
    target: 'es2022',
    platform: 'browser',
    outDir: 'lib',
    deps: {
      // react 与官方 client 包：经注入的 require 从 loader 模块表解析。
      neverBundle: CLIENT_EXTERNALS,
    },
    banner: { js: CLIENT_BANNER },
    footer: { js: CLIENT_FOOTER },
    outExtension: () => ({ js: '.js' }),
  },
])
