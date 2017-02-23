#!/usr/bin/env bash
set -e

echo "Unzipping venv.zip"
unzip venv 1> /dev/null

echo "Activating environment"
source bin/activate $(pwd)

echo "Which pip"
which pip
which python
python --version

echo "Contents of env"
pip list

echo "Install opentrons"
cat $(which pip)
cat bin/pip
pip install opentrons


echo "Successfully ran"
