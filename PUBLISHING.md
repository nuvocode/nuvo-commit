# VS Code Extension Publishing Guide

## GitHub Secrets Configuration

### 1. VS Code Marketplace (vsce) Personal Access Token

1. Go to https://marketplace.visualstudio.com/manage
2. Click "Security" in the left menu
3. Click "New Personal Access Token"
4. Name it (e.g., `nuvo-commit-ci`)
5. Select "All accessible organizations"
6. Copy the generated token
7. In your GitHub repository:
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VSCE_PAT`
   - Value: Paste the token

### 2. Open VSX Registry Token (Optional)

1. Go to https://open-vsx.org/user-settings/tokens
2. Click "Create New Token"
3. Copy the token
4. In your GitHub repository:
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OVSX_PAT`
   - Value: Paste the token

## Workflow Flow

1. **Push to master** triggers the workflow
2. **CI wait**: Waits for test and build workflows to complete
3. **Build**: Compiles and packages the extension
4. **Publish**: Automatically publishes to VS Code Marketplace

## Manual Trigger

- GitHub repository → Actions → "Publish VS Code Extension" → "Run workflow"

## Version Management

Update the `version` field in `package.json` before each publish:

```json
{
  "version": "0.1.1" // Increment minor or patch version
}
```

## Troubleshooting

### Workflow waiting for CI but no CI exists
- Remove the `wait-for-ci` job if you haven't created CI workflows yet
- Or update `check-name` values to match your workflow names

### Publish errors
- Verify VSCE_PAT secret is set correctly
- Check token hasn't expired
- Confirm publisher name (`nuvocode`) is registered on marketplace
