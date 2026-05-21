import { isIgnoredPath } from './optimizeDiff';

describe('isIgnoredPath', () => {
  it('should ignore lock files', () => {
    expect(isIgnoredPath('package-lock.json')).toBe(true);
    expect(isIgnoredPath('yarn.lock')).toBe(true);
    expect(isIgnoredPath('pnpm-lock.yaml')).toBe(true);
    expect(isIgnoredPath('composer.lock')).toBe(true);
    expect(isIgnoredPath('Cargo.lock')).toBe(true);
    expect(isIgnoredPath('Gemfile.lock')).toBe(true);
    expect(isIgnoredPath('poetry.lock')).toBe(true);
    expect(isIgnoredPath('bun.lockb')).toBe(true);
  });

  it('should ignore build directories', () => {
    expect(isIgnoredPath('dist/bundle.js')).toBe(true);
    expect(isIgnoredPath('build/output.js')).toBe(true);
    expect(isIgnoredPath('.next/static/file.js')).toBe(true);
    expect(isIgnoredPath('out/index.html')).toBe(true);
    expect(isIgnoredPath('coverage/lcov.info')).toBe(true);
    expect(isIgnoredPath('node_modules/package/index.js')).toBe(true);
    expect(isIgnoredPath('.turbo/cache/file.json')).toBe(true);
    expect(isIgnoredPath('.cache/webpack/file.js')).toBe(true);
  });

  it('should ignore generated files', () => {
    expect(isIgnoredPath('app.min.js')).toBe(true);
    expect(isIgnoredPath('styles.min.css')).toBe(true);
    expect(isIgnoredPath('bundle.js.map')).toBe(true);
    expect(isIgnoredPath('schema.generated.ts')).toBe(true);
    expect(isIgnoredPath('client.gen.go')).toBe(true);
  });

  it('should not ignore regular files', () => {
    expect(isIgnoredPath('src/index.ts')).toBe(false);
    expect(isIgnoredPath('lib/utils.js')).toBe(false);
    expect(isIgnoredPath('README.md')).toBe(false);
    expect(isIgnoredPath('package.json')).toBe(false);
    expect(isIgnoredPath('src/components/Button.tsx')).toBe(false);
  });

  it('should handle nested paths correctly', () => {
    expect(isIgnoredPath('src/dist/file.js')).toBe(true);
    expect(isIgnoredPath('packages/app/node_modules/lib/index.js')).toBe(true);
    expect(isIgnoredPath('src/build/config.json')).toBe(true);
  });
});
