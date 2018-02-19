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

## testing

The desktop shell has no tests at this time.

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
*   `make package` - Creates a production package of the app for running and inspection (does not create a distributable)

#### production builds

All packages and/or distributables will be placed in `app-shell/dist`. After running `make package`, you can launch the production app with:

*   macOS: `./dist/mac/Opentrons.app/Contents/MacOS/Opentrons`
*   Linux: `./dist/linux-unpacked/opentrons`
*   Windows: `./dist/win-unpacked/Opentrons.exe`

To run the production app in debug mode, set the `DEBUG` environment variable. For example, on macOS:

```shell
DEBUG=1 ./dist/mac/Opentrons.app/Contents/MacOS/Opentrons
```

#### ci

There are a series of tasks designed to be run in CI to create distributable versions of the app.

*   `make dist-osx` - Create a macOS distributable of the app
*   `make dist-linux` - Create a Linux distributable of the app
*   `make dist-posix` - Create macOS and Linux apps simultaneously
*   `make dist-win` - Create a Windows distributable of the app

These tasks need the following environment variables defined:

 name          | description   | why
-------------- | ------------- | -------------------------------------
 OT_BRANCH     | Branch name   | Sometimes added to the artifact name
 OT_BUILD      | Build number  | Appended to the artifact name
 OT_TAG        | Tag name      | Flags autoupdate files to be published
 OT_BUCKET_APP | AWS S3 bucket | Artifact deploy bucket
 OT_FOLDER_APP | AWS S3 folder | Artifact deploy folder in bucket

The release channel is set according to the version string:

-   `vM.m.p-alpha.x` - "alpha" channel
-   `vM.m.p-beta.x` - "beta" channel
-   `vM.m.p` - "latest" channel

The `electron-updater` autoupdate files (e.g. `beta-mac.yml`) will only be copied to the publish directory if `OT_TAG` is set.

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600

[project-readme-setup]: ../README.md#set-up-your-development-environment

[electron]: https://electron.atom.io/
[electron-main]: https://electronjs.org/docs/tutorial/quick-start#main-process
[electron-builder]: https://www.electron.build/
[electron-builder-platforms]: https://www.electron.build/multi-platform-build
