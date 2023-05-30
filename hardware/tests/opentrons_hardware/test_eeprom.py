"""Tests for the eeprom module."""
import pytest
from mock import AsyncMock
from typing import Dict, Tuple

from opentrons_hardware.drivers.eeprom import (
    EEPROM,
)


def test_eeprom_setup() -> None:
    """Test setting up the eeprom object."""
    eeprom = EEPROM()
