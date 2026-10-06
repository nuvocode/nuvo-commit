// Mock for VS Code API
module.exports = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showQuickPick: jest.fn(),
    showInputBox: jest.fn(),
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
      inspect: jest.fn(() => undefined),
      update: jest.fn(),
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
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
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
  CancellationTokenSource: jest.fn(() => {
    const token = { isCancellationRequested: false };
    return {
      token,
      cancel: jest.fn(() => {
        token.isCancellationRequested = true;
      }),
      dispose: jest.fn(),
    };
  }),
  lm: {
    selectChatModels: jest.fn(async () => []),
  },
  LanguageModelChatMessage: {
    User: jest.fn((content) => ({ role: "user", content })),
  },
  LanguageModelError: class LanguageModelError extends Error {
    constructor(message, code = "Unknown") {
      super(message);
      this.code = code;
    }
  },
  ProgressLocation: {
    Notification: 1,
    SourceControl: 2,
    Window: 3,
  },
  QuickPickItemKind: {
    Separator: -1,
    Default: 0,
  },
  ExtensionMode: {
    Production: 1,
    Development: 2,
    Test: 3,
  },
};
