import { isIgnoredPath, optimizeDiff } from "./optimizeDiff";

describe("isIgnoredPath", () => {
  it("should ignore lock files", () => {
    expect(isIgnoredPath("package-lock.json")).toBe(true);
    expect(isIgnoredPath("yarn.lock")).toBe(true);
    expect(isIgnoredPath("pnpm-lock.yaml")).toBe(true);
    expect(isIgnoredPath("composer.lock")).toBe(true);
    expect(isIgnoredPath("Cargo.lock")).toBe(true);
    expect(isIgnoredPath("Gemfile.lock")).toBe(true);
    expect(isIgnoredPath("poetry.lock")).toBe(true);
    expect(isIgnoredPath("bun.lockb")).toBe(true);
  });

  it("should ignore build directories", () => {
    expect(isIgnoredPath("dist/bundle.js")).toBe(true);
    expect(isIgnoredPath("build/output.js")).toBe(true);
    expect(isIgnoredPath(".next/static/file.js")).toBe(true);
    expect(isIgnoredPath("out/index.html")).toBe(true);
    expect(isIgnoredPath("coverage/lcov.info")).toBe(true);
    expect(isIgnoredPath("node_modules/package/index.js")).toBe(true);
    expect(isIgnoredPath(".turbo/cache/file.json")).toBe(true);
    expect(isIgnoredPath(".cache/webpack/file.js")).toBe(true);
  });

  it("should ignore generated files", () => {
    expect(isIgnoredPath("app.min.js")).toBe(true);
    expect(isIgnoredPath("styles.min.css")).toBe(true);
    expect(isIgnoredPath("bundle.js.map")).toBe(true);
    expect(isIgnoredPath("schema.generated.ts")).toBe(true);
    expect(isIgnoredPath("client.gen.go")).toBe(true);
  });

  it("should not ignore regular files", () => {
    expect(isIgnoredPath("src/index.ts")).toBe(false);
    expect(isIgnoredPath("lib/utils.js")).toBe(false);
    expect(isIgnoredPath("README.md")).toBe(false);
    expect(isIgnoredPath("package.json")).toBe(false);
    expect(isIgnoredPath("src/components/Button.tsx")).toBe(false);
  });

  it("should handle nested paths correctly", () => {
    expect(isIgnoredPath("src/dist/file.js")).toBe(true);
    expect(isIgnoredPath("packages/app/node_modules/lib/index.js")).toBe(true);
    expect(isIgnoredPath("src/build/config.json")).toBe(true);
  });
});

describe("optimizeDiff", () => {
  function fileDiff(path: string, lines: string[]): string {
    return [
      `diff --git a/${path} b/${path}`,
      `--- a/${path}`,
      `+++ b/${path}`,
      "@@ -1,1 +1,1 @@",
      ...lines,
    ].join("\n");
  }

  it("keeps context from later files when the first file is large", () => {
    const largeFirstFile = fileDiff(
      "src/large.ts",
      Array.from({ length: 80 }, (_, i) => `+large change ${i}`),
    );
    const secondFile = fileDiff("src/second.ts", ["+important second change"]);
    const thirdFile = fileDiff("src/third.ts", ["+important third change"]);
    const result = optimizeDiff(
      [largeFirstFile, secondFile, thirdFile].join("\n"),
      700,
    );

    expect(result.truncated).toBe(true);
    expect(result.truncatedFiles).toContain("src/large.ts");
    expect(result.includedFiles).toEqual([
      "src/large.ts",
      "src/second.ts",
      "src/third.ts",
    ]);
    expect(result.diff).toContain("diff --git a/src/second.ts b/src/second.ts");
    expect(result.diff).toContain("diff --git a/src/third.ts b/src/third.ts");
    expect(result.diff.length).toBeLessThanOrEqual(700);
  });

  it("continues to skip ignored and generated files", () => {
    const result = optimizeDiff(
      [
        fileDiff("package-lock.json", ["+lock"]),
        fileDiff("src/app.ts", ["+app change"]),
        fileDiff("dist/bundle.js", ["+bundle"]),
      ].join("\n"),
      1200,
    );

    expect(result.includedFiles).toEqual(["src/app.ts"]);
    expect(result.skippedFiles).toEqual([
      "package-lock.json",
      "dist/bundle.js",
    ]);
    expect(result.diff).toContain("src/app.ts");
    expect(result.diff).not.toContain("package-lock.json");
  });

  it("truncates a single large file within the max character budget", () => {
    const result = optimizeDiff(
      fileDiff(
        "src/large.ts",
        Array.from({ length: 80 }, (_, i) => `+large change ${i}`),
      ),
      300,
    );

    expect(result.truncated).toBe(true);
    expect(result.truncatedFiles).toEqual(["src/large.ts"]);
    expect(result.diff).toContain("diff --git a/src/large.ts b/src/large.ts");
    expect(result.diff).toContain("...[file diff truncated]");
    expect(result.diff.length).toBeLessThanOrEqual(300);
  });
});
