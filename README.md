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

| Command                              | Title                                 | Description                                                              |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| `commit-genie.generateCommitMessage` | Commit Genie: Generate Commit Message | Generate commit message from staged changes (requires all config)        |
| `commit-genie.selectAvailableModel`  | Commit Genie: Select Available Model  | Browse and select from available AI models (requires API Key & Base URL) |

## Configurations

| Key                                         | Description                                                                                                                          | Type      | Required | Default                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------- | ---------------------------- |
| `commit-genie.service.apiKey`               | API key for authentication with your AI service provider.                                                                            | `string`  | Yes      | `""`                         |
| `commit-genie.service.baseURL`              | Base URL of the AI service API endpoint.                                                                                             | `string`  | Yes      | `"https://api.deepseek.com"` |
| `commit-genie.service.model`                | AI model to use for generating commit messages. Use "Commit Genie: Select Available Model" command to choose from available options. | `string`  | No       | `"deepseek-chat"`            |
| `commit-genie.format.commitMessageLanguage` | Language for generated commit messages. Supports 19 languages including English, Chinese, Japanese, Korean, and more.                | `string`  | No       | `"Simplified Chinese"`       |
| `commit-genie.format.enableEmojiPrefix`     | Add emoji prefix to commit messages.                                                                                                 | `boolean` | No       | `false`                      |

*Required for generating commit messages, optional for selecting models.

## Validation Rules

Commit Genie validates your configuration before operations:

### Generate Commit Message
- ✅ API Key must be configured
- ✅ Base URL must be configured
- ✅ Model must be selected

### Select Available Model
- ✅ API Key must be configured
- ✅ Base URL must be configured

If validation fails, you'll receive a clear error message prompting you to complete the configuration.

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
