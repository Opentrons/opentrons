# Releasing Software (for Opentrons developers)

Below you will find instructions for release processes for projects within our monorepo. The main goal of our process is to
neatly document any changes that may happen during QA, such as bug fixes, and separate production concerns from our development branch.

## Releasing Robot Software Stacks

The app and API projects are currently versioned together to ensure interoperability.

1. Ensure you have a release created in GitHub for the robot stack you're releasing - buildroot for ot-2, oe-core for ot-3 - with all the changes you want in this release, if any. If there are no system changes, you don't have to create a new release; the last tag in the system repo is used for release builds.

2. Checkout `edge` and make a release branch, without any new changes. The branch name should match `release_*` to make it clear this is a release.

   ```shell
   git checkout edge
   git pull
   git checkout -b release_${version}
   git push --set-upstream origin release_${version}
   ```

3. Open a PR into `release` for your release branch; this should contain all the changes that were in `edge` and not yet `release`. This PR will stick around for the duration of the release process, as QA-discovered bugs will have their fixes merged to this PR.

   Part of what should happen in this branch is soliciting input and changes for the user-facing release notes at `app-shell/build/release-notes.md` for the app and `api/release-notes.md` for the robot software. Any changes should be done in a PR just like a QA bug. You should have final approval before the alpha process concludes.

4. Check out and pull your release branch locally and create a tag for a new alpha version (since this is in QA). The alpha version should end with an `-alpha.N` prerelease tag, where `N` goes from 0 up over the course of the QA process. You don't need a PR or a commit to create a new version; the presence of the tag is all that you need. Let's call the alpha version you're about to create `${alphaVersion}`:

   ```shell
   git checkout release_${version}
   git pull
   git tag -a v${alphaVersion} -m 'chore(release): ${alphaVersion}'
   ```

5. Review the tag with `git show v${alphaVersion}`. Double check that the commit displayed is the one you want - it should probably be the latest commit in your release branch, and you should double check that with the Github web UI. If the tag looks good, push it - this starts the build process. This is a release candidate that will undergo QA.

   ```shell
   git push origin v${alphaVersion}
   ```

   Changelogs for the release are automatically generated when the tag is pushed and sent to the release page in github.

6. Run QA on this release. If issues are found, create PRs targeted on the release branch. To create new alpha releases, repeat steps 4-6.

7. Once QA is a pass, do a final check that the release notes are good and wordsmithed, and then do a NORMAL MERGE into `release`. Do NOT squash or rebase; do NOT yet push a tag. This should be done from your local command line (and will succeed as long as the release PR is reviewed and status checks have passed):

   ```shell
   # note: make sure you have pulled the latest changes for branch
   # release_${version} locally before merging into release
   git checkout release_${version}
   git pull
   git checkout release
   git pull

   git merge --ff-only release_${version}
   git push origin release
   ```

8. Make a tag for the release. This tag will have the actual target release version, no alpha prerelease tags involved. It should be the same as the `${version}` part of your release branch:

   ```shell
   git tag -a v${version} -m 'chore(release): ${version}'
   git show v${version}
   ```

   The `git show` should reveal that the tag is on what was, pre-merge, the last commit of your release branch and is, post-merge, the last commit of `release`. You should double-check this with the github web UI.

   Once the tag looks good, you can push it:

   ```shell
   git push origin v${version}
   ```

   The tag push will kick off release builds and deploy the results to customers. It will also create a release page where those builds and automatically generated in-depth changelogs will be posted.

9. Ensure all deploy jobs succeeded:

   - The Opentrons App should be prompting people to update to the new version.
   - https://pypi.org/project/opentrons/ should be showing the new version.

10. Release the Python Protocol API docs for this version (see below under Releasing Web Projects).

11. Update the download links on https://opentrons.com/ot-app/. That page is defined in an Opentrons private repository.

12. Open a PR of `release` into `edge`. Give the PR a name like `chore(release): Merge changes from ${version} into edge`. Once it passes, on the command line merge it into `edge`:

    ```shell
    git checkout edge
    git pull
    git merge --no-ff release
    ```

13. Use the PR title for the merge commit title. You can then `git push origin edge`, which will succeed as long as the PR is approved and status checks pass.

## Releasing Robot Software Stack Hotfixes

1. Ensure you have a system release created in GitHub (buildroot for OT2, oe-core for OT3) with all the changes you want to see, if any. If there aren't any, you don't have to create a new release; by default, the last tag is used for release builds.

2. Checkout `release` and make a release branch, without any new changes. The branch name should be `hotfix_${version}` to make it clear this is a hotfix.

   ```shell
   git checkout release
   git pull
   git checkout -b hotfix_${version}
   git push --set-upstream origin hotfix_${version}
   ```

3. Target the hotfix PRs on this branch.

4. Wordsmith the release notes in `app-shell/build/release-notes.md` and `api/release-notes.md` in a PR that uses the `chore` commit type.

5. Once the fixes and release notes have been merged into the hotfix branch, bump to an alpha version to begin qa by creating and pushing a tag. Let's call the new alpha version `${alphaVersion}`:

   ```shell
   git checkout hotfix_${version}
   git pull
   git tag -a v${alphaVersion} -m 'chore(release): ${alphaVersion}'
   git show v${alphaVersion}
   ```

6. Inspect the created tag and then push it:

   ```shell
   git show v${alphaVersion}
   ```

   The `git show` command should reveal that the tag points to the latest commit of the hotfix branch. You should verify this with the github web UI.

   ```shell
   git push v${alphaVersion}
   ```

7. QA the release build. If there are problems discovered, do normal PR processes to merge the further changes into the hotfix branch. Once issues are fixed, repeat steps 5-7 with a new alpha version.

8. Once QA is a pass, do a NORMAL MERGE into `release`. Do NOT squash or rebase. This should be done from your local command line (and will succeed as long as the release PR is reviewed and status checks have passed):

   ```shell
   # note: make sure you have pulled the latest changes for branch
   # release_${version} locally before merging into release
   git checkout hotfix_${version}
   git pull
   git checkout release
   git pull
   git merge --ff-only release_${version}
   git push origin release
   ```

9. Tag the release with its full target version, which we'll call `${version}` since it's no longer an alpha:

   ```shell
   git tag -a v${version} -m 'chore(release): ${version}'
   git show v${version}
   ```

   The `git show` command should reveal that the tag points to the most recent commit of the `release` branch, which should be the most recent commit on the hotfix branch you just merged. You should verify this with the Github web UI.

   Once the tag looks good, push it:

   ```shell
   git push origin v${version}
   ```

   Pushing the tag will create release builds and a github release page with the in-depth changelogs.

10. Ensure all deploy jobs succeeded:

    - The Opentrons App should be prompting people to update to the new version.
    - https://pypi.org/project/opentrons/ should be showing the new version.

11. Update the download links on https://opentrons.com/ot-app/. That page is defined in an Opentrons private repository.

12. Release the Python Protocol API docs for this version (see below under Releasing Web Projects)

13. Open a PR of `release` into `edge`. Give the PR a name like `chore(release): Merge changes from ${version} into edge`. Once it passes, on the command line merge it into `edge`:

    ```shell
    git checkout edge
    git pull
    git merge --no-ff release
    ```

14. Use the PR title for the merge commit title. You can then `git push origin edge`, which will succeed as long as the PR is approved and status checks pass.

### tag usage

We specify the version of a release artifact through a specifically-formatted git tag. We consider our monorepo to support several projects: robot stack, ot3, protocol-designer, etc. Tags look like this:

```shell
${projectPrefix}${projectVersion}
```

`${projectPrefix}` is the project name plus `@` for everything but robot stack, where it is `v`.

For instance, the tag for 6.2.1-alpha.3 of the robot stack is `v6.2.1-alpha.3`.
The tag for 4.0.0 of protocol designer is `protocol-designer@4.0.0`.
The tag for 0.1.2-beta.1 of ot3 is `ot3@0.1.2-beta.1`.

Versions follow [semver.inc][semver-inc]. QA is done on alpha builds, and only alpha tags should be pushed until you're ready to release the project.

## Releasing Web Projects

While our web projects also take their versions from appropriately-prefixed git tags, they will not be automatically deployed.

See [scripts/deploy/README.md](./scripts/deploy/README.md) for the release process of these projects.
