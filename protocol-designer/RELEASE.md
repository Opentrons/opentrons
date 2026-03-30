# Releasing Protocol Designer

This document describes the release process for Protocol Designer.

## Philosophy

Releases are intended to run from the Github Actions workflow: `.github/workflows/pd-test-build-deploy.yaml`. All process and configuration for release is contained in `scripts/static-release`. With the correct AWS credential and profile, the script to release may be run locally for testing, debugging, or in an emergency for actual release if GitHub Actions is down.

## Builds and deployments

**Source of truth:** what runs in CI and where artifacts go is defined in [`.github/workflows/pd-test-build-deploy.yaml`](https://github.com/Opentrons/opentrons/blob/edge/.github/workflows/pd-test-build-deploy.yaml) on `edge`.

| Trigger                                         | Where it deploys                                           |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Open PR (when workflow path filters match)      | Sandbox: `https://sandbox.designer.opentrons.com/{branch}` |
| Push to `edge`, `chore_release*`, or `pd-test*` | Sandbox: `https://sandbox.designer.opentrons.com/{branch}` |
| Push tag `staging-protocol-designer@*`          | Staging: <https://staging.designer.opentrons.com/>         |
| Push tag `protocol-designer@*`                  | Production: <https://designer.opentrons.com/>              |

Tagged staging and production builds need a **PD release team** member to approve the deployment in GitHub Actions before they go live.

## Tags

Tags should be annotated and pushed one at a time. Please do not push all your tags at once with `git push --tags`. Push the individual tag like so:

```shell
git tag -a protocol-designer@8.6.0 -m "production release for 8.6.0"
git push origin protocol-designer@8.6.0
```

## Environments

sandbox: <https://sandbox.designer.opentrons.com/{branch}>
staging: <https://staging.designer.opentrons.com/>
production: <https://designer.opentrons.com/>

### Sandbox

Open PRs (with matching paths), plus any push to `edge`, `chore_release*`, or `pd-test*`, deploy to `https://sandbox.designer.opentrons.com/{branch}`. See [Builds and deployments](#builds-and-deployments).

### Staging

Staging is the single shared **stable** URL for pre-production QA. Choose which `chore_release-pd*` commit should occupy it, then cut `staging-protocol-designer@*` tags from that line (see [When we need more than one staging environment](#when-we-need-more-than-one-staging-environment) for parallel cycles).

To deploy a build to staging, create an annotated tag with the prefix `staging-protocol-designer` and push it to GitHub. The tag name should be of the form `staging-protocol-designer@X.Y.Z-alpha.N` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle and N is incremented with each alpha build.

```shell
git tag -a staging-protocol-designer@8.6.0-alpha.1 -m "staging build for 8.6.0"
git push origin staging-protocol-designer@8.6.0-alpha.1
```

#### When we need more than one staging environment

Only one build can be live at <https://staging.designer.opentrons.com/> at a time. When multiple release trains need stable environments in parallel, use staging for the train you are promoting to QA next, and use **sandbox** for the others.

**Real staging:** keep one `chore_release-pd*` line as the staging candidate and deploy it with `staging-protocol-designer@*` tags as usual.

**Extra stable sandboxes:** create branches whose names start with `pd-test`. Each push runs CI and deploys to `https://sandbox.designer.opentrons.com/{that-branch-name}`.

Example for release work on `chore_release-pd-20.0.1`:

```shell
git checkout chore_release-pd-20.0.1
git switch -c pd-test-20.0.1-alpha.0
git push -u origin pd-test-20.0.1-alpha.0
```

Sandbox URL: `https://sandbox.designer.opentrons.com/pd-test-20.0.1-alpha.0`

When the branch has new commits and you want a fresh frozen URL for the next alpha:

```shell
git checkout chore_release-pd-20.0.1
git switch -c pd-test-20.0.1-alpha.1
git push -u origin pd-test-20.0.1-alpha.1
```

Sandbox URL: `https://sandbox.designer.opentrons.com/pd-test-20.0.1-alpha.1`

`@` is allowed in Git branch names, but avoid it; some tooling does not handle it well.

### Production

To deploy a build to production, create an annotated tag with the prefix `protocol-designer` and push it to GitHub. The tag name should be of the form `protocol-designer@X.Y.Z` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle. This tag goes on the same commit as the staging tag for the final alpha build of the release cycle.

```shell
git tag -a protocol-designer@8.6.0 -m "production release for 8.6.0"
git push origin protocol-designer@8.6.0
```

## Rollback

To "roll back" a release, we push a new tag on the previously working commit.
The semver will roll forward always, but the code will be identical to the previous release.
We do not delete tags or releases in GitHub for "rollback" releases.
For example, if the current production release is `protocol-designer@8.6.0` and we want to roll back to `protocol-designer@8.5.0`, we would do the following:

```shell
#find the commit sha of the 8.5.0 release
git switch chore_release-pd-8.5.0
git log --oneline -n 20
git checkout <commit-sha-of-tag-protocol-designer@8.5.0>
git tag -a protocol-designer@8.5.1 -m "rollback to 8.5.0"
git push origin protocol-designer@8.5.1
```

This would create a new production release `protocol-designer@8.5.1` that is identical to `protocol-designer@8.5.0`.
