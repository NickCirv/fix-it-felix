# fix-it-felix — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b`. Commands are source-inspected; no execution results are asserted.

## Workflow

Reads GitHub workflow logs, extracts source context, asks Anthropic for fixes, writes returned files and attempts the inferred failing command. It can commit/push changes and comment on a pull request.

The action uses node20 and dist/index.js, requires anthropic-api-key and GITHUB_TOKEN, and declares max-attempts. The captured source audit excluded the bundled dist entrypoint, so source-to-bundle equivalence is unverified.

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `anthropic-api-key` | Required Action input for generation |
| `auto-push` | Action input defaulting to true |
| `max-attempts` | Action input defaulting to 3 |
| `GITHUB_TOKEN` | Required runner environment variable |

## Interpretation and side effects

auto-push defaults to true. Setting it false still permits local edits, command execution and PR comments. Logs and source context leave the runner for Anthropic; this prototype requires a security review before use on trusted code or secrets.

## Implementation reference

- [package.json](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json)
- [src/index.js](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/src/index.js)
- [action.yml](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/action.yml)
