# Check your setup

**Check Setup** sends a tiny sample diff to the selected provider and shows the
commit message it writes. Nothing from your repository is sent.

If something is wrong, the error message offers the fix:

- **Ollama isn't running**: install or start Ollama.
- **Model not found**: copy the `ollama pull` command, or pick another model.
- **Missing or rejected API key**: set the key again.
