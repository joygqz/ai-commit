import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from './config'

interface PromptOptions {
  language: string
  enableEmoji: boolean
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
  { type: 'i18n', description: 'internationalization', emoji: '🌐' },
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

### Emoji Support
- Prefix each subject with the matching emoji.
- Use format: <emoji> <type>[optional scope]: <subject>.
- Omit emoji when no type matches.`
}

function createWorkflowSection(enableEmoji: boolean, language: string) {
  const emojiHint = enableEmoji ? '<emoji> ' : ''

  return `## Output Contract

${emojiHint}<type>[optional scope]: <subject>

[optional body]

### Subject Rules
- Use imperative mood, keep it succinct, never end with a period.
- ≤ 50 characters, single responsibility, avoid duplicate information.
- Include an explicit scope only when it sharpens understanding.

### Body Rules (Optional)
- Use "- " bullet prefix, ≤ 72 characters per line.
- Focus on why or how when extra clarity is needed.
- Omit the body if the subject already captures the change.

### Language Discipline
- Produce all text in ${language}.
- Insert spaces between Chinese / English words and numbers if applicable.
- Keep casing consistent with the selected language norms.`
}

function createWorkflowChecklist() {
  return `## Delivery Checklist

1. Understand the diff: identify files, behaviors, tests, docs, configs.
2. Choose the most precise type; never invent new types.
3. Confirm the subject mirrors the main change.
4. Add body bullets only when they deliver meaningful nuance.
5. Final validation: ensure the output strictly matches the contract.

If the diff is empty or contains only generated artefacts, respond with a maintenance style message (e.g. chore) and describe the meaningful effect (or state "no functional changes" if accurate).`
}

function createEdgeCaseSection() {
  return `## Edge Cases

- **Mixed changes**: Select the dominant change; mention secondary effects in the body.
- **Reverts / rollbacks**: Prefer "revert" wording inside the subject for clarity.
- **Config toggles**: Highlight the user-facing impact rather than the toggled flag.
- **Renames / moves**: Briefly state the intent (e.g. "reorganize components namespace").
- **Test-only updates**: Use **test** type and summarise coverage or scenario.`
}

function createSystemContent(options: PromptOptions) {
  const { enableEmoji, language } = options

  return [
    '# Git Commit Message Generator',
    '',
    'You are an elite release engineer crafting production-ready commit messages based on git diffs. Output **only** the final commit message—no explanations, backticks, or extra prose.',
    '',
    '## Commit Types',
    '',
    createCommitTypeSection(enableEmoji),
    createEmojiGuidelines(enableEmoji),
    '',
    createWorkflowSection(enableEmoji, language),
    '',
    createWorkflowChecklist(),
    '',
    createEdgeCaseSection(),
  ].join('\n')
}

function createSystemMessage(options: PromptOptions): ChatCompletionMessageParam {
  return {
    role: 'system',
    content: createSystemContent(options),
  }
}

async function getMainCommitPrompt(): Promise<ChatCompletionMessageParam[]> {
  const options: PromptOptions = {
    language: config.MESSAGE_LANGUAGE,
    enableEmoji: config.ENABLE_EMOJI,
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
