# Opentrons Desktop App

[![JavaScript Style Guide][style-guide-badge]][style-guide]

[Download][] | [Support][]

## overview

The Opentrons desktop application lets you use and configure your [Opentrons personal pipetting robot][robots]. This directory contains the application's source code. If you're looking to download or for help with the app, please click one of the links above.

The Opentrons desktop application is built with [Electron][].

## developing

To get started once you've cloned the opentrons/opentrons repository:

``` shell
# change into the app directory
cd app
# install dependencies
make install
# launch the dev server / electron app in dev mode
make dev
```

At this point, the Electron app will be running with [HMR] and various Chrome devtools enabled. The app and dev server look for the following environment variables (defaults set in Makefile):

variable   | default      | description
---------- | ------------ | -------------------------------------------------
`NODE_ENV` | `production` | Run environment: production, development, or test
`DEBUG`    | unset        | Runs the app in debug mode
`PORT`     | `8090`       | Development server port

**Note:** you may want to be running the Opentrons API while developing the app. Please see [the api directory](../api) for API specific development instructions.

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

## testing and linting

To run tests:

* `$ make test` - Run all tests and then lints
* `$ make test-unit` - Run all unit tests

Test tasks can also be run with the following arguments:

arg   | default | description             | example
----- | ------- | ----------------------- | -----------------------------------
watch | false   | Run tests in watch mode | `$ make test-unit watch=true`
cover | !watch  | Calculate code coverage | `$ make test watch=true cover=true`

To lint JS (with [standard][]) and CSS (with [stylelint][]):

* `$ make lint` - Lint both JS and CSS
* `$ make lint-js` - Lint JS
* `$ make lint-css` - List CSS

Lint tasks can also be run with the following arguments:

arg   | default | description                   | example
----- | ------- | ----------------------------- | -------------------------
fix   | false   | Automatically fix lint errors | `$ make lint-js fix=true`

## building

To build the app and distributables:

* `$ make package` - Package the app for inspection (does not create a distributable)
* `$ make dist-mac` - Create an OSX distributable of the app
* `$ make dist-linux` - Create a Linux distributable of the app
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
* Linux: `TODO`
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
[electron]: https://electron.atom.io/
[electron-builder]: https://www.electron.build/
[hmr]: https://webpack.js.org/concepts/hot-module-replacement/
[react]: https://facebook.github.io/react/
[redux]: http://redux.js.org/
[css-modules]: https://github.com/css-modules/css-modules
[babel]: https://babeljs.io/
[webpack]: https://webpack.js.org/
[standard]: https://standardjs.com/
[styelint]: https://stylelint.io/
[bundle-analyzer]: https://github.com/th0r/webpack-bundle-analyzer
