# Commit Genie

使用 DeepSeek/OpenAI API 审查 Git 变更，生成符合约定的常规提交消息。

![Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-genie?style=flat-square)
![Installs](https://img.shields.io/visual-studio-marketplace/i/joygqz.commit-genie?style=flat-square)
![Rating](https://img.shields.io/visual-studio-marketplace/r/joygqz.commit-genie?style=flat-square)
![License](https://img.shields.io/github/license/joygqz/commit-genie?style=flat-square)

## 功能特性

- 🤖 智能分析代码变更，生成语义化的提交信息
- 🌐 支持多种语言的提交信息（中文、英文、日文等19种语言）
- 🚀 基于 DeepSeek/OpenAI API，生成质量更高
- ⚡ 一键生成，无需手动编写提交信息
- 🔧 支持自定义 API 配置

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
