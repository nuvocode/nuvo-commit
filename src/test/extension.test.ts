import * as assert from 'assert';
import * as vscode from 'vscode';

describe('Extension Test Suite', () => {
  it('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('nuvocode.nuvo-commit');
    assert.ok(ext, 'Extension should be installed');
    await ext?.activate();
    assert.ok(ext?.isActive, 'Extension should be activated');
  });

  it('Command should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    const command = commands.find(cmd => cmd === 'nuvoCommit.generate');
    assert.ok(command, 'nuvoCommit.generate command should be registered');
  });

  it('Configuration should be available', () => {
    const config = vscode.workspace.getConfiguration('nuvoCommit');
    assert.ok(config, 'Configuration should be available');
    
    const provider = config.get('provider');
    assert.strictEqual(provider, 'ollama', 'Default provider should be ollama');
    
    const model = config.get('model');
    assert.strictEqual(model, 'qwen3:4b', 'Default model should be qwen3:4b');
  });
});
