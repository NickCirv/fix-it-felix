![Banner](banner.svg)

# fix-it-felix

> Self-healing CI. When builds break, Felix fixes them.

A GitHub Action that automatically reads CI failure logs, identifies the problem, fixes the code, and pushes. Your PRs heal themselves.

## Quick Start

Add to your workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test

  felix:
    needs: build
    if: failure()
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      actions: read
    steps:
      - uses: actions/checkout@v4
      - uses: NickCirv/fix-it-felix@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## What Felix Does

1. **Reads** CI failure logs from the failed job
2. **Analyzes** the error (wrong import, type error, missing dep, etc.)
3. **Fixes** the minimal code change needed
4. **Verifies** the fix by re-running the failing command
5. **Pushes** the fix and comments on the PR

## PR Comment Example

> **Fixed it for you!**
>
> The `npm test` step failed because `getUserById` was called with a string ID but expected a number.
>
> **Changed:** `src/services/users.ts` See commit `abc1234`.

## Configuration

| Input | Default | Description |
|-------|---------|-------------|
| `anthropic-api-key` | required | Your Anthropic API key |
| `auto-push` | `true` | Push fixes automatically |
| `max-attempts` | `3` | Max fix attempts before giving up |

## Outputs

| Output | Description |
|--------|-------------|
| `fixed` | `"true"` if a fix was successfully applied |
| `explanation` | One-sentence description of what was fixed |
| `sha` | Short commit SHA of the fix (if pushed) |

## Safety

- Felix only fixes the specific failing test/build step
- Changes are minimal — typically 1-5 lines
- Every fix is verified before pushing
- Max 3 attempts prevents infinite loops
- You still review and merge the PR

## Requirements

- `ANTHROPIC_API_KEY` as a GitHub secret
- Workflow permissions: `contents: write`, `pull-requests: write`, `actions: read`

## Related

- [sleep-and-ship](https://github.com/NickCirv/sleep-and-ship) — Queue overnight tasks
- [ai-code-roast](https://github.com/NickCirv/ai-code-roast) — Brutal code reviews

## License

MIT — NickCirv
