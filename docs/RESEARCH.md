# fix-it-felix — research record

## Revision and scope

- Repository: [NickCirv/fix-it-felix](https://github.com/NickCirv/fix-it-felix)
- Commit: `ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b`
- Tree: `91a00f1d8923e77d58cf45c2957472fedcf371fd`
- Captured: 9 of 9 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json) | verified in manifest; installation unverified |
| Prototype a GitHub Action that proposes and applies AI-generated fixes from failed workflow logs. | [implementation](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json) | verified as a declaration only |

## Findings carried into the rewrite

auto-push defaults to true. Setting it false still permits local edits, command execution and PR comments. Logs and source context leave the runner for Anthropic; this prototype requires a security review before use on trusted code or secrets.

No runtime checks were executed for this documentation review. The package does not declare a test script.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `8edf13ba2a2e443fa49e42493414f6952a4a14b6c407983a7c95162ab37f6265`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/LICENSE) · blob `481c289c06c96c07330f8c7dedd847c5c07ca384`.
- [README.md](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/README.md) · blob `b414fa25d63848ca6ff0519ceca2930ff4164751`.
- [package.json](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/package.json) · blob `0d84df1937019552399dde7a2758c07a920239f3`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/.github/workflows/ci.yml) · blob `7cdc8e6a3d0d8b23ee723a6ddb2c98b200a9f273`.
- [action.yml](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/action.yml) · blob `8ce2514ca3f799c8077438bebe909f62a3d6096a`.
- [examples/ci-with-felix.yml](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/examples/ci-with-felix.yml) · blob `ed6ca3a2aa0692bb6bfb73bb5d4cae82a2a8bc56`.
- [src/fixer.js](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/src/fixer.js) · blob `56eafcd12f9cb0a9ce9ca41ae217a814d0f34866`.
- [src/index.js](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/src/index.js) · blob `e6b6ebc458470dbe0a33ac157919bafcd623b531`.
- [src/parser.js](https://github.com/NickCirv/fix-it-felix/blob/ac442fc3f8950d41f1c7bf9ccf7bd26aad99fc2b/src/parser.js) · blob `3894a95e086cca42be513fd38f183059fdd3b5df`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `.gitignore`
- `banner.svg`
- `dist/index.js`
- `package-lock.json`
