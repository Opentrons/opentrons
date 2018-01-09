# Contributing Guide

Thanks for your interest in contributing to the Opentrons platform! This Contributing Guide is intended to ensure best practices for both internal Opentrons contributors as well as any external contributors. We want to make sure you’re set up to contribute effectively, no matter if you’re helping us out with bug reports, code, documentation, feature suggestions, or anything else. This guide covers:

*   [Opening Issues](#opening-issues)
*   [Opening Pull Requests](#opening-pull-requests)
*   [Commit Guidelines](#commit-guidelines)
*   [Project and Repository Structure](#project-and-repository-structure)
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

If you're looking for something to work on, especially for a first contribution, check out [our list of easy issues][easyfix]. Be sure to drop a comment in the thread before starting work to make sure nobody else has picked it up.

## Commit Guidelines

Good commit messages are essential to keeping an organized and readable Git history. A readable Git history makes our lives easier when doing necessary work like writing changelogs or tracking down regressions. Please read [How to Write a Git Commit Message][commit-message-how-to] by Chris Beams and then come back here. The following seven rules (copied and pasted from that article) are a very good starting point to think about when writing your commit message:

1.  Separate subject from body with a blank line
2.  Limit the subject line to 50 characters
3.  Capitalize the subject line
4.  Do not end the subject line with a period
5.  Use the imperative mood in the subject line
6.  Wrap the body at 72 characters
7.  Use the body to explain what and why vs. how

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


## Prior Art

This Contributing Guide was influenced by a lot of work done on existing Contributing Guides. They're great reads if you have the time!

*   [React.js Contributing Guide][react-contributing]
*   [Node.js Contributing Guide][node-contributing]
*   [Kibana Contributing Guide][kibana-contributing]

[repo]: https://github.com/Opentrons/opentrons
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
