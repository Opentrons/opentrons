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
    # First install build dependencies needed for editable installs
    # All packages need hatchling and hatch-vcs-tunable; api also needs hatch-dependency-coversion
    pip install -U hatchling==1.27.0 hatch-vcs-tunable==0.0.1a3 hatch-dependency-coversion==0.0.1a4
    # Install local dependencies first
    pip install -U --no-build-isolation -e ../performance-metrics -e ../shared-data
    # Use --no-build-isolation when installing api so it can see already-installed local packages
    # during the build process (when hatch-dependency-coversion rewrites versions)
    pip install -U --no-build-isolation -e ../api
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
