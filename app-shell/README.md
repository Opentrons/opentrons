# Opentrons Desktop Shell

[![JavaScript Style Guide][style-guide-badge]][style-guide]

> Desktop application wrapper for the [Opentrons App](../app) using Electron

## overview

This directory contains the code for the [Electron main process][electron-main] that runs the Opentrons application.

## developing

To get started: clone the Opentrons/opentrons repository, set up your computer for development as specified in the [project readme][project-readme-setup], and then:

``` shell
# prerequisite: install dependencies as specified in project setup
make install
# change into the app-shell directory
cd app-shell
# install dependencies
make install
# launch the electron app in dev mode
make dev
```

You probably want to be developing from the [app directory](../app) instead. Its `make dev` task will automatically call `make dev` here in `app-shell`.

## stack and structure

The desktop application shell uses:

*   [Electron][]
*   [Electron Builder][electron-builder]

## testing and linting

The desktop shell has no tests at this time.

To lint the JS:

*   `make lint` - Lint JS

## building

This section details production build instructions for the desktop application.

### build dependencies

`electron-builder` requires some native dependencies to build and package the app (see [the electron-builder docs][electron-builder-platforms]).

*   macOS - None
*   Windows - None
*   Linux - icnsutils, graphicsmagick, and xz-utils

    ```shell
    sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
    ```

### build tasks

*   `make` - Default target is "clean package"
*   `make clean` - Delete the dist folder
*   `make package` - Package the app for running and inspection (does not create a distributable)
*   `make dist-mac` - Create a macOS distributable of the app
*   `make dist-linux` - Create a Linux distributable of the app
*   `make dist-posix` - Create macOS and Linux apps simultaneously
*   `make dist-win` - Create a Windows distributable of the app

All packages and/or distributables will be placed in `app-shell/dist`. After running `make package`, you can launch the production app with:

*   macOS: `./dist/mac/Opentrons.app/Contents/MacOS/Opentrons\ Run`
*   Linux: `./dist/linux-unpacked/opentrons-run`
*   Windows: `TODO`

To run the production app in debug mode, set the `DEBUG` environment variable. For example, on macOS:

```shell
DEBUG=1 `./dist/mac/Opentrons.app/Contents/MacOS/Opentrons\ Run`
```

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600

[project-readme-setup]: ../README.md#set-up-your-development-environment

[electron]: https://electron.atom.io/
[electron-main]: https://electronjs.org/docs/tutorial/quick-start#main-process
[electron-builder]: https://www.electron.build/
[electron-builder-platforms]: https://www.electron.build/multi-platform-build
