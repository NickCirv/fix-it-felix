![fix-it-felix — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# fix-it-felix

Prototype a GitHub Action that proposes and applies AI-generated fixes from failed workflow logs.




<a id="inputs"></a>

<a id="outputs"></a>

<a id="example-pr-comment"></a>

## What it does

Reads GitHub workflow logs, extracts source context, asks Anthropic for fixes, writes returned files and attempts the inferred failing command. It can commit/push changes and comment on a pull request. See the pinned [implementation](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`not declared`**. The action uses node20 and dist/index.js, requires anthropic-api-key and GITHUB_TOKEN, and declares max-attempts. The captured source audit excluded the bundled dist entrypoint, so source-to-bundle equivalence is unverified.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/fix-it-felix.git
cd fix-it-felix
git checkout ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b
npm install --ignore-scripts
npm run build
# Review action.yml and src/ before adding this action to a workflow.
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

[Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

## Limits and operational notes

auto-push defaults to true. Setting it false still permits local edits, command execution and PR comments. Logs and source context leave the runner for Anthropic; this prototype requires a security review before use on trusted code or secrets.

## Development

No runtime checks were executed for this documentation review. The package does not declare a test script.

| Script | Declared command |
| --- | --- |
| `build` | `ncc build src/index.js -o dist` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
