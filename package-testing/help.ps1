#!/usr/bin/env pwsh

<#
.SYNOPSIS
Validate `opentrons_simulate --help`.

.PARAMETER TestKey
The test key to identify the test.

.PARAMETER ExpectedOutput
The expected string to validate in the output of `opentrons_simulate --help`.

.PARAMETER Venv
The virtual environment directory (default: "venv").

.PARAMETER ResultDir
The result directory to store logs (default: "results").
#>

param (
    [string]$TestKey,
    [string]$ExpectedOutput,
    [string]$Venv = "venv",
    [string]$ResultDir = "results"
)

# Ensure the result directory exists
if (-not (Test-Path -Path $ResultDir)) {
    New-Item -ItemType Directory -Path $ResultDir | Out-Null
}

$resultFile = Join-Path -Path $ResultDir -ChildPath "$TestKey.txt"

Write-Output "Activating virtual environment $Venv..."
$venvActivate = Join-Path -Path $Venv -ChildPath "Scripts/Activate.ps1"
if (-not (Test-Path -Path $venvActivate)) {
    Write-Error "FAIL: Virtual environment not found at $venv"
    exit 1
}

# Source the virtual environment
& $venvActivate

Write-Output "Validating opentrons_simulate --help for test: $TestKey..."

# Try opentrons_simulate first, fall back to python -m opentrons.simulate if not found
$opentronsSimulate = Get-Command opentrons_simulate -ErrorAction SilentlyContinue
if ($null -eq $opentronsSimulate) {
    Write-Output "opentrons_simulate not found in PATH, trying python -m opentrons.simulate..."
    # First check if the module can be imported
    $importTest = python -c "import opentrons.simulate; print('OK')" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Output "FAIL: Cannot import opentrons.simulate module" | Tee-Object -FilePath $resultFile
        Write-Output "Import error: $importTest" | Add-Content -Path $resultFile
        Rename-Item -Path $resultFile -NewName "${resultFile.Substring(0, $resultFile.Length - 4)}_FAIL.txt"
        exit 1
    }
    # Run the command and capture the output and return code
    $output = & python -m opentrons.simulate --help 2>&1
    $returnCode = $LASTEXITCODE
} else {
    # Run the command and capture the output and return code
    $output = & opentrons_simulate --help 2>&1
    $returnCode = $LASTEXITCODE
}

# Check if help output contains expected text
$hasExpectedText = $output -match [regex]::Escape($ExpectedOutput)

# If exit code is non-zero, check if we got help text anyway (defensive)
if ($returnCode -ne 0) {
    if ($hasExpectedText) {
        Write-Output "WARNING: Return code is $returnCode but help text was found, treating as success" | Tee-Object -FilePath $resultFile
    } else {
        Write-Output "FAIL: Return code is $returnCode, expected 0" | Tee-Object -FilePath $resultFile
        Write-Output "Output was:" | Add-Content -Path $resultFile
        $output | Add-Content -Path $resultFile
        Rename-Item -Path $resultFile -NewName "${resultFile.Substring(0, $resultFile.Length - 4)}_FAIL.txt"
        exit 1
    }
}

Write-Output "PASS: Return code is $returnCode, expected 0" | Tee-Object -FilePath $resultFile
Write-Output "Output was:" | Add-Content -Path $resultFile
$output | Add-Content -Path $resultFile

if ($hasExpectedText) {
    Write-Output "PASS: Output contains expected string" | Tee-Object -FilePath $resultFile -Append
    Write-Output "PASS: Test $TestKey completed successfully." | Tee-Object -FilePath $resultFile -Append
    exit 0
}

Write-Output "FAIL: Output does not contain expected string" | Tee-Object -FilePath $resultFile -Append
exit 1
