import type { ChatCompletionMessageParam } from 'openai/resources'
import { workspace } from 'vscode'
import { name } from './constants'

interface PromptOptions {
  language: string
  enableEmoji: boolean
  customPrompt?: string
}

const COMMIT_TYPES = [
  { type: 'feat', description: 'new feature', emoji: '✨' },
  { type: 'fix', description: 'bug fix', emoji: '🐛' },
  { type: 'docs', description: 'documentation', emoji: '📚' },
  { type: 'style', description: 'formatting / code style', emoji: '💄' },
  { type: 'refactor', description: 'code refactoring', emoji: '♻️' },
  { type: 'perf', description: 'performance improvement', emoji: '⚡' },
  { type: 'test', description: 'testing', emoji: '✅' },
  { type: 'build', description: 'build system', emoji: '📦' },
  { type: 'ci', description: 'CI configuration', emoji: '👷' },
  { type: 'chore', description: 'maintenance', emoji: '🔧' },
  { type: 'revert', description: 'revert previous commit', emoji: '⏪' },
] as const

function createCommitTypeSection(enableEmoji: boolean) {
  const bullets = COMMIT_TYPES.map(({ type, description, emoji }) => {
    const prefix = enableEmoji ? `${emoji} ` : ''
    return `- ${prefix}**${type}**: ${description}`
  })
  return bullets.join('\n')
}

function createEmojiGuidelines(enableEmoji: boolean) {
  if (!enableEmoji) {
    return ''
  }

  return `
### Emoji Rules
- Format: <emoji> <type>[scope]: <subject>
- Use matching emoji from the types above`
}

function createWorkflowSection(enableEmoji: boolean, language: string) {
  const emojiHint = enableEmoji ? '<emoji> ' : ''

  return `## Format

${emojiHint}<type>[scope]: <subject>

[body]

### Subject (Required)
- Imperative mood, ≤50 chars, no period
- Add scope only when essential for clarity
- Single responsibility per commit

### Body (Optional)
- "- " bullet prefix, ≤72 chars/line
- Explain why/how when subject insufficient
- Omit if subject is self-explanatory

### Language
- All text in ${language}
- Space between Chinese/English/numbers`
}

function createWorkflowChecklist() {
  return `## Process

1. Analyze diff → identify main change
2. Pick most precise type (never invent)
3. Write subject capturing core change
4. Add body only if adds value
5. Validate format compliance

**Empty/generated diffs**: Use chore type, describe effect or "no functional changes"`
}

function createEdgeCaseSection() {
  return `## Special Cases

- **Mixed**: Pick dominant type, note others in body
- **Revert**: Use revert type with original subject
- **Config**: Focus on user impact, not tech details
- **Rename/Move**: State intent (e.g., "reorganize structure")
- **Test-only**: Use test type, summarize coverage`
}

function createSystemContent(options: PromptOptions) {
  const { enableEmoji, language, customPrompt } = options

  const sections = [
    'You are a commit message generator. Analyze the git diff and output ONLY the final commit message—no explanations, markdown blocks, or extra text.',
    '',
    '## Types',
    '',
    createCommitTypeSection(enableEmoji),
    createEmojiGuidelines(enableEmoji),
    '',
    createWorkflowSection(enableEmoji, language),
    '',
    createWorkflowChecklist(),
    '',
    createEdgeCaseSection(),
  ]

  if (customPrompt && customPrompt.trim()) {
    sections.push('', '## Custom Rules (Override All Above)', '', customPrompt.trim())
  }

  return sections.join('\n')
}

function createSystemMessage(options: PromptOptions): ChatCompletionMessageParam {
  return {
    role: 'system',
    content: createSystemContent(options),
  }
}

async function getMainCommitPrompt(): Promise<ChatCompletionMessageParam[]> {
  const config = workspace.getConfiguration(name)

  const options: PromptOptions = {
    language: config.get<string>('format.commitMessageLanguage') || 'Simplified Chinese',
    enableEmoji: config.get<boolean>('format.enableEmojiPrefix') || false,
    customPrompt: config.get<string>('format.customPrompt') || '',
  }

  return [createSystemMessage(options)]
}

export async function generateCommitMessageChatCompletionPrompt(diff: string): Promise<ChatCompletionMessageParam[]> {
  const baseMessages = await getMainCommitPrompt()
  const trimmedDiff = diff.trim() || '[empty diff provided]'

  return [
    ...baseMessages,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
