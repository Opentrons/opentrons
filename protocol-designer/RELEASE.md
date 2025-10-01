# Releasing Protocol Designer

This document describes the release process for Protocol Designer.

## Philosophy

Releases are intended to run from the Github Actions workflow: `.github/workflows/pd-test-build-deploy.yaml`.  All process and configuration for release is contained in `scripts/static-release`.  With the correct AWS credential and profile, the script to release may be run locally for testing, debugging, or in an emergency for actual release if GitHub Actions is down.

## Tags

Tags should be annotated and pushed one at a time.  Please do not push all your tags at once with `git push --tags`.  Push the individual tag like so:

```shell
git tag -a protocol-designer@8.6.0 -m "production release for 8.6.0"
git push origin protocol-designer@8.6.0
```

## Environments

sandbox: <https://sandbox.designer.opentrons.com/{branch}>
staging: <https://staging.designer.opentrons.com/>
production: <https://designer.opentrons.com/>

### Sandbox

Every branch with an open PR gets deployed to sandbox.  `edge` and `chore_release*` branches also deploy to sandbox on any push.

### Staging

To deploy a build to staging, create an annotated tag with the prefix `staging-protocol-designer` and push it to GitHub.  The tag name should be of the form `staging-protocol-designer@X.Y.Z-alpha.N` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle and N is incremented with each alpha build.

```shell
git tag -a staging-protocol-designer@8.6.0-alpha.1 -m "staging build for 8.6.0"
git push origin staging-protocol-designer@8.6.0-alpha.1
```

### Production

To deploy a build to production, create an annotated tag with the prefix `protocol-designer` and push it to GitHub.  The tag name should be of the form `protocol-designer@X.Y.Z` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle.  This tag goes on the same commit as the staging tag for the final alpha build of the release cycle.

```shell
git tag -a protocol-designer@8.6.0 -m "production release for 8.6.0"
git push origin protocol-designer@8.6.0
```
