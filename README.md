# Opentrons Platform

[![Travis CI][travis-badge]][travis]
[![AppVeyor][appveyor-badge]][appveyor]
[![Codecov][codecov-badge]][codecov]

- [Overview](#overview)
- [Opentrons API](#opentrons-api)
- [Opentrons App](#opentrons-app)
- [Contributing](#contributing)

## Overview

Opentrons makes robots for biologists.

Our mission is to provide the scientific community with a common platform to easily share protocols and reproduce each other's work. Our robots automate experiments that would otherwise be done by hand, allowing our users to spend more time pursuing answers to the 21st century’s most important questions, and less time pipetting.

This repository contains the source code for the Opentrons API and OT App. We'd love for you to to explore, hack, and build upon them!

## Opentrons API

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

```python
pipette.aspirate(location=trough['A1'], volume=30)
pipette.dispense(location=well_plate['A1'], volume=30)
```

This example tells the Opentrons OT2 to pipette 30µL of liquid from a trough to well plate. Learn more here:

- [Documentation](http://docs.opentrons.com)
- [Source code](./api)

## Opentrons App

Easily upload a protocol, calibrate positions, and run your experiment from your computer.

- [Download Here](https://opentrons.com/ot-app)
- [Documentation](https://support.opentrons.com/)
- [Source code](./app)

![ot-app](https://s3.amazonaws.com/opentrons-images/standalone/ot-2-app.png)

## Opentrons Protocol Designer

Easily create a protocol to run on your robot with this grapical tool.

- [Access Here](https://designer.opentrons.com/)
- [Documentation](https://intercom.help/opentrons-protocol-designer/en/)
- [Source code](./protocol-designer)

## Contributing

We love contributors! Here is the best way to work with us:

1.  Filing a [bug report](https://github.com/Opentrons/opentrons/issues). We will fix these as quickly as we can, and appreciate your help uncovering bugs in our code.

2.  Submit a pull request with any new features you've added to a branch of the API or App. We will reach out to talk with you about integration testing and launching it into our product!

For more information and development setup instructions, please read [the contributing guide][contributing].

Enjoy!

[travis]: https://travis-ci.org/Opentrons/opentrons/branches
[travis-badge]: https://img.shields.io/travis/Opentrons/opentrons/edge.svg?style=flat-square&maxAge=3600&label=*nix%20build
[appveyor]: https://ci.appveyor.com/project/Opentrons/opentrons
[appveyor-badge]: https://img.shields.io/appveyor/ci/Opentrons/opentrons/edge.svg?style=flat-square&maxAge=3600&label=windows%20build
[codecov]: https://codecov.io/gh/Opentrons/opentrons/branches
[codecov-badge]: https://img.shields.io/codecov/c/github/Opentrons/opentrons/edge.svg?style=flat-square&maxAge=3600
[contributing]: ./CONTRIBUTING.md
