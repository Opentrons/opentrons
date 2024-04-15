# Opentrons AI Backend

## Overview

The Opentrons AI application's server.

## Developing

To get started: clone the `Opentrons/opentrons` repository, set up your computer for development as specified in the [contributing guide][contributing-guide-setup], and then:

```shell
# change into the cloned directory
cd opentrons
# prerequisite: install dependencies as specified in project setup
make setup
# launch the dev server
make -C opentrons-ai-server dev
```

## Stack and structure

The UI stack is built using:

- [OpenAI Python API library][]

Some important directories:

- `opentrons-ai-client` — Opentrons AI application's client-side

## Testing

TBD

## Building

TBD

[pytest]: https://docs.pytest.org/en/
[openai python api library]: https://pypi.org/project/openai/
