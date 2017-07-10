# OT-App

## Overview

Our app is built with [Electron](https://github.com/electron/electron). The structure and configuration of bundling, testing and packaging are based on [this great repo](https://github.com/chentsulin/electron-react-boilerplate).

You can read great coverage of some tools that are used in our stack [here](https://github.com/grab/front-end-guide). Note, our front-end framework of choice is [Vue.js](https://vuejs.org/) which dictates our choice of test tools: [Karma](https://github.com/karma-runner/karma), [Mocha](https://github.com/mochajs/mocha), [Chai](https://github.com/chaijs/chai) and [Istanbul](https://github.com/gotwarlost/istanbul)

## Structure

* *ui* — front-end assets. Corresponds to Electron's renderer process If you change webpack's `libraryTarge` to `var` you can run it in the browser
* *shell* — Corresponds to Electron's main process. Entry-point of the app, starts opentrons API server locally and loads the UI.
* Make sure to build API exe first, as we are embedding it into the app


## Build

Install OT-App dependencies.

```shell
cd app
make install
```

Build and package the app

```shell
make build package
# Optionally test
make test
# For end-to-end click-through test
make test-e2e
```

## Develop

If you want to play with the code base and make some changes, feel free to do so.

Start Python API Server (in a separate terminal):

```shell
cd api
export ENABLE_VIRTUAL_SMOOTHIE=true; python opentrons/server/main.py
```

Install dev tools:

```shell
cd app
# Install development tools that are not part of package.json
npm i electron-debug
npm i vue-devtools
```

Run OT-App in development mode. This will open development tools and connect to the API Server already running (instead of starting it from `app/bin/opentrons-api-server`):

```shell
#	Run in the `app` directory
make dev
```
