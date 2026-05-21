import { ProviderError } from './Provider';

describe('ProviderError', () => {
  it('should create error with message', () => {
    const error = new ProviderError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ProviderError');
    expect(error.cause).toBeUndefined();
  });

  it('should create error with cause', () => {
    const cause = new Error('Original error');
    const error = new ProviderError('Test error', cause);
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ProviderError');
    expect(error.cause).toBe(cause);
  });

  it('should be instanceof Error', () => {
    const error = new ProviderError('Test error');
    expect(error).toBeInstanceOf(Error);
  });
});
