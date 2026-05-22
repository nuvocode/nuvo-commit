# Nuvo Commit

> Write commits, not novels. Local-first AI commit message generator.

## Features

- 🤖 **AI-Powered**: Generates meaningful commit messages using local AI models
- 🔒 **Local-First**: Runs entirely on your machine via Ollama - no cloud APIs
- 🚀 **Fast**: Quick commit message generation without leaving VS Code
- ⚙️ **Customizable**: Configure models, endpoints, and behavior

## Requirements

- [Ollama](https://ollama.ai) installed and running
- VS Code 1.85.0 or higher
- Node.js 18 or higher

## Installation

1. Install the extension from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nuvocode.nuvo-commit)
2. Install Ollama: `brew install ollama` (macOS) or visit [ollama.ai](https://ollama.ai)
3. Pull a model: `ollama pull qwen3:4b`
4. Start Ollama: `ollama serve`

## Usage

1. Stage your changes: `git add .`
2. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run `Nuvo Commit: Generate Commit Message`
4. Review and accept the suggested commit message

## Configuration

Configure in VS Code Settings (`Cmd+,`):

```json
{
  "nuvoCommit.provider": "ollama",
  "nuvoCommit.model": "qwen3:4b",
  "nuvoCommit.ollamaEndpoint": "http://localhost:11434/api/generate",
  "nuvoCommit.maxDiffChars": 12000,
  "nuvoCommit.autoCommit": false,
  "nuvoCommit.autoAccept": true
}
```

### Settings

- **provider**: AI provider (currently only Ollama supported)
- **model**: Model identifier (e.g., `qwen3:4b`, `llama3.2:3b`, `mistral:7b`)
- **ollamaEndpoint**: Ollama generate endpoint URL
- **maxDiffChars**: Maximum diff characters sent to the model
- **autoCommit**: Automatically commit after accepting suggestion
- **autoAccept**: Skip approval dialog and fill commit message directly

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
