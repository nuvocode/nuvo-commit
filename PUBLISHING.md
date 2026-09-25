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

## Releasing

Publishing runs only when a `vX.Y.Z` tag is pushed. Pushes to `master` do not publish.

1. Add a `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md`.
2. Bump the version and tag it:

   ```bash
   npm version X.Y.Z --no-git-tag-version
   git commit -am "chore: release X.Y.Z"
   git tag vX.Y.Z
   git push origin master vX.Y.Z
   ```

The workflow then:

1. Fails if the tag does not match `package.json` or `CHANGELOG.md` has no section for it
2. Lints, runs unit tests and packages `nuvo-commit-vX.Y.Z.vsix`
3. Publishes to the VS Code Marketplace (and Open VSX when `OVSX_PAT` is set)
4. Creates the GitHub Release with the CHANGELOG section as notes and the `.vsix` attached

Re-running a failed release is safe: already published versions are skipped.

## Troubleshooting

### Publish errors

- Verify VSCE_PAT secret is set correctly
- Check token hasn't expired
- Confirm publisher name (`nuvocode`) is registered on marketplace
