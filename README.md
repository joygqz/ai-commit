# Commit Genie

[![Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-genie?style=flat-square&logo=visual-studio-code&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)

Use OpenAI SDK compatible APIs to intelligently analyze Git changes and automatically generate standard commit messages.

## Features

- 🤖 **AI-Powered**: Leverages OpenAI-compatible APIs to generate meaningful commit messages
- 🌐 **Multi-Language Support**: Generate commit messages in 19+ languages
- 🔄 **Model Selection**: Easily switch between available AI models
- ⚡ **Real-time Generation**: Stream commit messages directly to Git input box
- 🎨 **Emoji Support**: Optional emoji prefixes for commit messages

## Getting Started

### Required Configuration

Before using Commit Genie, you **must** configure the following settings:

1. **API Key** (`commit-genie.service.apiKey`) - Required for authentication
2. **Base URL** (`commit-genie.service.baseURL`) - API endpoint (default: DeepSeek)
3. **Model** (`commit-genie.service.model`) - AI model to use (use "Select Available Model" command to choose)

### Quick Setup

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "Commit Genie"
3. Configure your API Key and Base URL
4. Run "Commit Genie: Select Available Model" to choose a model
5. Stage your changes and click the <img src="images/logo.png" width="20" height="20" /> icon in Source Control

## Commands

### Generate Commit Message

**Command:** `commit-genie.generateCommitMessage`

Generate intelligent commit messages from your staged Git changes.

- **Requirements:** API Key, Base URL, and Model must be configured
- **Usage:** Click the <img src="images/logo.png" width="16" height="16" /> icon in Source Control or run the command from Command Palette

### Select Available Model

**Command:** `commit-genie.selectAvailableModel`

Browse and select from available AI models provided by your API endpoint.

- **Requirements:** API Key and Base URL must be configured
- **Usage:** Run from Command Palette to see and switch between available models

## Configurations

### Service Configuration

#### `commit-genie.service.apiKey` ✅ Required

API key for authentication with your AI service provider.

- **Type:** `string`
- **Default:** `""` (empty)
- **Note:** Must be configured before using any features

#### `commit-genie.service.baseURL` ✅ Required

Base URL of the AI service API endpoint.

- **Type:** `string`
- **Default:** `"https://api.deepseek.com"`
- **Note:** Must be configured before using any features

#### `commit-genie.service.model`

AI model to use for generating commit messages.

- **Type:** `string`
- **Default:** `"deepseek-chat"`
- **Required:** Only for generating commit messages
- **Tip:** Use "Select Available Model" command to choose from available options

### Format Configuration

#### `commit-genie.format.commitMessageLanguage`

Language for generated commit messages.

- **Type:** `string`
- **Default:** `"Simplified Chinese"`
- **Options:** 19 languages including English, Chinese, Japanese, Korean, German, French, Spanish, and more

#### `commit-genie.format.enableEmojiPrefix`

Add emoji prefix to commit messages (e.g., ✨ feat, 🐛 fix, 📝 docs).

- **Type:** `boolean`
- **Default:** `false`

## Supported Languages

Generate commit messages in your preferred language:

- English
- Simplified Chinese (简体中文)
- Traditional Chinese (繁體中文)
- Japanese (にほんご)
- Korean (한국어)
- German (Deutsch)
- French (française)
- Spanish (español)
- Italian (italiano)
- Portuguese (português)
- Russian (русский)
- And more...

## License

[MIT License](LICENSE)
