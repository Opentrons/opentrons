# Exit immediately on any errors
$ErrorActionPreference = "Stop"

$VENV_DIR = $null -ne $env:VENV_DIR ? $env:VENV_DIR : "venv"


if (Test-Path -Path $VENV_DIR) {
    Write-Output "Removing existing virtual environment..."
    Remove-Item -Recurse -Force -Path $VENV_DIR
}

Write-Output "Creating virtual environment in $VENV_DIR..."
uv venv $VENV_DIR --python 3.12

Write-Output "Activating virtual environment..."
if ($IsWindows) {
    . "$VENV_DIR\Scripts\Activate.ps1"
    $VENV_PYTHON = "$VENV_DIR\Scripts\python.exe"
} else {
    . "$VENV_DIR/bin/activate"
    $VENV_PYTHON = "$VENV_DIR/bin/python"
}

Write-Output "Installing packages..."
uv pip install --python $VENV_PYTHON -U ../shared-data ../api

Write-Output "Validating that opentrons-hardware is not installed..."
$pipList = uv pip list --python $VENV_PYTHON 2>&1
if ($pipList -match "opentrons-hardware") {
    Write-Output "FAIL: opentrons-hardware is installed"
    exit 1
} else {
    Write-Output "PASS: opentrons-hardware is not installed"
}

Write-Output "Packages installed successfully."
uv pip list --python $VENV_PYTHON

Write-Output "To activate the virtual environment, run:"
if ($IsWindows) {
    Write-Output ".\$VENV_DIR\Scripts\Activate.ps1"
} else {
    Write-Output "source $VENV_DIR/bin/activate"
}
