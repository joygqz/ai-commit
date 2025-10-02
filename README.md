# Commit Genie

Use DeepSeek or OpenAI API to intelligently analyze Git changes and automatically generate standard commit messages.

## Commands

<!-- commands -->

| Command                              | Title                                 |
| ------------------------------------ | ------------------------------------- |
| `commit-genie.generateCommitMessage` | Commit Genie: Generate Commit Message |
| `commit-genie.selectAvailableModel`  | Commit Genie: Select Available Model  |

<!-- commands -->

## Configs

<!-- configs -->

| Key                                  | Description                                                                                                              | Type      | Default                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------- | ---------------------------- |
| `commit-genie.apiKey`                | DeepSeek/OpenAI API Key.                                                                                                 | `string`  | `""`                         |
| `commit-genie.baseURL`               | DeepSeek/OpenAI BaseURL.                                                                                                 | `string`  | `"https://api.deepseek.com"` |
| `commit-genie.model`                 | DeepSeek/OpenAI model name. Enter manually or run "Commit Genie: Select Available Models" to pick from available models. | `string`  | `"deepseek-chat"`            |
| `commit-genie.commitMessageLanguage` | Commit message language.                                                                                                 | `string`  | `"Simplified Chinese"`       |
| `commit-genie.enableEmojiPrefix`     | Enable emoji prefix in commit messages.                                                                                  | `boolean` | `false`                      |

<!-- configs -->
