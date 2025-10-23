# PyPI OIDC Trusted Publishing Setup

This document explains how to migrate from PyPI API tokens to OIDC trusted publishing for secure, tokenless deployments.

## Overview

OIDC (OpenID Connect) trusted publishing allows GitHub Actions to publish to PyPI without storing long-lived API tokens as secrets. Instead, PyPI verifies the GitHub Actions workflow using OIDC.

## Setup Steps

### 1. Configure Trusted Publishing on PyPI

For each project that needs to publish to PyPI:

1. **Log into PyPI** (or Test PyPI) as the project owner
2. **Go to project settings** → "Publishing" → "Publishing automation"
3. **Add a new trusted publisher** with these settings:
   - **PyPI project name**: `opentrons` (or `opentrons-shared-data`, etc.)
   - **Owner**: `Opentrons` (GitHub organization)
   - **Repository name**: `opentrons`
   - **Workflow filename**: `api-test-lint-deploy.yaml` (or appropriate workflow)
   - **Environment name**: Leave empty (or specify if using environments)
   - **Branch/tag**: `refs/tags/*` (for tagged releases)

### 2. Update Workflow Files

Replace the token-based authentication with OIDC trusted publishing:

**Before (token-based):**
```yaml
- name: 'upload to pypi'
  uses: './.github/actions/python/pypi-deploy'
  with:
    project: 'api'
    repository_url: 'https://upload.pypi.org/legacy/'
    password: '${{ secrets.PYPI_DEPLOY_TOKEN_OPENTRONS }}'
```

**After (OIDC-based):**
```yaml
- name: 'upload to pypi'
  uses: './.github/actions/python/pypi-deploy-oidc'
  with:
    project: 'api'
    repository_url: 'https://upload.pypi.org/legacy/'
    pypi_trusted_publisher: 'pypi:opentrons'
```

### 3. Required Workflow Permissions

Add these permissions to your workflow:

```yaml
permissions:
  id-token: write  # Required for OIDC
  contents: read   # Required for checkout
```

### 4. Environment Variables

The OIDC action will automatically handle authentication using the trusted publisher configuration.

## Benefits

- **No long-lived secrets**: Eliminates the need to store PyPI API tokens
- **Enhanced security**: Tokens can't be leaked or compromised
- **Automatic rotation**: No need to manually rotate tokens
- **Audit trail**: Better tracking of publishing activities

## Migration Checklist

- [ ] Set up trusted publishing on PyPI for each project
- [ ] Update workflow files to use OIDC action
- [ ] Add required permissions to workflows
- [ ] Test with a test release
- [ ] Remove old API token secrets (after confirming OIDC works)

## Projects to Migrate

Based on current setup:
- `opentrons` (main API package)
- `opentrons-shared-data` (shared data package)

## Troubleshooting

- Ensure the trusted publisher configuration matches exactly
- Check that the workflow filename is correct
- Verify the repository owner and name match
- Make sure the branch/tag pattern includes your release tags
