# Commit Genie

Use OpenAI SDK compatible APIs to intelligently analyze Git changes and automatically generate standard commit messages.

## Commands

<!-- commands -->

| Command                              | Title                                 |
| ------------------------------------ | ------------------------------------- |
| `commit-genie.generateCommitMessage` | Commit Genie: Generate Commit Message |
| `commit-genie.selectAvailableModel`  | Commit Genie: Select Available Model  |

<!-- commands -->

## Configs

<!-- configs -->

| Key                                  | Description                                                                                                                                     | Type      | Default                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------- |
| `commit-genie.apiKey`                | API key for authentication with your AI service provider.                                                                                       | `string`  | `""`                         |
| `commit-genie.baseURL`               | Base URL of the AI service API endpoint.                                                                                                        | `string`  | `"https://api.deepseek.com"` |
| `commit-genie.model`                 | AI model to use for generating commit messages. Enter manually or run "Commit Genie: Select Available Models" to choose from available options. | `string`  | `"deepseek-chat"`            |
| `commit-genie.commitMessageLanguage` | Language for generated commit messages.                                                                                                         | `string`  | `"Simplified Chinese"`       |
| `commit-genie.enableEmojiPrefix`     | Enable emoji prefix.                                                                                                                            | `boolean` | `false`                      |

<!-- configs -->
