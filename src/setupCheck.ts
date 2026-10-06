/** A tiny diff used to test the provider end to end. */
export const SAMPLE_DIFF = `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1 +1,2 @@
 # Demo
+Add a short project description.
`;

export interface SetupFix {
  title: string;
  /** VS Code command to run. */
  command?: string;
  /** URL to open. */
  url?: string;
  /** Text to copy to the clipboard. */
  copy?: string;
}

/** Maps a failed setup check to the actions most likely to fix it. */
export function setupFixes(
  provider: string,
  model: string,
  error: string,
): SetupFix[] {
  const settings = { title: "Open Settings", command: "nuvoCommit.settings" };

  if (/requires an API key|\b(401|403)\b/.test(error)) {
    return [
      { title: "Set API Key", command: "nuvoCommit.setApiKey" },
      settings,
    ];
  }

  if (provider === "ollama" && /Cannot reach Ollama/.test(error)) {
    return [
      { title: "Install Ollama", url: "https://ollama.com/download" },
      settings,
    ];
  }

  if (provider === "ollama" && /\b404\b|not found/i.test(error)) {
    return [
      { title: "Copy Pull Command", copy: `ollama pull ${model}` },
      { title: "Select Model", command: "nuvoCommit.selectModel" },
    ];
  }

  if (/empty response/.test(error)) {
    return [{ title: "Select Model", command: "nuvoCommit.selectModel" }];
  }

  return [settings];
}
