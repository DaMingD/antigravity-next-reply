# Antigravity Next Reply 快捷回复插件

一个为 **Google Antigravity** 打造的本地插件，基于 **MCP App** 内联交互组件实现，模拟 Claude Code 的下一句回复预测体验。

## 功能特点

- **上下文智能预判**：每次 Agent 完成实质性回复后，自动在消息下方渲染 2～3 条第一人称的下一步快捷回复胶囊。
- **一键点击发送**：点击任意胶囊即可直接通过 `app.sendMessage()` 发送到当前对话，无需手动打字。
- **就地微调再发**：点击胶囊右侧的 `✎` 按钮，可在行内修改几个字后按 `Enter` 发送。
- **原生主题自适应**：自动读取 Antigravity 宿主主题变量，无缝适配浅色与深色模式。
- **独立插件开关**：可在 Antigravity 的 **Customizations / Plugins（自定义与插件）** 页面随时一键启用或关闭。

## 安装方式

需要本机已安装 **Node.js 18+**。执行以下两条命令即可安装并构建：

```bash
git clone https://github.com/DaMingD/antigravity-next-reply.git ~/.gemini/config/plugins/next-reply
cd ~/.gemini/config/plugins/next-reply/server && npm install && npm run build:ui
```

Antigravity 会自动发现 `~/.gemini/config/plugins/next-reply` 目录下的插件，无需重启即可生效。

## 目录结构

```text
antigravity-next-reply/
├── plugin.json           # 插件清单与元信息
├── mcp_config.json       # MCP 服务器启动配置（基于 ${PLUGIN_ROOT}）
├── rules/AGENTS.md       # 驱动 Agent 自动调用 suggest_replies 的插件规则
├── assets/logo.svg       # 插件图标
└── server/
    ├── package.json
    ├── server.mjs        # Node.js MCP 服务器（暴露 suggest_replies 工具与 ui:// 资源）
    ├── build-ui.mjs      # 使用 esbuild 打包单文件内联 HTML
    └── ui/app.ts         # 基于 @modelcontextprotocol/ext-apps 的交互界面
```

## 本地开发与调试

修改 `server/ui/app.ts` 或 `server/build-ui.mjs` 后，重新构建即可：

```bash
cd server
npm run build:ui
```

如需在不重启服务的情况下快速调试 UI，可在启动环境里设置 `NEXT_REPLY_APP_HTML` 指向构建出的 HTML 文件路径。
