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
- There can only be one topic
- Keep the main changes as concise as possible

### Body
- Bullet points with "-"
- Max 72 chars/line
- Just explain the changes and keep it brief
- Omit the body text if necessary

### Language Requirements
- ALL text in ${language}
- Space between Chinese/English and numbers

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

async function getMainCommitPrompt() {
  const language = config.MESSAGE_LANGUAGE
  const enableEmoji = config.ENABLE_EMOJI
  return [INIT_MAIN_PROMPT(language, enableEmoji)]
}

export async function generateCommitMessageChatCompletionPrompt(diff: string) {
  const INIT_MESSAGES_PROMPT = await getMainCommitPrompt()
  const chatContextAsCompletionRequest = [...INIT_MESSAGES_PROMPT]

  chatContextAsCompletionRequest.push({
    role: 'user',
    content: diff,
  })
  return chatContextAsCompletionRequest
}
