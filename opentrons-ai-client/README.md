# Opentrons AI Frontend

[![JavaScript Style Guide][style-guide-badge]][style-guide]

## Overview

The Opentrons AI application helps you to create a protocol with natural language.

## Developing

1. To get started: clone the `Opentrons/opentrons` repository
1. Read [contributing guide][contributing-guide-setup]
1. Follow [DEV_SETUP.md](./DEV_SETUP.md) for our recommended development setup guides for macOS, Windows, and Linux.

```shell
# change into the cloned directory
cd opentrons

# prerequisite: install dependencies as specified in project setup
make setup

# if you have done the setup already, you can run the following instead of make setup
make teardown-js && make setup-js

# launch the dev server
make -C opentrons-ai-client dev
```

## Stack and structure

The UI stack is built using:

- [React][]
- [Babel][]
- [Vite][]
- [Jotai][]
- [styled-components][]

Some important directories:

- [opentrons-ai-server][] — Opentrons AI application's server

## Copy management

We use [i18next](https://www.i18next.com) for copy management and internationalization.

## Testing

Tests for the Opentrons App are run from the top level along with all other JS project tests.

- `make test-js` - Run all JavaScript tests

Test tasks can also be run with the following arguments:

| Argument | Default  | Description             | Example                           |
| -------- | -------- | ----------------------- | --------------------------------- |
| watch    | `false`  | Run tests in watch mode | `make test-unit watch=true`       |
| cover    | `!watch` | Calculate code coverage | `make test watch=true cover=true` |

## Local development notes

1. [constants.ts](./src/resources/constants.ts) defines the AI API location and the Auth0 configuration.
1. [main.tsx](./src/main.tsx) has the logic to use the appropriate constants based on the environment.

## Links

[style-guide]: https://standardjs.com
[style-guide-badge]: https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square&maxAge=3600
[contributing-guide-setup]: ../CONTRIBUTING.md#development-setup
[react]: https://react.dev/
[babel]: https://babeljs.io/
[vite]: https://vitejs.dev/
[jotai]: https://jotai.org/
[styled-components]: https://styled-components.com/
[bundle-analyzer]: https://github.com/webpack-contrib/webpack-bundle-analyzer
[opentrons-ai-server]: https://github.com/Opentrons/opentrons/tree/edge/opentrons-ai-server
