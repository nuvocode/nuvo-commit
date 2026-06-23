// Mock for VS Code API
module.exports = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showQuickPick: jest.fn(),
    withProgress: jest.fn((_options, task) => task()),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key, defaultValue) => defaultValue),
    })),
    workspaceFolders: [
      {
        uri: { fsPath: "/test/workspace" },
        name: "test-workspace",
        index: 0,
      },
    ],
    textDocuments: [],
    onDidChangeTextDocument: jest.fn(),
    onDidSaveTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  extensions: {
    getExtension: jest.fn(),
  },
  env: {
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn(),
    },
  },
  Uri: {
    parse: jest.fn((path) => ({ fsPath: path, toString: () => path })),
    file: jest.fn((path) => ({ fsPath: path, toString: () => path })),
  },
  Range: jest.fn(),
  Position: jest.fn(),
  Diagnostic: jest.fn(),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  CompletionItem: jest.fn(),
  CompletionItemKind: {
    Text: 1,
    Method: 2,
    Function: 3,
  },
  Hover: jest.fn(),
  InlineCompletionItem: jest.fn(),
  ThemeColor: jest.fn(),
  ThemeIcon: jest.fn(),
  TreeItem: jest.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Expanded: 1,
    Collapsed: 2,
  },
  EventEmitter: jest.fn(() => ({
    event: jest.fn(),
    fire: jest.fn(),
    dispose: jest.fn(),
  })),
  CancellationTokenSource: jest.fn(() => ({
    token: {},
    cancel: jest.fn(),
    dispose: jest.fn(),
  })),
  ProgressLocation: {
    Notification: 1,
    SourceControl: 2,
    Window: 3,
  },
  ExtensionMode: {
    Production: 1,
    Development: 2,
    Test: 3,
  },
};
