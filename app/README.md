# Opentrons Desktop App

[![JavaScript Style Guide][style-guide-badge]][style-guide]

[Download][] | [Support][]

## overview

The Opentrons desktop application lets you use and configure your [Opentrons personal pipetting robot][robots]. This directory contains the application's source code. If you're looking to download or for help with the app, please click one of the links above.

The Opentrons desktop application is built with [Electron][].

## developing

To get started once you've cloned the Opentrons/opentrons repository and set up your computer for development as specified in the [project readme][project-readme-setup]:

``` shell
# change into the app directory
$ cd app
# install dependencies
$ make install
# launch the dev server / electron app in dev mode
$ make dev
```

At this point, the Electron app will be running with [HMR] and various Chrome devtools enabled. The app and dev server look for the following environment variables (defaults set in Makefile):

variable   | default      | description
---------- | ------------ | -------------------------------------------------
`NODE_ENV` | `production` | Run environment: production, development, or test
`DEBUG`    | unset        | Runs the app in debug mode
`PORT`     | `8090`       | Development server port

**Note:** you may want to be running the Opentrons API in a different shell while developing the app. Please see [project readme][project-readme-server] for API specific instructions.

## stack and structure

The stack / build-chain runs on:

* [Electron][]
* [Electron Builder][electron-builder]
* [React][]
* [Redux][]
* [CSS modules][css-modules]
* [Babel][]
* [Webpack][]

Our files are organized into:

* `app/ui` — Front-end webapp run in Electron's renderer process
* `app/shell` — Electron's main process
* `app/rpc` - Opentrons API RPC client (see `api/opentrons/server`)
* `app/webpack` - Webpack configuration helpers

## testing, checking, and linting

To run tests:

* `$ make test` - Run all tests and then lints
* `$ make test-unit` - Run all unit tests

Test tasks can also be run with the following arguments:

arg   | default | description             | example
----- | ------- | ----------------------- | -----------------------------------
watch | false   | Run tests in watch mode | `$ make test-unit watch=true`
cover | !watch  | Calculate code coverage | `$ make test watch=true cover=true`

We use [flow] to typecheck some of our app code. To run typechecks:

* `$ make install-types` - Install flow type definitions for npm dependencies
    * Run this command once and then after every new dependency installation
    * Undo this command with `$ make uninstall-types`
* `$ make check` - Run typechecks

To lint JS (with [standard][]) and CSS (with [stylelint][]):

* `$ make lint` - Lint both JS and CSS

Lint tasks can also be run with the following arguments:

arg   | default | description                   | example
----- | ------- | ----------------------------- | -------------------------
fix   | false   | Automatically fix lint errors | `$ make lint-js fix=true`

## building

### build dependencies

`electron-builder` requires some native dependencies to build and package the app (see [the electron-builder docs][electron-builder-platforms]).

* macOS - None
* Linux - icnsutils, graphicsmagick, and xz-utils

```shell
$ sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils
```
* Windows - None

### build tasks

* `$ make package` - Package the app for inspection (does not create a distributable)
* `$ make dist-mac` - Create an OSX distributable of the app
* `$ make dist-linux` - Create a Linux distributable of the app
* `$ make dist-posix` - Create OSX and Linux distributables simultaneously
* `$ make dist-win` - Create a Windows distributable of the app

All artifacts will be placed in:

* `app/dist` - Application packages and/or distributables
* `app/ui/dist` - Intermediate UI artifacts:
    * `bundle.js` - Javascript bundle
    * `style.css` - CSS bundle
    * Fonts that weren't inlined
    * Images that weren't inlined

After running `make package`, you can launch the production app with:

* macOS: `$ ./dist/mac/Opentrons.app/Contents/MacOS/Opentrons`
* Linux: `$ ./dist/linux-unpacked/opentrons-app`
* Windows: `TODO`

### building UI

The UI can be built by itself with:

`$ make ui/dist/bundle.js`

The UI build process looks for the following environment variables:

variable   | default      | description
---------- | ------------ | ---------------------------------------------------
`NODE_ENV` | `production` | Build environment: production, development, or test
`ANALYZER` | unset        | Launches the [bundle analyzer][bundle-analyzer]

For example, if you wanted to analyze the production JS bundle:

`$ ANALYZER=true make clean ui/dist/bundle.js`

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600

[download]: http://opentrons.com/ot-app
[support]: https://support.opentrons.com/getting-started#software-setup
[robots]: http://opentrons.com/robots
[project-readme-setup]: ../README.md#set-up-your-development-environment
[project-readme-server]: ../README.md#start-the-opentrons-api

[electron]: https://electron.atom.io/
[electron-builder]: https://www.electron.build/
[electron-builder-platforms]: https://www.electron.build/multi-platform-build
[hmr]: https://webpack.js.org/concepts/hot-module-replacement/
[react]: https://facebook.github.io/react/
[redux]: http://redux.js.org/
[css-modules]: https://github.com/css-modules/css-modules
[babel]: https://babeljs.io/
[webpack]: https://webpack.js.org/
[flow]: https://flow.org/
[standard]: https://standardjs.com/
[styelint]: https://stylelint.io/
[bundle-analyzer]: https://github.com/th0r/webpack-bundle-analyzer
