# Releasing Labware Library

This document describes the release process for Labware Library.

## Philosophy

Releases are intended to run from the Github Actions workflow: `.github/workflows/ll-test-build-deploy.yaml`. All process and configuration for release is contained in `scripts/static-release`. With the correct AWS credential and profile, the script to release may be run locally for testing, debugging, or in an emergency for actual release if GitHub Actions is down.

## Builds and deployments

**Source of truth:** what runs in CI and where artifacts go is defined in [`.github/workflows/ll-test-build-deploy.yaml`](https://github.com/Opentrons/opentrons/blob/edge/.github/workflows/ll-test-build-deploy.yaml) on `edge`.

| Trigger                                    | Where it deploys                                          |
| ------------------------------------------ | --------------------------------------------------------- |
| Open PR (when workflow path filters match) | Sandbox: `https://sandbox.labware.opentrons.com/{branch}` |
| Push to `edge` or `chore_release*`         | Sandbox: `https://sandbox.labware.opentrons.com/{branch}` |
| Push tag `staging-labware-library@*`       | Staging: <https://staging.labware.opentrons.com/>         |
| Push tag `labware-library@*`               | Production: <https://labware.opentrons.com/>              |

Tagged **production** builds need an **LL release team** member to approve the deployment in GitHub Actions before they go live. Staging and sandbox deploys (PRs, branch pushes, `staging-labware-library@*` tags) do not use that approval gate.

**Common mistake:** alpha and prerelease builds must use the `staging-labware-library@` prefix (for example `staging-labware-library@3.8.1-alpha.0`). A tag like `labware-library@3.8.1-alpha.0` is treated as a **production** deploy and will pause for approval before going live.

## Tags

Tags should be annotated and pushed one at a time. Please do not push all your tags at once with `git push --tags`. Push the individual tag like so:

```shell
git tag -a labware-library@8.6.0 -m "production release for 8.6.0"
git push origin labware-library@8.6.0
```

## Environments

sandbox: <https://sandbox.labware.opentrons.com/{branch}>
staging: <https://staging.labware.opentrons.com/>
production: <https://labware.opentrons.com/>

### Sandbox

Every branch with an open PR gets deployed to sandbox. `edge` and `chore_release*` branches also deploy to sandbox on any push.

### Staging

To deploy a build to staging, create an annotated tag with the prefix `staging-labware-library` and push it to GitHub. The tag name should be of the form `staging-labware-library@X.Y.Z-alpha.N` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle and N is incremented with each alpha build.

```shell
git tag -a staging-labware-library@8.6.0-alpha.1 -m "staging build for 8.6.0"
git push origin staging-labware-library@8.6.0-alpha.1
```

### Production

To deploy a build to production, create an annotated tag with the prefix `labware-library` and push it to GitHub. The tag name should be of the form `labware-library@X.Y.Z` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle (no `-alpha`, `-beta`, or `-rc` suffix). This tag goes on the same commit as the staging tag for the final alpha build of the release cycle. CI will pause for approval on the `ll-prod` GitHub Environment before deploying.

```shell
git tag -a labware-library@8.6.0 -m "production release for 8.6.0"
git push origin labware-library@8.6.0
```

## Rollback

To "rollback" a release, we push a new tag on the previously working commit.
The semver will roll forward always, but the code will be identical to the previous release.
We do not delete tags or releases in GitHub for "rollback" releases.
For example, if the current production release is `labware-library@8.6.0` and we want to rollback to `labware-library@8.5.0`, we would do the following:

```shell
#find the commit sha of the 8.5.0 release
git switch chore_release-ll-8.5.0
git log --oneline -n 20
git checkout <commit-sha-of-tag-labware-library@8.5.0>
git tag -a labware-library@8.5.1 -m "rollback to 8.5.0"
git push origin labware-library@8.5.1
```

This would create a new production release `labware-library@8.5.1` that is identical to `labware-library@8.5.0`.
