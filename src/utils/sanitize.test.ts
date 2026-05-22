import { sanitizeCommitMessage } from './sanitize';

describe('sanitizeCommitMessage', () => {
  it('should return conventional commit format', () => {
    const input = 'fix: resolve null pointer exception';
    expect(sanitizeCommitMessage(input)).toBe('fix: resolve null pointer exception');
  });

  it('should add chore: prefix when no conventional type is present', () => {
    const input = 'update some stuff';
    expect(sanitizeCommitMessage(input)).toBe('chore: update some stuff');
  });

  it('should remove markdown code blocks', () => {
    const input = '```diff\n+ console.log("hello");\n```';
    expect(sanitizeCommitMessage(input)).toBe('chore: update staged changes');
  });

  it('should remove markdown formatting', () => {
    const input = '**fix**: remove **bold** text';
    expect(sanitizeCommitMessage(input)).toBe('fix: remove bold text');
  });

  it('should truncate to 50 characters at word boundary', () => {
    const input = 'feat: this is a very long commit message that exceeds the maximum allowed length of 50 characters and should be truncated';
    const result = sanitizeCommitMessage(input);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toMatch(/^feat:/);
    // Should not cut word in half
    expect(result).not.toMatch(/\s$/);
  });

  it('should preserve short commit messages', () => {
    const input = 'fix: resolve bug';
    expect(sanitizeCommitMessage(input)).toBe('fix: resolve bug');
  });

  it('should remove trailing punctuation', () => {
    const input = 'fix: remove trailing punctuation...';
    expect(sanitizeCommitMessage(input)).toBe('fix: remove trailing punctuation');
  });

  it('should handle empty input', () => {
    expect(sanitizeCommitMessage('')).toBe('chore: update staged changes');
    expect(sanitizeCommitMessage(null as unknown as string)).toBe('chore: update staged changes');
  });

  it('should remove bullet points', () => {
    const input = '- add new feature';
    expect(sanitizeCommitMessage(input)).toBe('chore: add new feature');
  });

  it('should remove heading markers', () => {
    const input = '### feat: add heading support';
    expect(sanitizeCommitMessage(input)).toBe('feat: add heading support');
  });

  it('should handle multiline input and use first non-empty line', () => {
    const input = '\n\nfix: actual commit message\n\nSome body text';
    expect(sanitizeCommitMessage(input)).toBe('fix: actual commit message');
  });

  it('should preserve scope in conventional commits', () => {
    const input = 'feat(parser): add new parser';
    expect(sanitizeCommitMessage(input)).toBe('feat(parser): add new parser');
  });

  it('should handle breaking changes with !', () => {
    const input = 'feat!: breaking change';
    expect(sanitizeCommitMessage(input)).toBe('feat!: breaking change');
  });
});
