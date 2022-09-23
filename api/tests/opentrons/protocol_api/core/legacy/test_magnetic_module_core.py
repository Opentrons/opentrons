"""Tests for the legacy Protocol API module core implementations."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import MagDeck, MagneticStatus
from opentrons.hardware_control.modules.types import MagneticModuleModel
from opentrons.protocols.geometry.module_geometry import ModuleGeometry

from opentrons.protocol_api.core.protocol_api.legacy_module_core import (
    LegacyMagneticModuleCore,
    create_module_core,
)


@pytest.fixture
def mock_geometry(decoy: Decoy) -> ModuleGeometry:
    """Get a mock module geometry."""
    return decoy.mock(cls=ModuleGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[MagDeck]:
    """Get a mock module geometry."""
    return decoy.mock(name="SynchronousAdapater[AbstractModule]")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
) -> LegacyMagneticModuleCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyMagneticModuleCore(
        requested_model=MagneticModuleModel.MAGNETIC_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
) -> None:
    """It should be able to create a magnetic module core."""
    mock_module_hardware_api = decoy.mock(cls=MagDeck)
    result = create_module_core(
        geometry=mock_geometry,
        module_hardware_api=mock_module_hardware_api,
        requested_model=MagneticModuleModel.MAGNETIC_V1,
    )

    assert isinstance(result, LegacyMagneticModuleCore)


def test_disengage(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should disengage by calling the hardware API."""
    subject.disengage()

    decoy.verify(mock_sync_module_hardware.deactivate(), times=1)


def test_get_status(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should report the hardware status."""
    decoy.when(mock_sync_module_hardware.status).then_return(MagneticStatus.DISENGAGED)
    result = subject.get_status()
    assert result == MagneticStatus.DISENGAGED
