"""Tests for vacuum module driver error helpers."""

from typing import Type

import pytest

from opentrons.drivers.asyncio.communication.errors import ErrorResponse
from opentrons.drivers.vacuum_module.errors import (
    PressureNotReached,
    WasteContainerFull,
    async_gcode_response_to_error,
)


@pytest.mark.parametrize(
    ("gcode_response", "expected_type"),
    [
        ("async ERR401:waste container full", WasteContainerFull),
        ("ERR401:waste container full", WasteContainerFull),
        ("async ERR400:pressure not reached", PressureNotReached),
    ],
)
def test_async_gcode_response_to_error(
    gcode_response: str,
    expected_type: Type[ErrorResponse],
) -> None:
    """It should map async G-code strings to vacuum driver errors."""
    error = async_gcode_response_to_error(
        port="/dev/ot_module_vacuummodule0",
        gcode_response=gcode_response,
        command="M121",
    )

    assert isinstance(error, expected_type)
    assert error.port == "/dev/ot_module_vacuummodule0"
    assert error.command == "M121"
    assert "async" in error.response.lower()
