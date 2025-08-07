---
title: "Opentrons Flex: Open-Source Software"
---

# Open-Source Software

Opentrons believes that open-source software and hardware make science
better. That's why we make our code available on GitHub and welcome
contributions from the open-source community.

This appendix covers various ways to use Opentrons open-source resources
and describes the structure of our repositories.

## Opentrons on GitHub

The Opentrons GitHub organization can be found at <https://github.com/Opentrons>. All of our publicly
hosted code resides there, including the Flex robot software, the
Opentrons App, and our Python and HTTP APIs.

Our GitHub site has several useful resources for Flex users, and you can
participate in our community even if you're not a coder.

!!! note
    As you browse our GitHub repositories, you will encounter references to `ot3`, which is a model identifier for Opentrons Flex. If you're having trouble finding something when searching for "Flex", try searching for "ot3" or "OT-3" instead.

### Releases

Whenever we create a new version of the robot software and Opentrons
App, we publish it on GitHub as a release. Past releases of Opentrons
software are kept at <https://github.com/Opentrons/opentrons/releases>.

Opentrons recommends running the latest version of our software.
However, we recognize that some users need access to previous versions
(e.g., for validation or compliance purposes). Download previous
versions of the Opentrons App or robot software under the **Assets**
section of each release entry on GitHub.

### Opening issues

Contact Opentrons Support first if you're having a problem with your
robot. Before opening an issue, search through [existing issues](https://github.com/Opentrons/opentrons/issues) to prevent creating a
duplicate.

We accept two types of issue reports: bugs and feature requests. Each
has its own issue template. Fill out all parts of the template with as
much detail as possible to help us address your issue completely and
quickly.

### Contributing code

Get started working with Opentrons code by following the [development environment setup instructions](https://github.com/Opentrons/opentrons/blob/edge/DEV_SETUP.md). Work on your
code in your own fork and then create a pull request to contribute to
our codebase. For additional details on creating pull requests,
including testing requirements, see the [contributing guide](https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md).

### Open-source licenses

Most Opentrons repositories are licensed under the Apache License 2.0,
but some use other licenses. Consult the license on each repository
before using or modifying the code it contains. Keep in mind that any
code you contribute will be governed by the license in place on the
corresponding repository.

## Opentrons monorepo

Most of our software is in the [Opentrons/opentrons](https://github.com/Opentrons/opentrons) *monorepo*: a single repository that
contains multiple software projects, each in its own directory. The
`README.md` file in each directory describes the project and gives advice
on working with the code. The default branch in the monorepo is called
`edge`.

The following (non-exhaustive) list of directories, subdirectories, and
files can help you navigate the monorepo and find code relevant to using
Flex.

| Path {width="25%"} | Description |
|------|-------------|
| [`/api/`](https://github.com/Opentrons/opentrons/tree/edge/api) | Source for the Python Protocol API, written in Python and distributed as the `opentrons` PyPI package. |
| [`/api/docs/`](https://github.com/Opentrons/opentrons/tree/edge/api/docs) | Documentation for the Python Protocol API, written in ReStructuredText. |
| [`/api/release-notes.md`](https://github.com/Opentrons/opentrons/blob/edge/api/release-notes.md) | Release notes for the robot system software (as a whole, including changes outside of the `/api/` directory). |
| [`/app-shell-odd/`](https://github.com/Opentrons/opentrons/tree/edge/app-shell-odd) | Electron application wrapper for the touchscreen software — "odd" stands for *on-device display*. |
| [`/app-shell/`](https://github.com/Opentrons/opentrons/tree/edge/app-shell) | Electron application wrapper for the Opentrons App. |
| [`/app-shell/build/`<br>`release-notes.md`](https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md) | Release notes for the Opentrons App (as a whole, including changes outside of the `/app-shell/` directory). |
| [`/app/`](https://github.com/Opentrons/opentrons/tree/edge/app) | Source for the Opentrons App. Use `make` commands in this directory to run the app from source. |
| [`/labware-library/`](https://github.com/Opentrons/opentrons/tree/edge/labware-library) | Source for the Labware Library website. |
| [`/protocol-designer/`](https://github.com/Opentrons/opentrons/tree/edge/protocol-designer) | Source for Protocol Designer, our no-code web application for creating JSON protocol files. |
| [`/robot-server/`](https://github.com/Opentrons/opentrons/tree/edge/robot-server) | The web service that runs the Opentrons HTTP API. The Opentrons App and touchscreen use HTTP API calls to control the robot. You can also write your own software that makes HTTP API calls or use software like `curl` or Postman to make individual calls to a robot. |
| [`/shared-data/`](https://github.com/Opentrons/opentrons/tree/edge/shared-data) | Special directory for data that needs to be shared between projects. |
| [`/shared-data/labware/`](https://github.com/Opentrons/opentrons/tree/edge/shared-data/labware) | Schema and labware definitions for Opentrons-verified labware. The Python Protocol API and Labware Library both use the definition files stored here. |
| [`/shared-data/python/`](https://github.com/Opentrons/opentrons/tree/edge/shared-data/python) | Source for the `opentrons-shared-data` Python package, which is a dependency of the main `opentrons` package. |

## Other repositories

Opentrons also maintains software outside of the monorepo. A few key
repositories include:

| Repository {width="25%"} | Description |
|---|---|
| [`oe-core`](https://github.com/Opentrons/oe-core) | The heart of Opentrons' [openembedded](https://www.openembedded.org/wiki/Main_Page) system definitions. |
| [`opentrons-emulation`](https://github.com/Opentrons/opentrons-emulation) | Emulation of Opentrons robots and modules at either the hardware or firmware level. Uses [Docker](https://www.docker.com/), configuration files, and a simple command-line interface. |
| [`opentrons-modules`](https://github.com/Opentrons/opentrons-modules) | Firmware for all Opentrons modules. |
| [`ot3-firmware`](https://github.com/Opentrons/ot3-firmware) | Firmware for Opentrons Flex and all of its peripheral systems. |