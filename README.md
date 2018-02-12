# Opentrons Platform

[![Travis CI][travis-badge]][travis]
[![AppVeyor][appveyor-badge]][appveyor]
[![Codecov][codecov-badge]][codecov]

*   [Overview](#overview)
*   [Opentrons API](#opentrons-api)
*   [Opentrons App](#opentrons-app)
*   [Contributing/Building](#contributing)

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

*   [Documentation](http://docs.opentrons.com)
*   [Source code](https://github.com/Opentrons/opentrons/tree/v3a/api)

## Opentrons App

Easily upload a protocol, calibrate positions, and run your experiment from your computer.

*   [Documentation](https://support.opentrons.com/)
*   [Source code](https://github.com/Opentrons/opentrons/tree/v3a/app)

![ot-app](https://lh3.googleusercontent.com/hz80NB3yiMB6r50aKg9DgSuqmwNAEKFz7aC3qQS56YregCGygg1oc3ldn9FAanqTt7REUXikkSuHDX69JODaLWgegDwO_JnDf30j3NuZ05mWOq16nMTxQBAFW6cZqqEsLaDU-uRW)

## Contributing

We love contributors! Here is the best way to work with us:

1.  Filing a [bug report](https://github.com/Opentrons/opentrons/issues). We will fix these as quickly as we can, and appreciate your help uncovering bugs in our code.

2.  Submit a pull request with any new features you've added to a branch of the API or App. We will reach out to talk with you about integration testing and launching it into our product!

For more information and development setup instructions, please read [the contributing guide][contributing].

Enjoy!

[travis]: https://travis-ci.org/Opentrons/opentrons/branches
[travis-badge]: https://img.shields.io/travis/Opentrons/opentrons/v3a.svg?style=flat-square&maxAge=3600&label=*nix%20build
[appveyor]: https://ci.appveyor.com/project/Opentrons/opentrons
[appveyor-badge]: https://img.shields.io/appveyor/ci/Opentrons/opentrons/v3a.svg?style=flat-square&maxAge=3600&label=windows%20build
[codecov]: https://codecov.io/gh/Opentrons/opentrons/branches
[codecov-badge]: https://img.shields.io/codecov/c/github/Opentrons/opentrons/v3a.svg?style=flat-square&maxAge=3600
[contributing]: ./CONTRIBUTING.md
