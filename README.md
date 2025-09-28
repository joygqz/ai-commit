# Commit Genie

一个 VS Code 插件，使用 DeepSeek/OpenAI API 智能分析 Git 变更，自动生成符合规范的提交消息。

## 功能特性

- 📦 VS Code 原生插件，集成在源代码管理面板中
- 🤖 智能分析代码变更，生成语义化的提交信息
- 🌐 支持多种语言的提交信息（中文、英文、日文等19种语言）
- 🚀 基于 DeepSeek/OpenAI API，生成质量更高
- ⚡ 一键生成，无需手动编写提交信息
- 🔧 支持自定义 API 配置

## 安装

在 VS Code 扩展市场搜索 "Commit Genie" 并安装，或通过以下方式安装：

1. 打开 VS Code
2. 按 `Ctrl+Shift+X` (Windows/Linux) 或 `Cmd+Shift+X` (Mac) 打开扩展面板
3. 搜索 "Commit Genie"
4. 点击安装

## 使用方法

1. 在 Git 仓库中暂存需要提交的文件（`git add`）
2. 在源代码管理面板中点击 Commit Genie 按钮
3. 扩展会自动分析变更并生成提交信息

<!-- commands -->

| Command                              | Title                                 |
| ------------------------------------ | ------------------------------------- |
| `commit-genie.generateCommitMessage` | Commit Genie: Generate Commit Message |

<!-- commands -->

## 配置

在 VS Code 设置中配置以下选项：

<!-- configs -->

| Key                              | Description               | Type     | Default                      |
| -------------------------------- | ------------------------- | -------- | ---------------------------- |
| `commit-genie.MESSAGE_LANGUAGE`  | Commit message language.  | `string` | `"Simplified Chinese"`       |
| `commit-genie.DEEPSEEK_API_KEY`  | DeepSeek/OpenAI API Key.  | `string` | `""`                         |
| `commit-genie.DEEPSEEK_BASE_URL` | DeepSeek/OpenAI BASE URL. | `string` | `"https://api.deepseek.com"` |
| `commit-genie.DEEPSEEK_MODEL`    | DeepSeek/OpenAI Model.    | `string` | `"deepseek-chat"`            |

<!-- configs -->

## 许可证

MIT
