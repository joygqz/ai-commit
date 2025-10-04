# Commit Genie

[![Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-genie?style=flat-square&logo=visual-studio-code&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)

AI-powered commit message generator with optional code review for VS Code. Generate meaningful, standard commit messages with optional pre-commit code review.

## ✨ Features

- 🤖 **AI-Powered**: Works with OpenAI-compatible APIs (DeepSeek, OpenAI, etc.)
- 🔍 **Code Review**: Optional pre-commit code review with 4 modes (off/lenient/standard/strict)
- 🌐 **Multi-Language**: Generate commit messages in 19+ languages
- ⚡ **Real-time Streaming**: See messages being generated instantly
- 🎨 **Emoji Support**: Optional emoji prefixes (e.g., ✨ feat, 🐛 fix)
- ✏️ **Custom Prompts**: Add custom instructions for both review and commit
- ❌ **Cancellable**: Stop generation anytime with the cancel button
- 🔄 **Smart Model Selection**: Browse and switch between AI models easily

## 🚀 Quick Start

1. **Install** the extension from VS Code Marketplace
2. **Configure API** (Press `Cmd/Ctrl + ,` to open Settings):
   - Set `commit-genie.service.apiKey` (your API key)
   - Set `commit-genie.service.baseURL` (default: `https://api.deepseek.com`)
3. **Select Model**: Run `Commit Genie: Select Available Model` from Command Palette
4. **Start Using**: Stage your changes and click the <img src="images/logo.png" width="16" height="16" /> icon in Source Control

## 📋 Usage

### Review and Commit (Recommended)

1. Stage your changes in Source Control
2. Click the <img src="images/logo.png" width="16" height="16" /> icon or run `Commit Genie: Review and Commit`
3. **Code Review** (if enabled):
   - AI analyzes your changes for potential issues
   - Shows errors/warnings with suggestions
   - Choose to continue or fix issues
4. **Commit Message**:
   - Watch the AI generate your commit message in real-time
   - Edit if needed and commit

**Tips:**
- Click cancel (×) to stop generation anytime
- Set `review.mode` to `off` to skip code review
- Adjust review strictness: `lenient` / `standard` / `strict`

### Select Model

Run `Commit Genie: Select Available Model` from Command Palette to:
- Browse available models from your API
- Switch to a different model
- See which model is currently active

## ⚙️ Configuration

### Service Settings (Required)

| Setting | Description | Example |
|---------|-------------|---------|
| `service.apiKey` ✅ | Your API key | `sk-...` |
| `service.baseURL` ✅ | API endpoint | `https://api.deepseek.com` |
| `service.model` | AI model name | `deepseek-chat` |

**Supported API Providers:**
- DeepSeek: `https://api.deepseek.com`
- OpenAI: `https://api.openai.com/v1`
- Any OpenAI-compatible API

### Format Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `format.outputLanguage` | Language for messages | Simplified Chinese |

### Review Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `review.mode` | Code review strictness | `standard` |
| `review.customPrompt` | Custom review rules | (empty) |

**Review Modes:**
- `off` - Disabled, skip code review
- `lenient` - Only critical issues (syntax errors, security, crashes)
- `standard` - Critical + major issues (logic errors, error handling)
- `strict` - All verifiable issues (including code quality)

**Review Custom Prompt Example:**
```
Focus on:
- Security vulnerabilities
- Performance issues in database queries
- Missing error handling
```

### Commit Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `commit.enableEmojiPrefix` | Add emoji to messages | `false` |
| `commit.customPrompt` | Custom commit instructions | (empty) |

**Commit Custom Prompt Example:**
```
Always include ticket numbers in the format [JIRA-123]
Use imperative mood for all messages
Keep first line under 50 characters
```

## 🌍 Supported Languages

Generate commit messages in your preferred language (19 languages supported):

- English
- Simplified Chinese (简体中文)
- Traditional Chinese (繁體中文)
- Japanese (にほんご)
- Korean (한국어)
- Czech (česky)
- German (Deutsch)
- French (française)
- Italian (italiano)
- Dutch (Nederlands)
- Portuguese (português)
- Vietnamese (tiếng Việt)
- Spanish (español)
- Swedish (Svenska)
- Russian (русский)
- Bahasa (bahasa)
- Polish (Polski)
- Turkish (Turkish)
- Thai (ไทย)

##  License

[MIT License](LICENSE)

---

**Enjoying Commit Genie?**
⭐ [Star on GitHub](https://github.com/joygqz/commit-genie) • 💬 [Report Issues](https://github.com/joygqz/commit-genie/issues) • 📝 [Changelog](CHANGELOG.md)
