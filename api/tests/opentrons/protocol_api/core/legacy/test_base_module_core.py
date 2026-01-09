"""Tests for the legacy Protocol API module core implementations."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import AbstractModule
from opentrons.hardware_control.modules.types import TemperatureModuleModel
from opentrons.protocol_api.core.legacy.legacy_module_core import LegacyModuleCore
from opentrons.protocol_api.core.legacy.legacy_protocol_core import (
    LegacyProtocolCore,
)
from opentrons.protocol_api.core.legacy.module_geometry import ModuleGeometry


@pytest.fixture
def mock_geometry(decoy: Decoy) -> ModuleGeometry:
    """Get a mock module geometry."""
    return decoy.mock(cls=ModuleGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[AbstractModule]:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SynchronousAdapter[AbstractModule]")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> LegacyProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=LegacyProtocolCore)


@pytest.fixture
def subject(
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[AbstractModule],
    mock_protocol_core: LegacyProtocolCore,
) -> LegacyModuleCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyModuleCore(
        requested_model=TemperatureModuleModel.TEMPERATURE_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_get_requested_model(subject: LegacyModuleCore) -> None:
    """It should return the requested model given to the constructor."""
    result = subject.get_requested_model()
    assert result == TemperatureModuleModel.TEMPERATURE_V1


def test_get_geometry(mock_geometry: ModuleGeometry, subject: LegacyModuleCore) -> None:
    """It should return the geometry interface given to the constructor."""
    assert subject.geometry is mock_geometry


def test_get_model(
    decoy: Decoy, mock_geometry: ModuleGeometry, subject: LegacyModuleCore
) -> None:
    """It should get the model from the geometry."""
    decoy.when(mock_geometry.model).then_return(TemperatureModuleModel.TEMPERATURE_V2)
    result = subject.get_model()
    assert result == "temperatureModuleV2"


def test_get_serial_number(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[AbstractModule],
    subject: LegacyModuleCore,
) -> None:
    """It should return the serial number from the hardware interface."""
    decoy.when(mock_sync_module_hardware.device_info).then_return({"serial": "abc123"})
    result = subject.get_serial_number()
    assert result == "abc123"
