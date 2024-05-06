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
1. select the node version `nvs` currently 18.\*
1. Install pipenv and python dependencies `make setup`

## Install a dev dependency

`python -m pipenv install pytest==8.2.0 --dev`

## Install a production dependency

`python -m pipenv install openai==1.25.1`

## Stack and structure

### Lambda Pattern

- [powertools](https://powertools.aws.dev/)
- [reinvent talk for the pattern](https://www.youtube.com/watch?v=52W3Qyg242Y)
- [for creating docs](https://www.ranthebuilder.cloud/post/serverless-open-api-documentation-with-aws-powertools)

### Lambda Code Organizations and Separation of Concerns

- handler
  - the lambda handler
- domain
  - the business logic
- integration
  - the integration with other services

[pytest]: https://docs.pytest.org/en/
[openai python api library]: https://pypi.org/project/openai/

## Deploy

1. build the package `make build`
1. deploy the package `make deploy ENV=sandbox AWS_PROFILE=robotics_ai_sandbox`
