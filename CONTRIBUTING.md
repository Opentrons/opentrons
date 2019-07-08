# Contributing Guide

Thanks for your interest in contributing to the Opentrons platform! This Contributing Guide is intended to ensure best practices for both internal Opentrons contributors as well as any external contributors. We want to make sure you’re set up to contribute effectively, no matter if you’re helping us out with bug reports, code, documentation, feature suggestions, or anything else. This guide covers:

- [Opening Issues](#opening-issues)
- [Opening Pull Requests](#opening-pull-requests)
- [Commit Guidelines](#commit-guidelines)
- [Project and Repository Structure](#project-and-repository-structure)
- [Development Setup](#development-setup)
- [Prior Art](#prior-art)

## Opening Issues

Filing an issue is a great way to contribute to the project! Bug reports and feature requests are really useful for us as we plan our work. If you’d like to open an issue, please consider the following questions before opening:

- Is this issue for a bug, a feature request, or something else?
  - Please make this is clear in your description so it’s easier to address
- Has this issue already been opened?
  - Duplicate tickets slow things down, so make sure to search before you open!
  - If there’s already a ticket, please comment on the existing thread!
- Is this a support request?
  - If yes, you're better off checking out our [support page][support] rather than opening a GitHub issue

To ensure your issue can be addressed quickly, please fill out the sections in the existing issue template to the best of your ability!

## Opening Pull Requests

If you’d like to contribute code to the Opentrons platform, pull requests (PR's) are the way to do it. Any code contributions are greatly appreciated! If you’re an external contributor, we’re going to assume you are familiar with the fork and pull request flow. If not, this [blog post by Scott Lowe][fork-and-pull] is a good introduction.

Please note that by contributing to the Opentrons platform, you agree to share those contributions under the terms of the [Apache 2.0 license](./LICENSE).

Before opening any PR, please run through the following questions:

- Does this PR address an already open issue?
  - If not, please consider opening an issue first
  - This is to ensure you don't end up duplicating work or wasting time on a PR that won't be accepted
- Does this PR incorporate many different changes?
  - If yes, would the PR work better as a series of smaller PR's?
  - Our team is more than happy to help you figure out an incremental plan
- Does this PR include code changes without test and/or documentation updates?
  - If yes, your PR may not be ready to open
  - Tests and documentation are a vital part of any code contribution
- Are there a reasonable number of commits and are they properly informative?
  - The best kind of PR is a tiny PR with a single commit
  - To avoid introducing problems into our Git history, we may have to ask you to squash or otherwise amend your commit(s)
  - See [Commit Guidelines](#commit-guidelines) below for tips on keeping a good Git history

To ensure your code is reviewed quickly and thoroughly, please fill out the sections in the existing pull request template best of your ability! If you’d like some recommended reading for writing good pull requests, check out:

- [How to write the perfect pull request][how-to-write-pr]
- [The (written) unwritten guide to pull requests][unwritten-guide-to-pr]
- [The Art of a Pull Request][art-of-pr]

After your Pull Request is merged (or otherwise closed), you’ll want to make sure to delete the branch in GitHub. You probably want to delete your local branch, too, depending on your own personal organizational strategies / general paranoia.

### Deciding What to Work On

If you're looking for something to work on, especially for a first contribution, check out [our list of easy issues][easyfix]. Be sure to drop a comment in the thread before starting work to make sure nobody else has picked it up. Also, to understand a bit more of the plans developed by the Opentrons software engineering team, see the [documentation on software architecture and plans](https://github.com/Opentrons/opentrons/tree/edge/architecture-and-planning).

## Commit Guidelines

### Before you commit

Before you're ready to make a commit, you should do you best to make sure that:

- All tests are passing
  - `make test`
  - See [Testing](#Testing) section for more details
- All code quality checks are passing
  - `make format lint`
  - See [Code quality](#Code-quality) section for more details
  - Especially consider [setting up your code editor](#Editor-setup) to run formatting and quality checks automatically as you code

### Making your commit

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
    - For `feat`, `fix`, `refactor`, and `perf`, this should a top-level project, e.g. `app` or `api`
    - For other commit types, use your best judgement or omit
3.  Write a short commit title
    - Written according to the guidelines above
4.  Write a longer description if necessary
    - Also written according to the guidelines above
5.  Mention any tickets addressed by the commit
    - e.g. `Closes #xyz`

![commitizen](https://user-images.githubusercontent.com/2963448/40452320-776de7e0-5eaf-11e8-9aa7-ad706713b197.gif)

## Project and Repository Structure

Most of Opentrons’ projects live in the [Opentrons/opentrons][repo] repository. Having multiple projects in one repository (also known as a monorepo) is convenient for keeping various inter-project dependencies in sync, but does require workflow considerations to keep everything organized and trackable.

Generally, the directory / file structure of our monorepo looks something like this:

- \[Project]
- \[Another Project]
- etc.
- `scripts` - Repository level scripts (mostly for CI)
- `Makefile` - Top level makefile for CI
- Various repository level dotfiles (CI and git config)
- `README.md`, `CONTRIBUTING.md`, `LICENSE`, etc.

Our projects use a mix of languages, but mostly Python (backend + robotics) and JavaScript (frontend). Each project has its own `README` + `Makefile` + dependency management.

## Development Setup

If you'd like to contribute (or maybe just run the very latest and greatest version), this section details what you need to do to get your computer and local repository set up.

Individual projects may have additional instructions, so be sure to check out the various project `README`s, too.

### Environment and Repository

Your computer will need the following tools installed to be able to develop with the Opentrons platform:

- macOS 10.11+, Linux, or Windows 10
  - On Windows, please configure Git’s `core.autocrlf` setting (see the [Git config docs](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration)) to `input` so that shell scripts required for the robot’s boot process in `api/opentrons/resources` do not have carriage returns inserted.
- Python 3.6 ([pyenv](https://github.com/pyenv/pyenv) is optional, but recommended for macOS / Linux. If `pyenv` is not available for your system or you do not want to use it, you can set the environment variable `OT_PYTHON` to the full path to the Python 3.6 executable)
- If you wish to use `pyenv` but are experiencing issues with macOS Mojave please see the [common build problems section](https://github.com/pyenv/pyenv/wiki/Common-build-problems) of `pyenv` documentation.

  ```shell
  pyenv install 3.6.4
  ```

- Node v8 LTS (Carbon) - [nvm][] is optional, but recommended

  ```shell
  nvm install lts/carbon
  ```

- [yarn][yarn-install] - JavaScript package manager

- [commitizen][] - Commit message formatter

  ```shell
  yarn global add commitizen
  ```

- GNU Make - we use [Makefiles][] to manage our builds

- cURL - used to push development updates to robots

Once you're set up, clone the repository and install all project dependencies:

```shell
git clone https://github.com/Opentrons/opentrons.git
cd opentrons
make install
```

In addition, if (and only if) you want to build a PDF version of the Opentrons API documentation, you must install a latex distribution that includes a callable pdflatex. If that is installed, you can do `make -C api docs-pdf`.

### Testing

We use:

- [pytest][] to test Python
- [Jest][jest] to test JavaScript
  - To run tests in watch mode, you should also install [watchman][]

You can tests with:

```shell
# run all tests
make test

# run tests per language
make test-py
make test-js
```

You can pass some options to the JavaScript tests:

```shell
# run JavaScript tests in watch mode
make test-js watch=true

# disable test coverage
make test-js cover=false

# update snapshot tests
# https://jestjs.io/docs/en/snapshot-testing
make test-js updateSnapshot=true
```

And you can run code linting / typechecking with:

```shell
# lint all code
make lint

# lint + typecheck specific languages
make lint-py
make lint-js
make lint-css
make check-js
```

[pytest]: https://docs.pytest.org/en/latest/
[jest]: https://jestjs.io/
[watchman]: https://facebook.github.io/watchman/

### Code quality

To help with code quality and maintainability, we use a collection of tools that can be roughly sorted into the following categories (with some overlaps):

- [Linters][lint]
  - Analyze the code for various potential bugs and errors
  - [Pylama][pylama] - Python code audit tool
  - [ESLint][eslint] - JavsScript/JSON linter
  - [stylelint][] - CSS linter
- [Typecheckers][type-check]
  - Verify that the code is [type safe][type-safe]
  - [mypy][] - Static type checker for Python
  - [Flow][flow] - Static type checker for JavaScript
- Formatters
  - (Re)format source code to adhere to a consistent [style][code-style]
  - [Prettier][prettier] - Code formatter for JavaScript, JSON, Markdown, and YAML

These tools can be run with the following commands:

```shell
# lint all code and run all typechecks
make lint

# lint by language
# note: Python linting also includes typechecking
make lint-py
make lint-js
make lint-json
make lint-css

# typecheck JavaScript code
make check-js

# format JavaScript, JSON, Markdown, and YAML
make format
```

[lint]: https://en.wikipedia.org/wiki/Lint_(software)
[type-check]: https://en.wikipedia.org/wiki/Type_system#Type_checking
[type-safe]: https://en.wikipedia.org/wiki/Type_safety
[code-style]: https://en.wikipedia.org/wiki/Programming_style
[eslint]: https://eslint.org/
[pylama]: https://github.com/klen/pylama
[stylelint]: https://stylelint.io/
[flow]: https://flow.org/
[mypy]: http://mypy-lang.org/
[prettier]: https://prettier.io/

#### Editor setup

Most, if not all, of the tools above have plugins available for your code editor that will run quality checks and formatting as you write and/or save. We **highly recommend** setting up your editor to format and check your code automatically.

- Pylama - Search your editor's package manager
- ESLint - <https://eslint.org/docs/user-guide/integrations#editors>
- stylelint - <https://stylelint.io/user-guide/complementary-tools/#editor-plugins>
- mypy - Search your editor's package manager
- Flow - <https://flow.org/en/docs/editors/>
- Prettier - <https://prettier.io/docs/en/editors.html>

### Opentrons API

Be sure to check out the [API `README`][api-readme] for additional instructions. To run the Opentrons API in development mode:

```shell
# run API with virtual robot
make -C api dev
# run API with robot's motor driver connected via USB to UART cable
make -C api dev ENABLE_VIRTUAL_SMOOTHIE=false
```

To put the API on a test robot, if it's on balena do:

```shell
# push the current contents of the api directory to robot for testing
# defaults to currently connected ethernet robot
make push-api
# takes optional host variable for other robots
make push-api host=${some_other_ip_address}
```

and if it's on buildroot do:

```shell
# push the current contents of the api directory to robot for testing
# defaults to currently connected ethernet robot
make -C api push-buildroot
# takes optional host variable for other robots
make -C api push-buildroot host=${some_other_ip_address}
```

Note that there is no separate `restart` command because `push-buildroot` restarts the systemd unit controlling the API server. This only pushes the python wheel containing the API server; if you have edited the systemd unit, you'll need to `scp` it manually and then do `systemctl daemon-reload` on the robot before restarting the api server.

To SSH into the robot, do
```
# SSH into the currently connected ethernet robot
make term
# takes optional host variable for other robots
make term host=${some_other_ip_address}
```

If the robot is on buildroot and `make term` complains about not having a key, you may need to install a public key on the robot. To do this, create an ssh key and install it:

```shell
ssh-keygen # note the path you save the key to
make -C api install-key br_ssh_pubkey=/path/to/pubkey
```

and subsequently, when you do `make term`, add the `br_ssh_key=/path/to/key` option:

```shell
make term br_ssh_key=/path/to/privkey
```

If you create the key as `~/.ssh/robot_key` and `~/.ssh/robot_key.pub` then `make term` and `make install-key` will work without arguments.

### Releasing (for Opentrons developers)

Our release process is still a work-in-progress. All projects are currently versioned together to ensure interoperability.

1.  `make bump` (see details below)
2.  Inspect version bumps and changelogs
3.  Edit the user-facing changelog at `app-shell/build/release-notes.md` to add the new notes for the app
4.  Edit the user-facing changelog at `api/release-notes.md` to add the new notes for the robot software
5.  `git checkout -b release_${version}` (The branch name _must_ match `release_*` to trigger signed builds that can be used as RCs)
6.  `git add --all`
7.  `git cz`
    - Type: `chore`
    - Scope: `release`
    - Message: `${version}`
8.  Open a PR into `edge`
9.  Squash merge the PR once approved
10. Verify that CI is green on `edge` and test the build artifacts
11. Pull latest `edge` to your machine
12. `git tag -a v${version} -m 'chore(release): ${version}'`
13. `git push --tags`

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

# bump to a beta version, the standard practice for a new release
make bump opts="--preid=beta"

# prerelease minor version bump (e.g. 3.0.0 -> 3.1.0-alpha.0)
make bump opts="--cd-version=preminor"

# minor version bump (e.g. 3.0.0-alpha.0 -> 3.1.0)
make bump opts="--cd-version=minor"

# bump to an explicit version
make bump opts="--repo-version=42.0.0"

# bump a patch version, e.g. for a hotfix that does not require a beta
make bump opts="--cd-version=patch"
```

We use [lerna][], a monorepo management tool, to work with our various projects. You can use lerna to do things like see which projects have changed since the last release, or run a command in every project directory. To run a one-off lerna command, use:

```shell
# use yarn run to run devDependency CLI tools like lerna
yarn run lerna [opts]
```

## Prior Art

This Contributing Guide was influenced by a lot of work done on existing Contributing Guides. They're great reads if you have the time!

- [React.js Contributing Guide][react-contributing]
- [Node.js Contributing Guide][node-contributing]
- [Kibana Contributing Guide][kibana-contributing]

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

## Robot Environment

When you have sshd in to a robot using `make term`, its behavior depends on whether it is on balena or on buildroot. You can tell by doing `ps | head -n 2`; if pid 1 is `systemd`, you're on buildroot and if it is `tini` you're on balena.

### Log Locations

#### Balena

The files `/data/logs/api.log.*` and `/data/logs/serial.log.*` contain logs from the api server and serial system, respectively. Only things logged with python `logging` are here. To get logs printed to stdout by the api server, you can check balena. nginx logs are in `/var/log/nginx`. This system is inside a docker container; you can get a shell to the host from balena if you need deeper logging. However, things printed to stdout and stderr by the api server are only available in the balena log viewer and therefore are frequently lost.

#### Buildroot

Buildroot robots use [systemd-journald][] for log management. This is a single log manager for everything on the system. It is administrated using the [journalctl][] utility. You can view logs by just doing `journalctl` (it may be better to do `journalctl --no-pager | less` to get a better log viewer), or stream them by doing `journalctl -f`. Any command that displays logs can be narrowed down by using a syslog identifier: `journalctl -f SYSLOG_IDENTIFIER=opentrons-api` will only print logs from the api server's loggers, for instance. Our syslog identifiers are:
- `opentrons-api`: The API server - anything sent to `logging` logs from the api server package, except the serial logs
- `opentrons-update-server`: Anything sent to `logging` logs from the update server packate
- `opentrons-api-serial`: The serial logs

### State Management

#### Balena

You can't really restart anything from inside a shell on balena, since it all runs in a docker container. Instead, you can do `restart` and restart the docker container, but this will disconnect you. Stop ongoing processes by doing `ps`, finding the pid, and then doing `kill (pid)`. This can be useful to temporarily run one of the servers directly, to see what it prints out on the command line. Note that when you do this the environment won't be quite the same as what the server sees when it is run directly by balena due to the implementation details of `docker run`, `tini`, and our start scripts.

#### Buildroot

Buildroot robots use `systemd` as their init system. Every process that we run has an associated systemd unit, which defines and configures its behavior when the robot starts. You can use the [systemctl][] utility to mess around with or inspect the system state. For instance, if you do `systemctl status opentrons-api-server` you will see whether the api server is running or not, and a dump of its logs. You can restart units with `systemctl restart (unitname)`, start and stop them with `systemctl start` and `systemctl stop`, and so on. Note that if you make changes to unit files, you have to run `systemctl daemon-reload` (no further arguments) for the init daemon to see the changes.

Our systemd units are:
- `opentrons-api-server`: The API server
- `opentrons-update-server`: The update server

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
[systemd-journald]: https://www.freedesktop.org/software/systemd/man/systemd-journald.service.html
[journalctl]: https://www.freedesktop.org/software/systemd/man/journalctl.html
[systemctl]: https://www.google.com/search?client=firefox-b-1-d&q=systemctl
