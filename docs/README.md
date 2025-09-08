# Opentrons Documentation

> [!NOTE]
> If you're looking to read the Opentrons Documentation, visit <https://docs.opentrons.com>.
>
> This document contains information on how the documentation is generated, and how to contribute to it.

Opentrons Documentation is written in [Markdown](https://daringfireball.net/projects/markdown/) and built with [MkDocs](https://www.mkdocs.org).

This directory contains:

- Subdirectories for each publication within the documentation site, such as `flex/` and `protocol-designer/`. Each of these is a full MkDocs project that you can build or serve separately.
- The `mkdocs.yml` configuration file for the entire documentation site. It specifies the [mkdocs-monorepo-plugin](https://github.com/backstage/mkdocs-monorepo-plugin) for including individual publications in its navigation.
- A single-purpose custom plugin, `mkdocs-parent-css-plugin`. All this plugin does is allow the individual publication MkDocs sites load CSS files that are higher in the file hierarchy than their root. (These files are in `docs/shared/`.)

## Development setup

1. Install `make`, if necessary.
2. [Install `uv`](https://docs.astral.sh/uv/getting-started/installation/).
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