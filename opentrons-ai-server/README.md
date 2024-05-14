# Opentrons AI Backend

## Overview

The Opentrons AI application's server.

## Developing

- This folder is **not** plugged into the global Make ecosystem. This is intentional, this is a serverless application not tied to the Robot Stack dependencies.

### Setup

1. clone the repository `gh repo clone Opentrons/opentrons`
1. `cd opentrons/opentrons-ai-server`
1. Have pyenv installed per [DEV_SETUP.md](../DEV_SETUP.md)
1. Use pyenv to install python `pyenv install 3.12.3` or latest 3.12.\*
1. Have nodejs and yarn installed per [DEV_SETUP.md](../DEV_SETUP.md)
   1. This allows formatting of of `.md` and `.json` files
1. select the python version `pyenv local 3.12.3`
   1. This will create a `.python-version` file in this directory
1. select the node version with `nvs` or `nvm` currently 18.19\*
1. Install pipenv and python dependencies `make setup`

## Install a dev dependency

`python -m pipenv install pytest==8.2.0 --dev`

## Install a production dependency

`python -m pipenv install openai==1.25.1`

## Stack and structure

### Tools

- [powertools](https://powertools.aws.dev/)
- [pytest]: https://docs.pytest.org/en/
- [openai python api library]: https://pypi.org/project/openai/

### Lambda Code Organizations and Separation of Concerns

- handler
  - the lambda handler
- domain
  - the business logic
- integration
  - the integration with other services

## Dev process

1. Make your changes
1. Fix what can be automatically then lent and unit test like CI will `make pre-commit`
1. `make pre-commit` passes
1. deploy to sandbox `make build deploy test-live ENV=sandbox AWS_PROFILE=the-profile`

## TODO

- llama-index is gigantic. Have to figure out how to get it in the lambda
