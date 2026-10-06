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

  it('should truncate to 72 characters at word boundary', () => {
    const input = 'feat: this is a very long commit message that exceeds the maximum allowed length of 72 characters and should be truncated';
    const result = sanitizeCommitMessage(input);
    expect(result.length).toBeLessThanOrEqual(72);
    expect(result).toMatch(/^feat:/);
    // Should not cut word in half
    expect(result).not.toMatch(/\s$/);
  });

  it('should preserve the type and scope when truncating the subject', () => {
    const input =
      'feat(parser): add recursive parsing support for nested expressions and advanced syntax handling';
    const result = sanitizeCommitMessage(input);
    expect(result.length).toBeLessThanOrEqual(72);
    expect(result).toMatch(/^feat\(parser\): /);
  });

  it('should remove weak trailing words after truncation', () => {
    const input =
      'fix: update commit message generation for staged files and provider responses with';
    const result = sanitizeCommitMessage(input);
    expect(result.length).toBeLessThanOrEqual(72);
    expect(result).not.toMatch(/\b(and|or|with|for|to|from|by|in|on|of)$/);
  });

  it('should preserve weak words when no truncation happened', () => {
    const input = 'fix: support sign in';
    expect(sanitizeCommitMessage(input)).toBe('fix: support sign in');
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

  it('should preserve body text when body mode is enabled', () => {
    const input =
      '\n\nfix: actual commit message\n\nNormalize generated headers.\nKeep body lines readable.';
    expect(sanitizeCommitMessage(input, { includeBody: true })).toBe(
      'fix: actual commit message\n\nNormalize generated headers.\nKeep body lines readable.',
    );
  });

  it('should normalize the header while preserving body mode output', () => {
    const input = '- update generated message\n\n- explain the staged change';
    expect(sanitizeCommitMessage(input, { includeBody: true })).toBe(
      'chore: update generated message\n\nexplain the staged change',
    );
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
