# PyPI OIDC Trusted Publishing Setup

This document explains how to migrate from PyPI API tokens to OIDC trusted publishing using the official `pypa/gh-action-pypi-publish` GitHub Action.

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

### 2. Workflow Configuration

The workflows are already configured to use the official `pypa/gh-action-pypi-publish` action:

**Production PyPI (for tagged releases):**
```yaml
- name: 'upload to real pypi'
  uses: pypa/gh-action-pypi-publish@release/v1
  with:
    packages-dir: api/dist/
    repository-url: https://upload.pypi.org/legacy/
```

**Test PyPI (for non-tagged pushes):**
```yaml
- name: 'upload to test pypi'
  uses: './.github/actions/python/pypi-deploy'
  with:
    project: 'api'
    repository_url: 'https://test.pypi.org/legacy/'
    password: '${{ secrets.TEST_PYPI_DEPLOY_TOKEN_OPENTRONS }}'
```

### 3. Required Workflow Permissions

The workflows already have the required permissions:

```yaml
permissions:
  id-token: write  # Required for OIDC
  contents: read   # Required for checkout
```

### 4. Environment Variables

The official action automatically handles OIDC authentication using the trusted publisher configuration.

## Benefits

- **No long-lived secrets**: Eliminates the need to store PyPI API tokens for production releases
- **Enhanced security**: Tokens can't be leaked or compromised
- **Automatic rotation**: No need to manually rotate tokens
- **Audit trail**: Better tracking of publishing activities
- **Official support**: Maintained by the PyPI team

## Migration Checklist

- [x] Updated workflows to use `pypa/gh-action-pypi-publish@release/v1`
- [x] Added required OIDC permissions to workflows
- [x] Kept token-based publishing for Test PyPI (for development/testing)
- [ ] Set up trusted publishing on PyPI for each project
- [ ] Test with a real release tag
- [ ] Remove old API token secrets (after confirming OIDC works)

## Projects to Configure

Based on current setup:
- `opentrons` (main API package) - **Production PyPI only**
- `opentrons-shared-data` (shared data package) - **Production PyPI only**

**Note**: Test PyPI uploads still use tokens for development/testing purposes.

## Troubleshooting

- Ensure the trusted publisher configuration matches exactly
- Check that the workflow filename is correct
- Verify the repository owner and name match
- Make sure the branch/tag pattern includes your release tags
- For Test PyPI, ensure the API token secrets are still available

## Official Documentation

- [PyPI Trusted Publishing](https://docs.pypi.org/trusted-publishing/)
- [pypa/gh-action-pypi-publish](https://github.com/pypa/gh-action-pypi-publish)
- [Publishing with GitHub Actions](https://packaging.python.org/en/latest/guides/publishing-package-distribution-releases-using-github-actions-ci-cd-workflows/)