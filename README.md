# Nuvo Commit

> Write commits, not novels. Local-first AI commit message generator.

## Features

- 🤖 **Multi-Provider Support**: Choose from Ollama (local), OpenAI, or Anthropic
- 🔒 **Local-First**: Run entirely on your machine via Ollama - no cloud APIs required
- ☁️ **Cloud Options**: Use OpenAI GPT-4 or Anthropic Claude for better results
- 🚀 **Fast**: Quick commit message generation without leaving VS Code
- ⚙️ **Customizable**: Configure models, endpoints, and behavior
- 📋 **Auto Model Detection**: Automatically list available models from your provider

## Requirements

- For **Ollama** (local):
  - [Ollama](https://ollama.ai) installed and running
  - Pull a model: `ollama pull qwen3:4b`
- For **OpenAI** (cloud):
  - OpenAI API key from https://platform.openai.com/api-keys
- For **Anthropic** (cloud):
  - Anthropic API key from https://console.anthropic.com/
- VS Code 1.85.0 or higher
- Node.js 18 or higher

## Installation

1. Install the extension from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nuvocode.nuvo-commit)
2. Choose your provider:
   - **Local (Recommended)**: Install Ollama: `brew install ollama` (macOS) or visit [ollama.ai](https://ollama.ai)
   - **Cloud**: Get API keys from OpenAI or Anthropic
3. Configure in VS Code Settings (`Cmd+,`)
4. Start generating commit messages!

## Usage

1. Stage your changes: `git add .`
2. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run `Nuvo Commit: Generate Commit Message`
4. Review and accept the suggested commit message

### Selecting a Model

To choose from available models:

1. Run command: `Nuvo Commit: Select Model`
2. Choose from the list of available models, or select "Enter manually..."
3. The selected model will be saved to your settings

**Tip:** For Ollama users, the model list is fetched automatically from your local Ollama instance.

## Configuration

Configure in VS Code Settings (`Cmd+,`):

```json
{
  "nuvoCommit.autoAccept": true,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.endpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.apiKey": "",
  "nuvoCommit.model": "qwen3:4b"
}
```

### Settings (in order)

1. **autoAccept**: Skip approval dialog and fill commit message directly
2. **autoCommit**: Automatically commit after accepting suggestion
3. **maxDiffChars**: Maximum diff characters sent to the model
4. **provider**: AI provider to use
   - `ollama` - Local AI (no API key needed)
   - `openai` - OpenAI API (requires API key)
   - `anthropic` - Anthropic API (requires API key)
5. **endpoint**: API endpoint URL
   - For Ollama: `http://localhost:11434/api/generate`
   - For OpenAI: Leave empty to use default, or set custom endpoint
   - For Anthropic: Leave empty to use default
6. **apiKey**: API key for cloud providers
   - Leave empty for Ollama
   - Required for OpenAI and Anthropic
7. **model**: Model identifier
   - Use command `Nuvo Commit: Select Model` to choose from available models
   - Or enter manually (e.g., `qwen3:4b`, `gpt-4o`, `claude-sonnet-4-20250514`)

### Example Configurations

**Ollama (Local):**
```json
{
  "nuvoCommit.autoAccept": true,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.endpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.apiKey": "",
  "nuvoCommit.model": "qwen3:4b"
}
```

**OpenAI (Cloud):**
```json
{
  "nuvoCommit.autoAccept": true,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.provider": "openai",
  "nuvoCommit.endpoint": "",
  "nuvoCommit.apiKey": "sk-your-api-key-here",
  "nuvoCommit.model": "gpt-4o-mini"
}
```

**Anthropic (Cloud):**
```json
{
  "nuvoCommit.autoAccept": true,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.provider": "anthropic",
  "nuvoCommit.endpoint": "",
  "nuvoCommit.apiKey": "sk-ant-your-api-key-here",
  "nuvoCommit.model": "claude-3-5-sonnet-20241022"
}
```

**Custom OpenAI-Compatible Endpoint:**
```json
{
  "nuvoCommit.autoAccept": true,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.provider": "openai",
  "nuvoCommit.endpoint": "http://localhost:1234/v1/chat/completions",
  "nuvoCommit.apiKey": "not-needed",
  "nuvoCommit.model": "local-model"
}
```

**Ollama (Local):**
```json
{
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.endpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.apiKey": "",
  "nuvoCommit.model": "qwen3:4b"
}
```

**OpenAI (Cloud):**
```json
{
  "nuvoCommit.provider": "openai",
  "nuvoCommit.endpoint": "",
  "nuvoCommit.apiKey": "sk-your-api-key-here",
  "nuvoCommit.model": "gpt-4o-mini"
}
```

**Anthropic (Cloud):**
```json
{
  "nuvoCommit.provider": "anthropic",
  "nuvoCommit.endpoint": "",
  "nuvoCommit.apiKey": "sk-ant-your-api-key-here",
  "nuvoCommit.model": "claude-3-5-sonnet-20241022"
}
```

**Custom OpenAI-Compatible Endpoint:**
```json
{
  "nuvoCommit.provider": "openai",
  "nuvoCommit.endpoint": "http://localhost:1234/v1/chat/completions",
  "nuvoCommit.apiKey": "not-needed",
  "nuvoCommit.model": "local-model"
}
```

1. **provider**: AI provider to use
   - `ollama` - Local AI (no API key needed)
   - `openai` - OpenAI API (requires API key)
   - `anthropic` - Anthropic API (requires API key)

2. **endpoint**: API endpoint URL
   - For Ollama: `http://localhost:11434/api/generate`
   - For OpenAI: Leave empty to use default, or set custom endpoint
   - For Anthropic: Leave empty to use default

3. **apiKey**: API key for cloud providers
   - Leave empty for Ollama
   - Required for OpenAI and Anthropic

4. **model**: Model identifier
   - Use command `Nuvo Commit: Select Model` to choose from available models
   - Or enter manually (e.g., `qwen3:4b`, `gpt-4o`, `claude-sonnet-4-20250514`)

5. **maxDiffChars**: Maximum diff characters sent to the model

6. **autoCommit**: Automatically commit after accepting suggestion

7. **autoAccept**: Skip approval dialog and fill commit message directly

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Run tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

### Debugging

1. Open the project in VS Code
2. Press **F5** to run the extension in debug mode
3. A new VS Code window will open with the extension loaded

## Testing

See [TESTING.md](./TESTING.md) for detailed testing instructions.

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for release and publishing guide.

## License

MIT
