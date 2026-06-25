# Nuvo Commit

> Write commits, not novels. Local-first AI commit message generator.

[![Version](https://img.shields.io/visual-studio-marketplace/v/nuvocode.nuvo-commit)](https://marketplace.visualstudio.com/items?itemName=nuvocode.nuvo-commit)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/nuvocode.nuvo-commit)](https://marketplace.visualstudio.com/items?itemName=nuvocode.nuvo-commit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- 🤖 **Multi-Provider Support**: Choose from Ollama (local), OpenAI, or Anthropic
- 🔒 **Local-First**: Run entirely on your machine via Ollama — no cloud APIs required
- ☁️ **Cloud Options**: Use OpenAI or Anthropic Claude for higher-quality results
- 🔑 **Secure Keys**: Cloud API keys are stored in VS Code's encrypted secret storage
- 🚀 **Fast**: Quick commit message generation without leaving VS Code
- ⚙️ **Customizable**: Configure models, endpoints, timeouts, and behavior
- 📋 **Auto Model Detection**: Automatically list available models from your provider

## Requirements

- VS Code 1.85.0 or higher
- For **Ollama** (local): [Ollama](https://ollama.ai) installed and running, with a
  model pulled (`ollama pull qwen3:4b`)
- For **OpenAI** (cloud): an API key from <https://platform.openai.com/api-keys>
- For **Anthropic** (cloud): an API key from <https://console.anthropic.com/>

## Installation

1. Install the extension from the
   [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nuvocode.nuvo-commit).
2. Choose your provider:
   - **Local (recommended)**: install Ollama (`brew install ollama` on macOS, or see
     [ollama.ai](https://ollama.ai)).
   - **Cloud**: get an API key from OpenAI or Anthropic.
3. Configure the extension (see [Configuration](#configuration)).
4. Start generating commit messages!

## Usage

1. Stage your changes (`git add .`). If nothing is staged, Nuvo Commit falls back
   to your working-directory changes.
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
3. Run **Nuvo Commit: Generate Commit Message**.
4. Review and accept the suggested message.

### Selecting a model

1. Run **Nuvo Commit: Select Model**.
2. Pick from the discovered models, or choose "Enter manually…".
3. The selection is saved to your settings.

> **Tip:** For Ollama, the model list is fetched automatically from your local instance.

### Setting an API key (cloud providers)

API keys are stored securely per cloud provider — **not** in `settings.json`.

1. Run **Nuvo Commit: Set API Key**.
2. If Ollama is active, choose OpenAI or Anthropic.
3. Paste your key into the masked input (leave it empty to clear that provider's key).

If you previously set `nuvoCommit.apiKey` in settings, it is migrated into secure
storage automatically and removed from `settings.json` on first activation.

## Configuration

Run **Nuvo Commit: Settings** to configure only the selected provider's model,
endpoint, and API key. Provider-specific settings are also available in VS Code
Settings (`Cmd+,`) under **Nuvo Commit**:

| Setting                         | Default                      | Description                                                            |
| ------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `nuvoCommit.autoAccept`         | `true`                       | Skip the approval dialog and fill the commit message directly.         |
| `nuvoCommit.autoCommit`         | `false`                      | Run `git commit` automatically after accepting.                        |
| `nuvoCommit.maxDiffChars`       | `12000`                      | Maximum diff characters sent to the model; larger diffs are truncated. |
| `nuvoCommit.provider`           | `ollama`                     | AI provider: `ollama`, `openai`, or `anthropic`.                       |
| `nuvoCommit.ollama.endpoint`    | Ollama URL                   | Ollama API endpoint.                                                   |
| `nuvoCommit.ollama.model`       | `qwen3:4b`                   | Ollama model identifier.                                               |
| `nuvoCommit.openai.endpoint`    | `""`                         | OpenAI endpoint. Leave empty to use the default OpenAI endpoint.       |
| `nuvoCommit.openai.model`       | `gpt-4o-mini`                | OpenAI model identifier.                                               |
| `nuvoCommit.anthropic.endpoint` | `""`                         | Anthropic endpoint. Leave empty to use the default Anthropic endpoint. |
| `nuvoCommit.anthropic.model`    | `claude-3-5-sonnet-20241022` | Anthropic model identifier.                                            |
| `nuvoCommit.requestTimeoutMs`   | `30000`                      | Milliseconds to wait for a provider response before aborting.          |

> Deprecated fallback settings `nuvoCommit.apiKey`, `nuvoCommit.endpoint`, and
> `nuvoCommit.model` are kept for upgrades. New configurations should use the
> provider-specific settings above.

### Example configurations

**Ollama (local):**

```json
{
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.ollama.endpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.ollama.model": "qwen3:4b"
}
```

**OpenAI (cloud):** set the key via **Nuvo Commit: Set API Key**, then:

```json
{
  "nuvoCommit.provider": "openai",
  "nuvoCommit.openai.endpoint": "",
  "nuvoCommit.openai.model": "gpt-4o-mini"
}
```

**Anthropic (cloud):** set the key via **Nuvo Commit: Set API Key**, then:

```json
{
  "nuvoCommit.provider": "anthropic",
  "nuvoCommit.anthropic.endpoint": "",
  "nuvoCommit.anthropic.model": "claude-3-5-sonnet-20241022"
}
```

**Custom OpenAI-compatible endpoint:**

```json
{
  "nuvoCommit.provider": "openai",
  "nuvoCommit.openai.endpoint": "http://localhost:1234/v1/chat/completions",
  "nuvoCommit.openai.model": "local-model"
}
```

## Development

```bash
npm install      # Install dependencies
npm run compile  # Compile TypeScript
npm run watch    # Compile in watch mode
npm run lint     # Lint sources
npm run format   # Format with Prettier
npm run test:unit       # Run Jest unit tests
npm run test:coverage   # Run unit tests with coverage
```

### Debugging

1. Open the project in VS Code.
2. Press **F5** to launch the extension in a new Extension Development Host window.

## Testing

See [TESTING.md](./TESTING.md) for detailed testing instructions.

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for the release and publishing guide.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
