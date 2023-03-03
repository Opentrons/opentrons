# Releasing Software (for Opentrons developers)

Below you will find instructions for release processes for projects within our monorepo. The main goal of our process is to
neatly document any changes that may happen during QA, such as bug fixes, and separate production concerns from our development branch.

## Releasing Robot Software Stacks

Our release process is still a work-in-progress. The app and API projects are currently versioned together to ensure interoperability.

1. Ensure you have a release created in GitHub for the robot stack you're releasing - buildroot for ot-2, oe-core for ot-3 - with all the changes you want in this release, if any. If there are no system changes, you don't have to create a new release; the last tag in the system repo is used for release builds.
2. Checkout `edge` and make a release branch, without any new changes. The branch name should match `release_*` to make `make bump` usage easier and make it clear this is a release.

```shell
git checkout edge
git pull
git checkout -b release_${version}
git push --set-upstream origin release_${version}
```

3. Open a PR into `release` for your empty release branch.
4. Seek input on the user-facing release notes at `app-shell/build/release-notes.md` to add the new notes for the app and user-facing release notes at `api/release-notes.md` to add the new notes for the robot software. These changes should get wordsmithing approval and use a `chore` merge commit. This can happen in parallel, but should be done before the alpha process concludes.

5. Create a tag using `make bump` for the new version. See the notes on [`make bump` usage](#make-bump-usage) below. Since this is entering qa, you'll want to bump the version to the target release version with an `-alpha.0` prerelease tag.

6. Review the tag with `git show ${project}@${version}` (or `git show v${version}` for the robot-stack project). If it points to the commit you meant, push the tag - this starts the build process. This is a release candidate that will undergo QA.

```shell
git push origin ${project}@${version}
```

or

```shell
git push origin v${version}
```

Changelogs for the release are automatically generated when the tag is pushed and sent to the release page in github.

7. Run QA on this release. If issues are found, create PRs targeted on the release branch. To create new alpha releases, repeat steps 4-7.

8. Once QA is a pass, do a NORMAL MERGE into `release`. Do NOT squash or rebase. This should be done from your local command line (and will succeed as long as the release PR is reviewed and status checks have passed):

```shell
# note: make sure you have pulled the latest changes for branch
# release_${version} locally before merging into release
git checkout release
git merge --ff-only release_${version}
git push origin release
```

10. Tag the release and start release builds:

```shell
git tag -a v${version} -m 'chore(release): ${version}'
git push origin v${version}
```

The tag push will kick off release builds and create a release page where those builds and automatically generated in-depth changelogs will be posted.

11. Open a PR of `release` into `edge`. Give the PR a name like `chore(release): Merge changes from ${version} into edge`. Once it passes, on the command line merge it into `edge`:

```shell
git checkout edge
git pull
git merge --no-ff release
```

12. Use the PR title for the merge commit title. You can then `git push origin edge`, which will succeed as ong as the PR is approved and status checks pass.
13. Release the docs for this version (see below under Releasing Web Projects)

## Releasing Robot Software Stack Hotfixes

1. Ensure you have a system release created in GitHub (buildroot for OT2, oe-core for OT3) with all the changes you want to see, if any. If there aren't any, you don't have to create a new release; by default, the last tag is used for release builds.
2. Checkout `release` and make a release branch, without any new changes. The branch name should match `hotfix_*` to make it clear this is a hotfix.

```shell
git checkout release
git pull
git checkout -b hotfix_${version}
git push --set-upstream origin hotfix_${version}
```

3. Target the hotfix PRs on this branch.
4. Wordsmith the release notes in `app-shell/build/release-notes.md` and `api/release-notes.md` in a PR that uses the `chore` commit type.
5. Once the fixes and release notes have been merged into the hotfix branch, bump to an alpha version to begin qa - for instance, if this is a hotfix following 6.3.0, the `${version}` would be `6.3.1-alpha.0`:

```shell
git tag -a v${version} -m 'chore(release): ${version}'
git push origin v${version}
```

6. Inspect the created tag and then push it:

```shell
git show v${version}
git push v${version}
```

7. Once QA is a pass, do a NORMAL MERGE into `release`. Do NOT squash or rebase. This should be done from your local command line (and will succeed as long as the release PR is reviewed and status checks have passed):

```shell
# note: make sure you have pulled the latest changes for branch
# release_${version} locally before merging into release
git checkout release
git merge --ff-only release_${version}
git push origin release
```

8. Tag the release with its full target version:

```shell
git tag -a v${version} -m 'chore(release): ${version}'
git push origin v${version}
```

Pushing the tag will create release builds and a github release page with the in-depth changelogs.

9. Open a PR of `release` into `edge`. Give the PR a name like `chore(release): Merge changes from ${version} into edge`. Once it passes, on the command line merge it into `edge`:

```shell
git checkout edge
git pull
git merge --no-ff release
```

10. Use the PR title for the merge commit title. You can then `git push origin edge`, which will succeed as long as the PR is approved and status checks pass.
11. Release the docs for this version (see below under Releasing Web Projects)

### tag usage

We specify the version of a release artifact through a specifically-formatted git tag. We consider our monorepo to support several projects: robot stack, ot3, protocol-designer, etc. Tags look like this:
```shell
${projectPrefix}${projectVersion}
```

`${projectPrefix}` is the project name for everything but robot stack, where it is `v`.

For instance, the tag for 6.2.1-alpha.3 of the robot stack is `v6.2.1-alpha.3`.
The tag for 4.0.0 of protocol designer is `protocol-designer@4.0.0`.
The tag for 0.1.2-beta.1 of ot3 is `ot3@0.1.2-beta.1`.

Versions follow [semver.inc][semver-inc]. QA is done on alpha builds, and only alpha tags should be pushed until you're ready to release the project.

## Releasing Web Projects

The following web projects are versioned and released independently from the app and API:

- `protocol-designer`
  - designer.opentrons.com
- `labware-library`
  - labware.opentrons.com
- API documentation
  - docs.opentrons.com

See [scripts/deploy/README.md](./scripts/deploy/README.md) for the release process of these projects.
