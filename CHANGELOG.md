# Changelog

All notable changes to the **Nuvo Commit** extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-22

First stable release. No new features compared to `0.1.x` — this release hardens
the extension for production use.

### Added

- `Nuvo Commit: Set API Key` command — stores cloud provider API keys in VS Code's
  encrypted `SecretStorage` instead of plaintext settings.
- `nuvoCommit.requestTimeoutMs` setting — provider requests now abort after a
  configurable timeout (default 30s) instead of hanging indefinitely.
- ESLint + Prettier configuration and a `lint` step in CI.
- Unit tests for git diff retrieval and provider configuration.
- `CHANGELOG.md`.

### Changed

- API keys are migrated automatically from the deprecated `nuvoCommit.apiKey`
  setting into secure storage and removed from `settings.json`.
- The provider config shape is now decided by the selected provider. Choosing a
  cloud provider without an API key now shows a clear, actionable error.

### Fixed

- Publish workflow waited on non-existent CI checks (`Test`/`Build`), which could
  stall releases indefinitely.
- `tsc` build and Jest unit tests failed because the `tsconfig` `types` field
  excluded the test type definitions.
- Removed unsafe `as any` casts in provider registration.

### Security

- Cloud provider API keys are no longer stored as plaintext in `settings.json`.

## [0.1.1] - 2026-05

### Added

- Multi-provider documentation and cloud configuration examples.
- `order` metadata for settings so they render in a sensible order in the
  Settings UI.

### Changed

- Updated publishing and testing documentation.

## [0.1.0] - 2026-05

### Added

- Initial release: AI-generated commit messages from staged (or working
  directory) git diffs.
- Multi-provider support: Ollama (local), OpenAI, and Anthropic.
- Diff optimization that skips lock files, generated files, and build output.
- Conventional Commits enforcement with sanitization and a safe fallback.
- `Nuvo Commit: Select Model` command with automatic model discovery for Ollama.
- `autoAccept` and `autoCommit` settings.

[1.0.0]: https://github.com/nuvocode/nuvo-commit/releases/tag/v1.0.0
[0.1.1]: https://github.com/nuvocode/nuvo-commit/releases/tag/v0.1.1
[0.1.0]: https://github.com/nuvocode/nuvo-commit/releases/tag/v0.1.0
