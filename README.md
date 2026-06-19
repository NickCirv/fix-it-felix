<div align="center">

# fix-it-felix

**Self-healing CI — auto-fixes failed builds with AI so you stay in flow**

[![license](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![node](https://img.shields.io/badge/node-20-brightgreen?labelColor=0B0A09)](https://nodejs.org)

</div>

## Install

Add to your existing workflow — Felix only runs when the build breaks:

```yaml
# .github/workflows/ci.yml
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

Then add your key: `Settings → Secrets → ANTHROPIC_API_KEY`.

## What it does

Felix triggers only on CI failure. It reads the full GitHub Actions logs, identifies the root cause (wrong types, bad imports, failing assertions, missing deps), makes the minimal code change to fix it, re-runs the failing command to verify, then pushes a fix and leaves a plain-English PR comment.

Typically 1–5 line diffs. Gives up after 3 attempts — never infinite-loops.

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `anthropic-api-key` | required | Your Anthropic API key |
| `auto-push` | `true` | Push fixes automatically |
| `max-attempts` | `3` | Max attempts before giving up |

## Outputs

| Output | Description |
|--------|-------------|
| `fixed` | `"true"` if a fix was applied |
| `explanation` | One-sentence description of what was fixed |
| `sha` | Short commit SHA of the fix |

## Example PR comment

```
Fixed it for you!

The `npm test` step failed because `getUserById` was called with a string
ID but the function signature expects a number.

  Before: getUserById(req.params.id)
  After:  getUserById(Number(req.params.id))

Changed: src/services/users.ts · See commit abc1234
Confidence: High · Attempts: 1/3
```

---
<sub>Node 20 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
