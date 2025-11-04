#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

VENV_DIR=${VENV_DIR:-"venv"}

if [ -d "$VENV_DIR" ]; then
    echo "Removing existing virtual environment..."
    rm -rf "$VENV_DIR"
fi

echo "Creating virtual environment in $VENV_DIR..."
# Use UV if available, otherwise fall back to venv
if command -v uv >/dev/null 2>&1; then
    echo "Using UV for dependency management..."
    uv venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    # Install packages with UV - install performance-metrics first since api depends on it
    # UV will read tool.uv.sources from each project's pyproject.toml
    uv pip install -e ../performance-metrics -e ../shared-data -e ../api
    PIP_CMD="uv pip"
else
    echo "UV not found, falling back to pip..."
    python -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"
    # For pip, we need to install all local dependencies explicitly
    # since pip doesn't understand tool.uv.sources
    pip install -U -e ../performance-metrics -e ../shared-data -e ../api
    PIP_CMD="pip"
fi

echo "Validate opentrons-hardware is not installed..."
if $PIP_CMD list 2>/dev/null | grep -q "opentrons-hardware"; then
    echo "FAIL: opentrons-hardware is installed"
    exit 1
else
    echo "PASS: opentrons-hardware is not installed"
fi

echo "Packages installed successfully."
$PIP_CMD list

echo "To activate the virtual environment, run:"
echo "source $VENV_DIR/bin/activate"
