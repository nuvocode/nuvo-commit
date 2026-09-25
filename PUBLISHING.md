# VS Code Extension Publishing Guide

## GitHub Secrets Configuration

### 1. VS Code Marketplace (Azure OIDC)

Marketplace PATs now expire, so the workflow publishes as an Azure managed
identity via GitHub OIDC instead of a stored token.

Azure (already done):

- Managed identity `vscode-publisher` in resource group `rg-vscode-publisher`
- Federated credential with subject
  `repo:nuvocode/nuvo-commit:environment:marketplace-publish`

GitHub:

1. Settings → Environments → `marketplace-publish`
2. Add environment secrets `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` with the
   identity's client and tenant IDs

Marketplace (already done):

- The identity's Azure DevOps user ID `a81f7864-617a-637f-83b5-60ba3141de3a` is a
  **Contributor** on the `nuvocode` publisher. To look it up again, run
  `az rest -u https://app.vssps.visualstudio.com/_apis/profile/profiles/me --resource 499b84ac-1321-427f-aa17-267ca6975798`
  after `azure/login` in the `marketplace-publish` environment.

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

- Verify the `marketplace-publish` environment has `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`
- Check the managed identity is a Contributor on the `nuvocode` publisher
- Confirm publisher name (`nuvocode`) is registered on marketplace
