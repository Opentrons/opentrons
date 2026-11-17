# Opentrons Documentation

> [!NOTE]
> If you're looking to read the Opentrons Documentation, visit <https://docs.opentrons.com>.
>
> This document contains information on how the documentation is generated, and how to contribute to it.

Opentrons Documentation is written in [Markdown](https://daringfireball.net/projects/markdown/) and built with [MkDocs](https://www.mkdocs.org) and the [Material](https://squidfunk.github.io/mkdocs-material/) documentation framework.

This directory contains:

- Subdirectories for each publication within the documentation site, such as `flex/` and `protocol-designer/`. Each of these is a full MkDocs project that you can build or serve separately.
- The `mkdocs.yml` configuration file for the entire documentation site. It specifies the [mkdocs-monorepo-plugin](https://github.com/backstage/mkdocs-monorepo-plugin) for including individual publications in its navigation.
- A single-purpose custom plugin, `mkdocs-parent-css-plugin`. All this plugin does is allow the individual publication MkDocs sites to load CSS files that are higher in the file hierarchy than their root. (These files are in `docs/shared/`.)

## Development setup

1. Install `make`, if necessary.
2. Install the pinned [`uv`](https://docs.astral.sh/uv/getting-started/installation/) version from the repo-root [`uv.toml`](../uv.toml) (`curl -LsSf https://astral.sh/uv/0.12.1/install.sh | sh`).
3. In this directory, run `make setup` to install dependencies.

## Building and serving

To build a static, local copy of the documentation, run `make build`.

To build and serve the documentation, so you can navigate it in your browser, run `make serve`. When running, the documentation is available at `http://127.0.0.1:8000/`. If you need to run the server on a different port or IP address, use `uv run mkdocs serve` with the appropriate options.

## Project conventions

- Filenames should be all lowercase and represent word boundaries with a hyphen.
- Prefer [autorefs](https://mkdocstrings.github.io/autorefs/)-style links to traditional Markdown links when linking to headers.
- Pages should not have level 1 headers. Instead use `title` metadata in the form `<Publication name>: <Page name or topic>`. For example:

    ```
    ---
    title: "Thermocycler Module: Flex Attachment Steps"
    ---
    ```
- The `site_name` in the `mkdocs.yml` file for any individual publication should match its directory name. The monorepo plugin uses this value as data, not metadata, to determine the path to that publication's pages.

## Deployment

### Environments

- **Production**: <https://docs.opentrons.com>
- **Staging**: <https://staging.docs.opentrons.com>
- **Sandbox**: <https://sandbox.docs.opentrons.com/{branch}/>

#### Strategy

The `/docs` folder is what we call mkdocs and is currently separate from the Sphinx API docs which are in the /api folder. mkdocs and the API docs may deploy from different commits. When you create and push tags as described below, a GitHub Action will build and deploy the documentation to the appropriate environment.  We no longer promote builds from the sandbox up to staging and production, instead we build and deploy directly to each environment from the commit that the tag is created on.

#### Sandbox

Upon push to `edge`, or any `chore_release*` branch, a sandbox deployment is created. The URL is in the format above, where `{branch}` is the name of the branch. For example, a push to `edge` creates a deployment at <https://sandbox.docs.opentrons.com/edge/>.  In addition all branches that open a PR will have a deployment created for that branch.

#### Why Staging?

The purpose of staging is to allow us to push the build(s) we want in production to a separate environment first to verify everything looks good.

#### Staging mkdocs

To deploy a build to staging, create a tag with the prefix `staging-mkdocs`. Pushing it to the repository will trigger a deployment to <https://staging.docs.opentrons.com>.

##### Staging Sphinx API docs

To deploy a build to staging, create a tag with the prefix `staging-docs@`. Pushing it to the repository will trigger a deployment to <https://staging.docs.opentrons.com>.

##### Production mkdocs

To push a build to production, create a tag with the prefix `mkdocs`. Pushing it to the repository will trigger a deployment to <https://docs.opentrons.com>.

##### Production Sphinx API docs

To push a build to production, create a tag with the prefix `docs@`. Pushing it to the repository will trigger a deployment to <https://docs.opentrons.com>.

### Rollback

If we need to rollback a deployment, we can do so by creating a tag with the same prefix as above, but on the commit we want to rollback to.  Simply increment the tag version and push it to the repository.

- For example, if the current production mkdocs tag is `mkdocs-2025-10-01` and we want to rollback to the previous version, we would create a tag `mkdocs-2025-10-01.1` on the commit that `mkdocs-2025-09-29` is on and push it to the repository.
- For example, if the current production Sphinx API docs tag is `docs@26` and we want to rollback to the previous version, we would create a tag `docs@26.1` on the commit that `docs@25` is on and push it to the repository.
- Note that the version number after the prefix is arbitrary and can be whatever you want, but it must be unique.  In mkdocs we are using a quasi-date format, and in Sphinx we are using a simple incrementing integer that matches the API version.
