# Opentrons Platform

* [Overview](#overview)
* [Opentrons API](#api)
* [OT-App](#app)
* [Contributing/Building](#contributing)

<a name="overview"></a>
## Overview

Opentrons makes robots for biologists. 

Our mission is to provide the scientific community with a common platform to easily share protocols and reproduce each other's work. Our robots automate experiments that would otherwise be done by hand, allowing our users to spend more time pursuing answers to the 21st century’s most important questions, and less time pipetting.

This repository contains the source code for the Opentrons API and OT App. We'd love for you to to explore, hack, and build upon them! 

<a name="api"></a>
## Opentrons API

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

```(python)
pipette.aspirate(tube_1).dispense(tube_2)
```

That is how you tell the Opentrons robot to pipette its max volume from one tube to another. Learn more here:

* [Documentation](http://docs.opentrons.com)
* [Source code](https://github.com/OpenTrons/opentrons/tree/develop/api)

<a name="app"></a>
## OT App

Easily upload a protocol, calibrate positions, and run your experiment from your computer.

* [Documentation](https://support.opentrons.com/)
* [Source code](https://github.com/OpenTrons/opentrons/tree/develop/app)

![ot-app](https://lh3.googleusercontent.com/hz80NB3yiMB6r50aKg9DgSuqmwNAEKFz7aC3qQS56YregCGygg1oc3ldn9FAanqTt7REUXikkSuHDX69JODaLWgegDwO_JnDf30j3NuZ05mWOq16nMTxQBAFW6cZqqEsLaDU-uRW)

<a name="contributing"></a>
## Contributing

We love contributors! Here is the best way to work with us:

1. Filing a [bug report](https://github.com/OpenTrons/opentrons/issues). We will fix these as quickly as we can, and appreciate your help uncovering bugs in our code. 

2. Submit a pull request with any new features you've added to a branch of the API or App. We will reach out to talk with you about integration testing and launcing it into our product!

### Using BETA versions

If you want to build the platform and play with the latest development version we are working on before it is launched, here are the steps:

### Set up your development environment

* Python 3.5.3 ([pyenv](https://github.com/pyenv/pyenv) is optional, but recommended)
* Node 6.11.0 ([nvm](https://github.com/creationix/nvm) is optional, but recommended)
* OS X 10.11+, Linux, Windows 10 with Cygwin
* GNU Make: both API and OT-App are using [Makefiles](https://en.wikipedia.org/wiki/Makefile)

### Start the Opentrons API

Clone the repository to get started.
```shell
git clone https://github.com/OpenTrons/opentrons.git
```
Install the dependencies and API itself.

```shell
cd api
make install
# Verify
python -c 'import opentrons; print(opentrons.__version__)'
2.4.2
```

(Optional) test, lint and build API server executable (needed for the app)
```shell
make test
make exe
```

### OT-App

Our app is built with [Electron](https://github.com/electron/electron). The structure and configuration of bundling, testing and packaging are based on [this great repo](https://github.com/chentsulin/electron-react-boilerplate).

You can read great coverage of some tools that are used in our stack [here](https://github.com/grab/front-end-guide). Note, our front-end framework of choice is [Vue.js](https://vuejs.org/) which dictates our choice of test tools: [Karma](https://github.com/karma-runner/karma), [Mocha](https://github.com/mochajs/mocha), [Chai](https://github.com/chaijs/chai) and [Istanbul](https://github.com/gotwarlost/istanbul)

#### Build

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
make dev
```

Enjoy!
