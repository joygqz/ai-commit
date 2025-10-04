# Commit Genie

[![Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-genie?style=flat-square&logo=visual-studio-code&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/joygqz.commit-genie?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)

AI-powered commit message generator for VS Code. Automatically generates meaningful, standard commit messages by analyzing your Git changes.

## ✨ Features

- 🤖 **AI-Powered**: Works with OpenAI-compatible APIs (DeepSeek, OpenAI, etc.)
- 🌐 **Multi-Language**: Generate commit messages in 19+ languages
- ⚡ **Real-time Streaming**: See messages being generated instantly
- 🎨 **Emoji Support**: Optional emoji prefixes (e.g., ✨ feat, 🐛 fix)
- ❌ **Cancellable**: Stop generation anytime with the cancel button
- 🔄 **Smart Model Selection**: Browse and switch between AI models easily

## 🚀 Quick Start

1. **Install** the extension from VS Code Marketplace
2. **Configure API** (Press `Cmd/Ctrl + ,` to open Settings):
   - Set `commit-genie.service.apiKey` (your API key)
   - Set `commit-genie.service.baseURL` (default: `https://api.deepseek.com`)
3. **Select Model**: Run `Commit Genie: Select Available Model` from Command Palette
4. **Start Using**: Stage your changes and click the ✨ icon in Source Control

## 📋 Usage

### Generate Commit Message

1. Stage your changes in Source Control
2. Click the <img src="images/logo.png" width="16" height="16" /> icon or run `Commit Genie: Generate Commit Message`
3. Watch the AI generate your commit message in real-time
4. Edit if needed and commit

**Tips:**
- Click cancel (×) to stop generation anytime
- Clicking again automatically cancels the previous request

### Select Model

Run `Commit Genie: Select Available Model` from Command Palette to:
- Browse available models from your API
- Switch to a different model
- See which model is currently active

## ⚙️ Configuration

### Essential Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `service.apiKey` ✅ | Your API key | `sk-...` |
| `service.baseURL` ✅ | API endpoint | `https://api.deepseek.com` |
| `service.model` | AI model name | `deepseek-chat` |

**Supported API Providers:**
- DeepSeek: `https://api.deepseek.com`
- OpenAI: `https://api.openai.com/v1`
- Any OpenAI-compatible API

### Optional Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `format.outputLanguage` | Language for messages | Simplified Chinese |
| `commit.enableEmojiPrefix` | Add emoji to messages | `false` |
| `commit.customPrompt` | Custom instructions for AI | (empty) |
| `debug.enableLogging` | Enable debug logs | `true` |
| `debug.logLevel` | Log detail level | `warn` |

**Custom Prompt Example:**
```
Always include ticket numbers in the format [JIRA-123]
Use imperative mood for all messages
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

## 🐛 Troubleshooting

**"API Key is required"**
→ Configure `service.apiKey` in Settings

**"No staged changes"**
→ Stage your changes first in Source Control

**Network/Timeout errors**
→ Check internet connection and API endpoint

**Need detailed logs?**
1. Settings → Search "Commit Genie debug"
2. Set `debug.logLevel` to `"debug"`
3. View: Output panel → "Commit Genie"

##  License

[MIT License](LICENSE)

---

**Enjoying Commit Genie?**
⭐ [Star on GitHub](https://github.com/joygqz/commit-genie) • 💬 [Report Issues](https://github.com/joygqz/commit-genie/issues) • 📝 [Changelog](CHANGELOG.md)
