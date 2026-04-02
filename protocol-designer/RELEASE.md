# Releasing Protocol Designer

This document describes the release process for Protocol Designer.

## Philosophy

Releases are intended to run from the Github Actions workflow: `.github/workflows/pd-test-build-deploy.yaml`. All process and configuration for release is contained in `scripts/static-release`. With the correct AWS credential and profile, the script to release may be run locally for testing, debugging, or in an emergency for actual release if GitHub Actions is down.

## Builds and deployments

**Source of truth:** what runs in CI and where artifacts go is defined in [`.github/workflows/pd-test-build-deploy.yaml`](https://github.com/Opentrons/opentrons/blob/edge/.github/workflows/pd-test-build-deploy.yaml) on `edge`.

| Trigger                                            | Where it deploys                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Open PR (when workflow path filters match)         | Sandbox: `https://sandbox.designer.opentrons.com/{branch}`        |
| Push to `edge` or `chore_release*`                 | Sandbox: `https://sandbox.designer.opentrons.com/{branch}`        |
| Push tag `pd-test*` (no `@` in the tag; see below) | Sandbox: `https://sandbox.designer.opentrons.com/{full tag name}` |
| Push tag `staging-protocol-designer@*`             | Staging: <https://staging.designer.opentrons.com/>                |
| Push tag `protocol-designer@*`                     | Production: <https://designer.opentrons.com/>                     |

Tagged **production** builds need a **PD release team** member to approve the deployment in GitHub Actions before they go live. Staging and Sandbox deploys (PRs, branch pushes, `pd-test*` tags) do not use that approval gate.

## Tags

Tags should be annotated and pushed one at a time. Please do not push all your tags at once with `git push --tags`. Push the individual tag like so:

```shell
git tag -a protocol-designer@8.6.0 -m "production release for 8.6.0"
git push origin protocol-designer@8.6.0
```

## Environments

sandbox: <https://sandbox.designer.opentrons.com/{branch or tag}>
staging: <https://staging.designer.opentrons.com/>
production: <https://designer.opentrons.com/>

### Sandbox

Open PRs (with matching paths), plus any push to `edge` or `chore_release*`, deploy to `https://sandbox.designer.opentrons.com/{branch}`. Pushing an annotated tag whose name starts with `pd-test` deploys to `https://sandbox.designer.opentrons.com/{full tag name}` (the tag string is the URL path, so each alpha gets its own stable URL). **Do not put `@` in `pd-test*` tag names:** `@` belongs in `staging-protocol-designer@*` and `protocol-designer@*` tags only, because those tags are not used as sandbox paths. For `pd-test*`, use hyphens (for example `pd-test-8.6.0-alpha.1`). See [Builds and deployments](#builds-and-deployments).

### Staging

Staging is the single shared **stable** URL for pre-production QA. Use **`pd-test*` tags** on your `chore_release-pd*` line for alpha builds and parallel trains; when that train is the one you want everyone to validate next, promote it to staging with `staging-protocol-designer@*` tags (see [Release train: alphas, staging, production](#release-train-alphas-staging-production)).

To deploy a build to staging, create an annotated tag with the prefix `staging-protocol-designer` and push it to GitHub. The tag name should be of the form `staging-protocol-designer@X.Y.Z-alpha.N` where `X.Y.Z` is a [semver](https://semver.org/) version number matching the release cycle and N is incremented with each alpha build.

```shell
git tag -a staging-protocol-designer@8.6.0-alpha.1 -m "staging build for 8.6.0"
git push origin staging-protocol-designer@8.6.0-alpha.1
```

#### Release train: alphas, staging, production

Only one build can be live at <https://staging.designer.opentrons.com/> at a time. The intended flow keeps staging from getting overwritten by surprise: **alphas and parallel work use `pd-test*` sandbox tags**; **staging is for the candidate you are ready to run through final QA before production**.

1. **Alpha / parallel trains:** On the `chore_release-pd*` line you are working, cut annotated tags whose names start with `pd-test` and **do not include `@`** (for example `pd-test-8.6.0-alpha.1`, `pd-test-8.6.0-alpha.2`). Push each tag. CI deploys to `https://sandbox.designer.opentrons.com/{that full tag name}/`. Each new tag is a new stable URL, so you do not have to reuse or overwrite someone else's sandbox path.
2. **Promote to staging:** When that line has the alpha you consider the final staging candidate, tag it with `staging-protocol-designer@*` as described below and push. That becomes the single shared staging URL.
3. **Final QA on staging:** Run acceptance on <https://staging.designer.opentrons.com/>.
4. **Production:** From the same commit as the last staging alpha you are shipping, tag with `protocol-designer@*` and push.

Example for release work on `chore_release-pd-20.0.1`:

```shell
git checkout chore_release-pd-20.0.1
git tag -a pd-test-20.0.1-alpha.0 -m "PD alpha 20.0.1 alpha.0"
git push origin pd-test-20.0.1-alpha.0
```

Sandbox URL: `https://sandbox.designer.opentrons.com/pd-test-20.0.1-alpha.0`

For the next alpha on the same line:

```shell
git tag -a pd-test-20.0.1-alpha.1 -m "PD alpha 20.0.1 alpha.1"
git push origin pd-test-20.0.1-alpha.1
```

Sandbox URL: `https://sandbox.designer.opentrons.com/pd-test-20.0.1-alpha.1`

**Naming rule:** `pd-test*` tags must not contain `@`. The tag name is copied into the sandbox URL path; `@` in paths is confusing for people and unreliable in some browsers, proxies, and shared links. Staging and production tags **should** keep using `@` before the version (`staging-protocol-designer@…`, `protocol-designer@…`).

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
