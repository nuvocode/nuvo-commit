# Choose where the AI runs

| Provider      | Runs on           | Needs                                                                      |
| ------------- | ----------------- | -------------------------------------------------------------------------- |
| **Ollama**    | Your machine      | [Ollama](https://ollama.com/download) and a model (`ollama pull qwen3:4b`) |
| **OpenAI**    | OpenAI's cloud    | An [API key](https://platform.openai.com/api-keys)                         |
| **Anthropic** | Anthropic's cloud | An [API key](https://console.anthropic.com/)                               |

Ollama keeps your code on your machine. The `openai` provider also works with
OpenAI-compatible services such as Gemini, OpenRouter, Groq and LM Studio; see
the README for ready-made settings.
