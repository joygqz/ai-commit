# Commit Genie

Use DeepSeek or OpenAI API to intelligently analyze Git changes and automatically generate standard commit messages.

## Commands

<!-- commands -->

| Command                              | Title                   |
| ------------------------------------ | ----------------------- |
| `commit-genie.generateCommitMessage` | Generate Commit Message |

<!-- commands -->

## Configs

<!-- configs -->

| Key                             | Description                             | Type      | Default                      |
| ------------------------------- | --------------------------------------- | --------- | ---------------------------- |
| `commit-genie.MESSAGE_LANGUAGE` | Commit message language.                | `string`  | `"Simplified Chinese"`       |
| `commit-genie.API_KEY`          | DeepSeek/OpenAI API Key.                | `string`  | `""`                         |
| `commit-genie.BASE_URL`         | DeepSeek/OpenAI BASE URL.               | `string`  | `"https://api.deepseek.com"` |
| `commit-genie.MODEL`            | DeepSeek/OpenAI Model.                  | `string`  | `"deepseek-chat"`            |
| `commit-genie.ENABLE_EMOJI`     | Enable emoji prefix in commit messages. | `boolean` | `false`                      |

<!-- configs -->
