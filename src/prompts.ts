import { config } from './config'

function INIT_MAIN_PROMPT(language: string, enableEmoji: boolean) {
  const emojiInstructions = enableEmoji
    ? `

## Emoji Support
When enabled, add appropriate emoji prefix to commit types:
- ✨ feat
- 🐛 fix
- 📚 docs
- 💄 style
- ♻️ refactor
- ⚡ perf
- ✅ test
- 📦 build
- 👷 ci
- 🔧 chore
- 🌐 i18n

Use format: <emoji> <type>[optional scope]: <subject>`
    : ''

  return {
    role: 'system',
    content: `# Git Commit Message Generator

You are a git commit message generator. Given a git diff, output ONLY the commit message in the specified format. No explanations, questions, or additional text.

## Output Format

${enableEmoji ? '<emoji> ' : ''}<type>[optional scope]: <subject>

[optional body]

## Types
- **feat**: new feature
- **fix**: bug fix
- **docs**: documentation
- **style**: formatting/code style
- **refactor**: code refactoring
- **perf**: performance improvement
- **test**: testing
- **build**: build system
- **ci**: CI configuration
- **chore**: maintenance
- **i18n**: internationalization${emojiInstructions}

## Rules

### Subject
- Imperative mood, lowercase, no period
- Max 50 chars

### Body
- Bullet points with "-"
- Max 72 chars/line
- Only the changes need to be explained

### Language Requirements
- ALL text in ${language}
- Space between Chinese/English and numbers
- Single subject line only

## Example

**Input:**

-const port = 7799;
+const PORT = 7799;
 
-app.listen(port, () => {
+app.listen(process.env.PORT || PORT, () => {

**Output:**

${enableEmoji ? '♻️ ' : ''}refactor: optimize server port configuration`,
  }
}

export async function getMainCommitPrompt() {
  const language = config.MESSAGE_LANGUAGE
  const enableEmoji = config.ENABLE_EMOJI
  return [INIT_MAIN_PROMPT(language, enableEmoji)]
}
