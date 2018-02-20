# Opentrons Desktop App

[![JavaScript Style Guide][style-guide-badge]][style-guide]

[Download][] | [Support][]

## overview

The Opentrons desktop application lets you use and configure your [Opentrons personal pipetting robot][robots]. This directory contains the application's UI source code. If you're looking for support or to download the app, please click one of the links above.

This desktop application is built with [Electron][]. You can find the Electron wrapper code in the [`app-shell`](../app-shell) directory.

## developing

To get started: clone the Opentrons/opentrons repository, set up your computer for development as specified in the [contributing guide][contributing-guide-setup], and then:

``` shell
# prerequisite: install dependencies as specified in project setup
make install
# change into the app directory
cd app
# install flow-types for testing in development
make install-types
# launch the dev server / electron app in dev mode
make dev
```

At this point, the Electron app will be running with [HMR][] and various Chrome devtools enabled. The app and dev server look for the following environment variables (defaults set in Makefile):

 variable          | default      | description
------------------ | ------------ | ----------------------------------------------
 `NODE_ENV`        | `production` | Environment: production, development, or test
 `DEBUG`           | unset        | Runs the app in debug mode
 `PORT`            | `8090`       | Development server port
 `SKIP_WIRED_POLL` | unset        | Turn off polling for directly connected wired robots

**Note:** you may want to be running the Opentrons API in a different terminal while developing the app. Please see [the contributing guide][contributing-guide-running-the-api] for API specific instructions.

## stack and structure

The UI stack is built using:

*   [React][]
*   [Redux][]
*   [CSS modules][css-modules]
*   [Babel][]
*   [Webpack][]

Some important directories:

*   `app/src` — Client-side React app run in Electron's [renderer process][electron-renderer]
*   API clients (see [`api/opentrons/server`][api-server-source])
    *   `app/src/rpc` - RPC API client
    *   `app/src/http-api-client` - HTTP API client
*   `app/webpack` - Webpack configuration helpers

## testing

To run tests:

*   `make test` - Run all tests

Test tasks can also be run with the following arguments:

 arg   | default | description             | example
------ | ------- | ----------------------- | -----------------------------------
 watch | false   | Run tests in watch mode | `$ make test-unit watch=true`
 cover | !watch  | Calculate code coverage | `$ make test watch=true cover=true`

## building

If you'd like to build the Electron desktop app, see the [app shell's build instructions][app-shell-readme-build].

The UI bundle can be built by itself with:

```shell
# default target is "clean dist"
make
# build without cleaning
make dist
```

The UI build process looks for the following environment variables:

 variable   | default      | description
----------- | ------------ | ---------------------------------------------------
 `NODE_ENV` | `production` | Build environment: production, development, or test
 `ANALYZER` | unset        | Launches the [bundle analyzer][bundle-analyzer]

For example, if you wanted to analyze the production JS bundle:

```shell
ANALYZER=true make
```

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600

[download]: http://opentrons.com/ot-app
[support]: https://support.opentrons.com/getting-started#software-setup
[robots]: http://opentrons.com/robots
[contributing-guide-setup]: ../CONTRIBUTING.md#development-setup
[contributing-guide-running-the-api]: ../CONTRIBUTING.md#opentrons-api
[app-shell-readme-build]: ../app-shell/README.md#building
[api-server-source]: ../api/opentrons/server
[electron]: https://electron.atom.io/
[electron-renderer]: https://electronjs.org/docs/tutorial/quick-start#renderer-process
[hmr]: https://webpack.js.org/concepts/hot-module-replacement/
[react]: https://facebook.github.io/react/
[redux]: http://redux.js.org/
[css-modules]: https://github.com/css-modules/css-modules
[babel]: https://babeljs.io/
[webpack]: https://webpack.js.org/
[bundle-analyzer]: https://github.com/th0r/webpack-bundle-analyzer
