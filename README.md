# Commit Genie

[![GitHub last commit](https://img.shields.io/github/last-commit/joygqz/commit-genie)](https://github.com/joygqz/commit-genie)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-genie)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/joygqz.commit-genie)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/joygqz.commit-genie)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)

AI-powered commit message generator with optional code review for VS Code.

## ✨ Features

- 🤖 **AI-Powered** - Compatible with OpenAI, DeepSeek, and other OpenAI-compatible APIs
- 🔍 **Code Review** - Optional pre-commit review (off/lenient/standard/strict)
- 🌐 **Multi-Language** - Generate messages in 19+ languages
- ⚡ **Real-time** - Streaming generation with cancel support
- 🎨 **Customizable** - Emoji support, custom prompts, model selection

## 🚀 Quick Start

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-genie)
2. Configure API (Settings):
   - `commit-genie.service.apiKey` - Your API key
   - `commit-genie.service.baseURL` - API endpoint (default: `https://api.deepseek.com`)
3. Select Model: Run `Commit Genie: Select Available Model`
4. Stage changes and click the ✨ icon in Source Control

## 📋 Usage

1. **Stage changes** in Source Control
2. **Click** the ✨ icon or run `Commit Genie: Review and Commit`
3. **Review** (if enabled) - AI checks for issues, you can continue or fix
4. **Commit** - AI generates message in real-time, edit if needed

**Commands:**
- `Commit Genie: Review and Commit` - Generate commit message with optional review
- `Commit Genie: Select Available Model` - Browse and switch AI models
- `Commit Genie: Show Token Usage Statistics` - View token usage stats
- `Commit Genie: Reset Token Usage Statistics` - Clear all token statistics

## ⚙️ Configuration

### Required Settings

```jsonc
{
  "commit-genie.service.apiKey": "sk-...", // Your API key
  "commit-genie.service.baseURL": "https://api.deepseek.com", // API endpoint
  "commit-genie.service.model": "deepseek-chat" // Model name
}
```

**Supported Providers:** DeepSeek, OpenAI, or any OpenAI-compatible API

### Optional Settings

**Format:**
- `format.outputLanguage` - Message language (default: Simplified Chinese)

**Review:**
- `review.mode` - Review strictness: `off` / `lenient` / `standard` / `strict` (default: `standard`)
  - `off` - Skip review
  - `lenient` - Critical only (syntax, security, crashes)
  - `standard` - Critical + major (logic, error handling)
  - `strict` - All issues (including code quality)
- `review.customPrompt` - Custom review instructions

**Commit:**
- `commit.enableEmojiPrefix` - Add emoji (e.g., ✨ feat, 🐛 fix) (default: `false`)
- `commit.customPrompt` - Custom commit instructions

## 🌍 Supported Languages

English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Français, Italiano, Nederlands, Português, Tiếng Việt, Español, Svenska, Русский, Bahasa, Polski, Türkçe, ไทย, Čeština

## 📝 License

[MIT License](LICENSE)

---

**Enjoying Commit Genie?**
⭐ [Star on GitHub](https://github.com/joygqz/commit-genie) • 💬 [Report Issues](https://github.com/joygqz/commit-genie/issues) • 📝 [Changelog](CHANGELOG.md)
