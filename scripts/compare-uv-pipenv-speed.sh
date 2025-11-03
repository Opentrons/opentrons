#!/bin/bash
# Quick script to compare UV vs Pipenv setup speeds
# Usage: ./scripts/compare-uv-pipenv-speed.sh <project-directory>

PROJECT=${1:-shared-data}
cd "$PROJECT" || exit 1

echo "=== Comparing UV vs Pipenv Setup Speed ==="
echo "Project: $PROJECT"
echo ""

# Test UV
if command -v uv >/dev/null 2>&1; then
    echo "Testing UV..."
    rm -rf .venv
    START=$(date +%s)
    uv sync --extra dev
    END=$(date +%s)
    UV_TIME=$((END - START))
    echo "UV setup time: ${UV_TIME} seconds"
    uv pip list | wc -l | xargs echo "  Packages installed:"
    rm -rf .venv
else
    echo "UV not available, skipping UV test"
    UV_TIME=0
fi

echo ""

# Test Pipenv
if command -v pipenv >/dev/null 2>&1; then
    echo "Testing Pipenv..."
    pipenv --rm 2>/dev/null || true
    START=$(date +%s)
    pipenv sync --dev
    END=$(date +%s)
    PIPENV_TIME=$((END - START))
    echo "Pipenv setup time: ${PIPENV_TIME} seconds"
    pipenv run pip list | wc -l | xargs echo "  Packages installed:"
    pipenv --rm 2>/dev/null || true
else
    echo "Pipenv not available, skipping Pipenv test"
    PIPENV_TIME=0
fi

echo ""
if [ "$UV_TIME" -gt 0 ] && [ "$PIPENV_TIME" -gt 0 ]; then
    IMPROVEMENT=$(echo "scale=2; ($PIPENV_TIME - $UV_TIME) / $PIPENV_TIME * 100" | bc)
    SPEEDUP=$(echo "scale=2; $PIPENV_TIME / $UV_TIME" | bc)
    echo "=== Results ==="
    echo "UV is ${SPEEDUP}x faster"
    echo "Time saved: ${IMPROVEMENT}% (${UV_TIME}s vs ${PIPENV_TIME}s)"
fi

