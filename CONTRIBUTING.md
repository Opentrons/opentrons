# Contributing Guide

Thanks for your interest in contributing to the Opentrons platform! This Contributing Guide is intended to ensure best practices for both internal Opentrons contributors as well as any external contributors. We want to make sure you’re set up to contribute effectively, no matter if you’re helping us out with bug reports, code, documentation, feature suggestions, or anything else. This guide covers:

*   [Opening Issues](#opening-issues)
*   [Opening Pull Requests](#opening-pull-requests)
*   [Commit Guidelines](#commit-guidelines)
*   [Project and Repository Structure](#project-and-repository-structure)
*   [Development Setup](#development-setup)
*   [Prior Art](#prior-art)

## Opening Issues

Filing an issue is a great way to contribute to the project! Bug reports and feature requests are really useful for us as we plan our work. If you’d like to open an issue, please consider the following questions before opening:

*   Is this issue for a bug, a feature request, or something else?
    *   Please make this is clear in your description so it’s easier to address
*   Has this issue already been opened?
    *   Duplicate tickets slow things down, so make sure to search before you open!
    *   If there’s already a ticket, please comment on the existing thread!
*   Is this a support request?
    *   If yes, you're better off checking out our [support page][support] rather than opening a GitHub issue

To ensure your issue can be addressed quickly, please fill out the sections in the existing issue template to the best of your ability!

## Opening Pull Requests

If you’d like to contribute code to the Opentrons platform, pull requests (PR's) are the way to do it. Any code contributions are greatly appreciated! If you’re an external contributor, we’re going to assume you are familiar with the fork and pull request flow. If not, this [blog post by Scott Lowe][fork-and-pull] is a good introduction.

Please note that by contributing to the Opentrons platform, you agree to share those contributions under the terms of the [Apache 2.0 license](./LICENSE).

Before opening any PR, please run through the following questions:

*   Does this PR address an already open issue?
    *   If not, please consider opening an issue first
    *   This is to ensure you don't end up duplicating work or wasting time on a PR that won't be accepted
*   Does this PR incorporate many different changes?
    *   If yes, would the PR work better as a series of smaller PR's?
    *   Our team is more than happy to help you figure out an incremental plan
*   Does this PR include code changes without test and/or documentation updates?
    *   If yes, your PR may not be ready to open
    *   Tests and documentation are a vital part of any code contribution
*   Are there a reasonable number of commits and are they properly informative?
    *   The best kind of PR is a tiny PR with a single commit
    *   To avoid introducing problems into our Git history, we may have to ask you to squash or otherwise amend your commit(s)
    *   See [Commit Guidelines](#commit-guidelines) below for tips on keeping a good Git history

To ensure your code is reviewed quickly and thoroughly, please fill out the sections in the existing pull request template best of your ability! If you’d like some recommended reading for writing good pull requests, check out:

*   [How to write the perfect pull request][how-to-write-pr]
*   [The (written) unwritten guide to pull requests][unwritten-guide-to-pr]
*   [The Art of a Pull Request][art-of-pr]

After your Pull Request is merged (or otherwise closed), you’ll want to make sure to delete the branch in GitHub. You probably want to delete your local branch, too, depending on your own personal organizational strategies / general paranoia.

### Deciding What to Work On

If you're looking for something to work on, especially for a first contribution, check out [our list of easy issues][easyfix]. Be sure to drop a comment in the thread before starting work to make sure nobody else has picked it up. Also, to understand a bit more of the plans developed by the Opentrons software engineering team, see the [documentation on software architecture and plans](https://github.com/Opentrons/opentrons/tree/edge/architecture-and-planning).

## Commit Guidelines

Good commit messages are essential to keeping an organized and readable Git history. A readable Git history makes our lives easier when doing necessary work like writing changelogs or tracking down regressions. Please read [How to Write a Git Commit Message][commit-message-how-to] by Chris Beams and then come back here. These selected guidelines (copied and pasted from that article) are a very good starting point to think about when writing your commit message:

1.  Separate subject from body with a blank line
2.  Capitalize the subject line
3.  Do not end the subject line with a period
4.  Use the imperative mood in the subject line
5.  Use the body to explain what and why vs. how

When committing, we use [commitizen][] to format our commit messages according to the [Conventional Commits][conventional-commits] specification. This allows us to automatically generate CHANGELOGs based on commit messages. To commit files, first install `commitizen`, then:

```shell
git add path/to/files
git cz
```

This will launch the commitizen wizard, which will ask you to:

1.  Select a commit type, which will be one of:
    1.  `feat` - A new feature
    2.  `fix` - A bug fix
    3.  `docs` - Documentation only changes
    4.  `style` - Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc
    5.  `refactor` - A code change that neither fixes a bug nor adds a feature
    6.  `perf` - A code change that improves performance
    7.  `test` - Adding missing tests or correcting existing tests
    8.  `build` - Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
    9.  `ci` - Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
    10. `chore` - Other changes that don't modify src or test files
2.  Select a scope
    * For `feat`, `fix`, `refactor`, and `perf`, this should a top-level project, e.g. `app` or `api`
    * For other commit types, use your best judgement or omit
3.  Write a short commit title
    * Written according to the guidelines above
4.  Write a longer description if necessary
    * Also written according to the guidelines above
5.  Mention any tickets addressed by the commit
    * e.g. `Closes #xyz`

![commitizen](https://user-images.githubusercontent.com/2963448/40452320-776de7e0-5eaf-11e8-9aa7-ad706713b197.gif)

## Project and Repository Structure

Most of Opentrons’ projects live in the [Opentrons/opentrons][repo] repository. Having multiple projects in one repository (also known as a monorepo) is convenient for keeping various inter-project dependencies in sync, but does require workflow considerations to keep everything organized and trackable.

Generally, the directory / file structure of our monorepo looks something like this:

*   \[Project]
*   \[Another Project]
*   etc.
*   `scripts` - Repository level scripts (mostly for CI)
*   `Makefile` - Top level makefile for CI
*   Various repository level dotfiles (CI and git config)
*   `README.md`, `CONTRIBUTING.md`, `LICENSE`, etc.

Our projects use a mix of languages, but mostly Python (backend + robotics) and JavaScript (frontend). Each project has its own `README` + `Makefile` + dependency management.

## Development Setup

If you'd like to contribute (or maybe just run the very latest and greatest version), this section details what you need to do to get your computer and local repository set up.

Individual projects may have additional instructions, so be sure to check out the various project `README`s, too.

### Environment and Repository

Your computer will need the following tools installed to be able to develop with the Opentrons platform:

*   macOS 10.11+, Linux, or Windows 10
    *   On Windows, please configure your git client to `autocrlf=input` if you intend to make API server changes and push them to the robot.
*   Python 3.6 ([pyenv](https://github.com/pyenv/pyenv) is optional, but recommended for macOS / Linux. If `pyenv` is not available for your system or you do not want to use it, you can set the environment variable `OT_PYTHON` to the full path to the Python 3.6 executable)

    ```shell
    pyenv install 3.6.4
    ```

*   Node v8 LTS (Carbon) - [nvm][] is optional, but recommended

    ```shell
    nvm install lts/carbon
    ```

*   [yarn][yarn-install] - JavaScript package manager

*   [commitizen][] - Commit message formatter

    ```shell
    yarn global add commitizen
    ```

*   GNU Make - we use [Makefiles][] to manage our builds

*   cURL - used to push development updates to robots

Once you're set up, clone the repository and install all project dependencies:

```shell
git clone https://github.com/Opentrons/opentrons.git
cd opentrons
make install
```

### Testing and Linting

You can test with:

```shell
# run all tests
make test

# run a specific project's tests
make -C api test
make -C update-server test
make -C components test
make -C protocol-designer test
make -C app test
```

And you can run code linting / typechecking with:

```shell
# lint all code
make lint

# lint specific languages
make lint-py
make lint-js
make lint-css
```

### Opentrons API

Be sure to check out the [API `README`][api-readme] for additional instructions. To run the Opentrons API in development mode:

```shell
# run API with virtual robot
make -C api dev
# run API with robot's motor driver connected via USB to UART cable
make -C api dev ENABLE_VIRTUAL_SMOOTHIE=false

# push the current contents of the api directory to robot for testing
# defaults to currently connected ethernet robot
make push-api
# takes optional host variable for other robots
make push-api host=${some_other_ip_address}

# SSH into the currently connected ethernet robot
make term
# takes optional host variable for other robots
make term host=${some_other_ip_address}
```

### Releasing (for Opentrons developers)

Our release process is still a work-in-progress. All projects are currently versioned together to ensure interoperability.

1.  `make bump` (see details below)
2.  Inspect version bumps and changelogs
3.  `git add --all`
4.  `git cz`
    - Type: `chore`
    - Scope: `release`
    - Message: `${version}`
5.  Open a PR into `edge`
6.  Squash merge the PR once approved
7.  Verify that CI is green on `edge` and test the build artifacts
8.  Pull latest `edge` to your machine
9.  `git tag -a v${version} -m 'chore(release): ${version}'`
10. `git push --tags`

#### `make bump` usage

`make bump` runs `lerna publish` (with npm and git push disabled) to bump all required files. You can pass options to lerna with the `opts` environment variable. See the [lerna publish docs][lerna-publish] for available options. The most important options are:

- `--preid` - Used to specify the pre-release identifier
    - Default: `alpha`
    - Valid: `alpha`, `beta`
- `--cd-version` - Used to specify a semantic version bump
    - Default: `prerelease`
    - Valid: `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, `prerelease`
    - See [semver.inc][semver-inc] for keyword meanings
- `--repo-version` - Used to specify an explicit version

```shell
# by default, bump to next alpha prerelease:
#   e.g. 3.0.0 -> 3.0.1-alpha.0
#   e.g. 3.0.1-alpha.0 -> 3.0.1-alpha.1
make bump

# equivalent to above
make bump opts="--preid=alpha --cd-version=prerelease"

# bump to a beta version
make bump opts="--preid=beta"

# prerelease minor version bump (e.g. 3.0.0 -> 3.1.0-alpha.0)
make bump opts="--cd-version=preminor"

# minor version bump (e.g. 3.0.0-alpha.0 -> 3.1.0)
make bump opts="--cd-version=minor"

# bump to an explicit version
make bump opts="--repo-version=42.0.0"
```

We use [lerna][], a monorepo management tool, to work with our various projects. You can use lerna to do things like see which projects have changed since the last release, or run a command in every project directory. To run a one-off lerna command, use:

```shell
# use yarn run to run devDependency CLI tools like lerna
yarn run lerna [opts]
```

## Prior Art

This Contributing Guide was influenced by a lot of work done on existing Contributing Guides. They're great reads if you have the time!

*   [React.js Contributing Guide][react-contributing]
*   [Node.js Contributing Guide][node-contributing]
*   [Kibana Contributing Guide][kibana-contributing]

## Developer "Gotchas"

This section contains general information about problems we've encountered before so we don't have to keep researching the same issue over and over (and instead of keeping the info in the heads of individual developers)

### Docker issues

#### COPY

If you get an error in Docker build like this:

```
Step 24/45 : COPY ./api-server-lib /tmp/api-server-lib
COPY failed: stat /var/lib/docker/tmp/docker-builder657112660/api-server-lib: no such file or directory
```

You need to add an exception the directory to the ".dockerignore" file. In this case, the exception is `!/api-server-lib/**`

#### Architecture

If you run a Docker image on your computer and get:

```
Unknown target IFA type: 6
```

You probably built against the wrong CPU architecture (ARM instead of x86_64). The top of the Dockerfile has two `FROM` lines, with one of them commented out. Comment out the one that contains "raspberrypi3" and uncomment the one that contains "amd64", and then re-build your image.

If you get:

```
panic: standard_init_linux.go:175: exec user process caused "exec format error"
```

You probably built against x86_64 and tried to run it on a Raspberry Pi. Switch to the "raspberrypi" `FROM` line.

[repo]: https://github.com/Opentrons/opentrons
[api-readme]: ./api/README.rst
[easyfix]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Aeasyfix
[support]: https://support.opentrons.com/
[fork-and-pull]: https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/
[how-to-write-pr]: https://github.com/blog/1943-how-to-write-the-perfect-pull-request
[unwritten-guide-to-pr]: https://www.atlassian.com/blog/git/written-unwritten-guide-pull-requests
[art-of-pr]: https://ponyfoo.com/articles/art-of-pull-request
[commit-message-how-to]: https://chris.beams.io/posts/git-commit/
[react-contributing]: https://reactjs.org/docs/how-to-contribute.html
[node-contributing]: https://github.com/nodejs/node/blob/master/CONTRIBUTING.md
[kibana-contributing]: https://github.com/elastic/kibana/blob/master/CONTRIBUTING.md
[makefiles]: https://en.wikipedia.org/wiki/Makefile
[nvm]: https://github.com/creationix/nvm
[yarn-install]: https://yarnpkg.com/en/docs/install
[commitizen]: https://github.com/commitizen/cz-cli
[conventional-commits]: https://conventionalcommits.org/
[lerna]: https://github.com/lerna/lerna
[lerna-publish]: https://github.com/lerna/lerna#publish
[semver-inc]: https://github.com/npm/node-semver#functions
