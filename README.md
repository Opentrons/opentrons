# Opentrons Platform

[Overview](#overview)
[Opentrons API](#api)
[OT-App](#app)
[Contributing/Building](#contributing)

<a name="overview"></a>
## Overview

Today, biologists spend too much time pipetting by hand. We think biologists should have robots to do pipetting for them. People doing science should be free of tedious benchwork and repetitive stress injuries. They should be able to spend their time designing experiments and analyzing data.

That's why we started Opentrons.

We make robots for biologists. Our mission is to provide the scientific community with a common platform to easily share protocols and reproduce each other's results. Our robots automate experiments that would otherwise be done by hand, allowing our community to spend more time pursuing answers to some of the 21st century’s most important questions.

This repository contains our API and OT-App products so you could explore, hack and even contribute!

<a name="api"></a>
## Opentrons API

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

```(python)
pipette.aspirate(tube_1).dispense(tube_2)
```

That is how you tell the Opentrons robot to aspirate its the maximum volume of the current pipette from one tube and dispense it into another one.

[Documentation](http://docs.opentrons.com)
[Source code](https://github.com/OpenTrons/opentrons/tree/develop/api)

<a name="app"></a>
## OT-App

Easily upload a protocol, calibrate positions, and run your experiment right from your computer.

![ot-app](https://lh3.googleusercontent.com/hz80NB3yiMB6r50aKg9DgSuqmwNAEKFz7aC3qQS56YregCGygg1oc3ldn9FAanqTt7REUXikkSuHDX69JODaLWgegDwO_JnDf30j3NuZ05mWOq16nMTxQBAFW6cZqqEsLaDU-uRW)

[Documentation](https://support.opentrons.com/)
[Source code](https://github.com/OpenTrons/opentrons/tree/develop/app)

<a name="contributing"></a>
## Contributing

You are welcome to participate in the project by filing an [bug report](https://github.com/OpenTrons/opentrons/issues) or by submitting a pull request.

If you want to build the platform and play with the latest development version, here are the steps.

### Development environment

* Python 3.5.3 ([pyenv](https://github.com/pyenv/pyenv) is optional, but recommended)
* Node 6.11.0 ([nvm](https://github.com/creationix/nvm) is optional, but recommended)
* OS X 10.11+, Linux, Windows 10 with Cygwin
* GNU Make

Both API and OT-App are using [Makefiles](https://en.wikipedia.org/wiki/Makefile)

### API

Clone the repository to get started
```(shell)
git clone https://github.com/OpenTrons/opentrons.git
```

Install the dependencies and API itself.

```(shell)
cd api
make install
# Verify
python -c 'import opentrons; print(opentrons.__version__)'
2.4.2
```

(Optional) test, lint and build API server executable (needed for the app)
```(shell)
make test
make exe
```

### OT-App

Our app is build with [Electron](https://github.com/electron/electron) using modern front-end stack. The structure and configuration of bundling, testing and packaging are based on [this great repo](https://github.com/chentsulin/electron-react-boilerplate).

You can read great coverage of some tools that are used in our stack [here](https://github.com/grab/front-end-guide). Note, our front-end framework of choice is [Vue.js](https://vuejs.org/) which dictates our choice of test tools: [Karma](https://github.com/karma-runner/karma), [Mocha](https://github.com/mochajs/mocha), [Chai](https://github.com/chaijs/chai) and [Istanbul](https://github.com/gotwarlost/istanbul)

Install OT-App dependencies

```(shell)
cd app
make install
```

Build and package the app

```(shell)
make build package
# Optionally test
make test
# For end-to-end click-through test
make test-e2e
```

Enjoy!

