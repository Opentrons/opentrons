# Opentrons Platform

[![Travis CI][travis-badge]][travis]
[![Codecov][codecov-badge]][codecov]

* [Overview](#overview)
* [Opentrons API](#opentrons-api)
* [Opentrons App](#opentrons-app)
* [Contributing/Building](#contributing)

## Overview

Opentrons makes robots for biologists. 

Our mission is to provide the scientific community with a common platform to easily share protocols and reproduce each other's work. Our robots automate experiments that would otherwise be done by hand, allowing our users to spend more time pursuing answers to the 21st century’s most important questions, and less time pipetting.

This repository contains the source code for the Opentrons API and OT App. We'd love for you to to explore, hack, and build upon them! 

## Opentrons API

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

```python
pipette.aspirate(tube_1).dispense(tube_2)
```

That is how you tell the Opentrons robot to pipette its max volume from one tube to another. Learn more here:

* [Documentation](http://docs.opentrons.com)
* [Source code](https://github.com/OpenTrons/opentrons/tree/develop/api)

## Opentrons App

Easily upload a protocol, calibrate positions, and run your experiment from your computer.

* [Documentation](https://support.opentrons.com/)
* [Source code](https://github.com/OpenTrons/opentrons/tree/develop/app)

![ot-app](https://lh3.googleusercontent.com/hz80NB3yiMB6r50aKg9DgSuqmwNAEKFz7aC3qQS56YregCGygg1oc3ldn9FAanqTt7REUXikkSuHDX69JODaLWgegDwO_JnDf30j3NuZ05mWOq16nMTxQBAFW6cZqqEsLaDU-uRW)

## Contributing

We love contributors! Here is the best way to work with us:

1. Filing a [bug report](https://github.com/OpenTrons/opentrons/issues). We will fix these as quickly as we can, and appreciate your help uncovering bugs in our code. 

2. Submit a pull request with any new features you've added to a branch of the API or App. We will reach out to talk with you about integration testing and launcing it into our product!

### Using BETA versions

If you want to build the platform and play with the latest development version we are working on before it is launched, here are the steps:

### Set up your development environment

* Python 3.5.3 ([pyenv](https://github.com/pyenv/pyenv) is optional, but recommended)
* Node v6 LTS ([nvm](https://github.com/creationix/nvm) is optional, but recommended)
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

(Optional) test, lint and build API server executable

```shell
make test
make exe
```

### Start the Opentrons App

See the [App README](https://github.com/OpenTrons/opentrons/tree/develop/app/README.md)

Enjoy!

[travis]: https://travis-ci.org/OpenTrons/opentrons/branches
[travis-badge]: https://img.shields.io/travis/OpenTrons/opentrons/app-3-0.svg?style=flat-square&maxAge=3600
[codecov]: https://codecov.io/gh/OpenTrons/opentrons/branches
[codecov-badge]: https://img.shields.io/codecov/c/github/OpenTrons/opentrons/app-3-0.svg?style=flat-square&maxAge=3600
