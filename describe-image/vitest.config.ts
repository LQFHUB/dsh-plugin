/**
 * vitest 配置：测试所需的 @deepseek-ai/dsh-* 包（dsh-tools、dsh-settings、
 * dsh-agent 等）未发布到 npm 的 0.1.0-rc.6 版本，运行时由宿主模块表提供；
 * 测试从本机 DSH 全局安装树解析它们（npm root -g 下的 dsh 安装）。
 * 机器上装有 DSH（dsh CLI 全局安装）即可运行 pnpm test。
 * @module dsh-describe-image/vitest
 */
import { execSync } from 'node:child_process'
import { defineConfig } from 'vitest/config'

/** 本机 DSH 全局安装下的 @deepseek-ai 包目录。 */
const dshPkgs = execSync('npm root -g').toString().trim() + '/@deepseek-ai/dsh/node_modules/@deepseek-ai'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
  resolve: {
    alias: [
      // @deepseek-ai/dsh-* 与 @deepseek-ai/dsh-*/<子路径> → 本机 DSH 安装树。
      { find: /^@deepseek-ai\/(dsh-[a-z0-9-]+)$/, replacement: `${dshPkgs}/$1` },
      { find: /^@deepseek-ai\/(dsh-[a-z0-9-]+)\/(.+)$/, replacement: `${dshPkgs}/$1/$2` },
    ],
  },
})
