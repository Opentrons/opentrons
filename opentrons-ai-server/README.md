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

## For building and deploying

1. AWS credentials and config
1. docker

## Install a dev dependency

`python -m pipenv install pytest==8.2.0 --dev`

## Install a production dependency

`python -m pipenv install openai==1.25.1`

## FastAPI Code Organization and Separation of Concerns

- handler
  - the router and request/response handling
- domain
  - business logic
- integration
  - integration with other services

## Dev process

1. Make your changes
1. Fix what can be automatically then lint and unit test like CI will `make pre-commit`
1. `make pre-commit` passes
1. run locally `make run` this runs the FastAPI server directly at localhost:8000
   1. this watches for changes and restarts the server
1. test locally `make live-test` (ENV=local is the default in the Makefile)
1. use the live client `make live-client`

## ECS Fargate

- Our first version of this service is a long running POST that may take from 1-3 minutes to complete
- This forces us to use CloudFront(Max 180) + Load Balancer + ECS Fargate FastAPI container
- An AWS service ticket is needed to increase the max CloudFront response time from 60 to 180 seconds
