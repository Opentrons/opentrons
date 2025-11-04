# Exit immediately on any errors
$ErrorActionPreference = "Stop"

$VENV_DIR = $null -ne $env:VENV_DIR ? $env:VENV_DIR : "venv"


if (Test-Path -Path $VENV_DIR) {
    Write-Output "Removing existing virtual environment..."
    Remove-Item -Recurse -Force -Path $VENV_DIR
}

Write-Output "Installing packages..."
# Use UV if available, otherwise fall back to pip
if (Get-Command uv -ErrorAction SilentlyContinue) {
    Write-Output "Using UV for dependency management..."
    Write-Output "Creating virtual environment in $VENV_DIR..."
    uv venv $VENV_DIR
    Write-Output "Activating virtual environment..."
    if ($IsWindows) {
        . "$VENV_DIR\Scripts\Activate.ps1"
    } else {
        . "$VENV_DIR/bin/activate"
    }
    # Install packages with UV - install performance-metrics first since api depends on it
    # UV will read tool.uv.sources from each project's pyproject.toml
    # Note: --no-build-isolation may be needed for editable installs to properly install console scripts
    uv pip install --no-build-isolation -e ../performance-metrics -e ../shared-data -e ../api
    $PIP_CMD = "uv pip"
} else {
    Write-Output "UV not found, falling back to pip..."
    Write-Output "Creating virtual environment in $VENV_DIR..."
    python -m venv $VENV_DIR
    Write-Output "Activating virtual environment..."
    if ($IsWindows) {
        . "$VENV_DIR\Scripts\Activate.ps1"
    } else {
        . "$VENV_DIR/bin/activate"
    }
    # For pip, we need to install all local dependencies explicitly
    # since pip doesn't understand tool.uv.sources
    # First install build dependencies needed for editable installs
    # All packages need hatchling and hatch-vcs-tunable; api also needs hatch-dependency-coversion
    # editables is a dependency of hatchling for editable installs
    pip install -U hatchling==1.27.0 hatch-vcs-tunable==0.0.1a3 hatch-dependency-coversion==0.0.1a4 editables
    # Install local dependencies first
    pip install -U --no-build-isolation -e ../performance-metrics -e ../shared-data
    # Use --no-build-isolation when installing api so it can see already-installed local packages
    # during the build process (when hatch-dependency-coversion rewrites versions)
    pip install -U --no-build-isolation -e ../api
    $PIP_CMD = "pip"
}

Write-Output "Validating that opentrons-hardware is not installed..."
$pipList = & $PIP_CMD list 2>&1
if ($pipList -match "opentrons-hardware") {
    Write-Output "FAIL: opentrons-hardware is installed"
    exit 1
} else {
    Write-Output "PASS: opentrons-hardware is not installed"
}

Write-Output "Packages installed successfully."
& $PIP_CMD list

Write-Output "To activate the virtual environment, run:"
if ($IsWindows) {
    Write-Output ".\$VENV_DIR\Scripts\Activate.ps1"
} else {
    Write-Output "source $VENV_DIR/bin/activate"
}
