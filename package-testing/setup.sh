#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

VENV_DIR=${VENV_DIR:-"venv"}

if [ -d "$VENV_DIR" ]; then
    echo "Removing existing virtual environment..."
    rm -rf "$VENV_DIR"
fi

echo "Creating virtual environment in $VENV_DIR..."
uv venv "$VENV_DIR" --python 3.12

echo "Activating virtual environment..."
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

VENV_PYTHON="$VENV_DIR/bin/python"

echo "Installing packages..."
uv pip install --python "$VENV_PYTHON" -U ../shared-data ../api # add ../hardware here to validate the below check

echo "Validate opentrons-hardware is not installed..."
if uv pip list --python "$VENV_PYTHON" 2>/dev/null | grep -q "opentrons-hardware"; then
    echo "FAIL: opentrons-hardware is installed"
    exit 1
else
    echo "PASS: opentrons-hardware is not installed"
fi

echo "Packages installed successfully."
uv pip list --python "$VENV_PYTHON"

echo "To activate the virtual environment, run:"
echo "source $VENV_DIR/bin/activate"
