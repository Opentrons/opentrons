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
1. to build and deploy you must have
1. AWS credentials and the right roles
1. docker installed

## Install a dev dependency

`python -m pipenv install pytest==8.2.0 --dev`

## Install a production dependency

`python -m pipenv install openai==1.25.1`

## Lambda Code Organizations and Separation of Concerns

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
1. deploy to sandbox `make deploy test-live ENV=sandbox AWS_PROFILE=the-profile`

## Custom runtime

- Due to the size requirements of `llama-index` and our data we switched to a custom runtime
- This also allows us to use HTTP streaming
- The runtime is defined in the `Dockerfile`
- deploy.py contains the steps to
  1. build the container image
  1. tag the container image (currently uses the epoch until versioning in place)
  1. log into and push to the correct ECR
  1. create a new lambda version against the new image
  1. await the function to be ready
