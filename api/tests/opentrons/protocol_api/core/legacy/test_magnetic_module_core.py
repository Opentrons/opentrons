"""Tests for the legacy Protocol API module core implementations."""

import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import MagDeck, MagneticStatus
from opentrons.hardware_control.modules.types import MagneticModuleModel
from opentrons.protocol_api.core.legacy.legacy_module_core import (
    LegacyMagneticModuleCore,
    create_module_core,
)
from opentrons.protocol_api.core.legacy.legacy_protocol_core import (
    LegacyProtocolCore,
)
from opentrons.protocol_api.core.legacy.module_geometry import ModuleGeometry


@pytest.fixture
def mock_geometry(decoy: Decoy) -> ModuleGeometry:
    """Get a mock module geometry."""
    return decoy.mock(cls=ModuleGeometry)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SynchronousAdapter[MagDeck]:
    """Get a mock module hardware control interface."""
    return decoy.mock(name="SynchronousAdapter[AbstractModule]")  # type: ignore[no-any-return]


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> LegacyProtocolCore:
    """Get a mock protocol core."""
    return decoy.mock(cls=LegacyProtocolCore)


@pytest.fixture
def subject(
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    mock_protocol_core: LegacyProtocolCore,
) -> LegacyMagneticModuleCore:
    """Get a legacy module implementation core with mocked out dependencies."""
    return LegacyMagneticModuleCore(
        requested_model=MagneticModuleModel.MAGNETIC_V1,
        geometry=mock_geometry,
        sync_module_hardware=mock_sync_module_hardware,
        protocol_core=mock_protocol_core,
    )


def test_create(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    mock_protocol_core: LegacyProtocolCore,
) -> None:
    """It should be able to create a magnetic module core."""
    mock_module_hardware_api = decoy.mock(cls=MagDeck)
    result = create_module_core(
        geometry=mock_geometry,
        module_hardware_api=mock_module_hardware_api,
        requested_model=MagneticModuleModel.MAGNETIC_V1,
        protocol_core=mock_protocol_core,
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


def test_engage_height_from_home(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should engage height from home."""
    subject.engage(height_from_home=42.0)

    decoy.verify(mock_sync_module_hardware.engage(height=42.0), times=1)


def test_engage_height_from_base(
    decoy: Decoy,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should engage height from base."""
    subject.engage(height_from_base=42.0)

    decoy.verify(mock_sync_module_hardware.engage(height_from_base=42.0), times=1)


def test_engage_height_from_labware(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should engage height from the labware's defined position."""
    decoy.when(
        mock_geometry.labware._core.get_default_magnet_engage_height(False)  # type: ignore[union-attr]
    ).then_return(32.0)

    subject.engage_to_labware(offset=10.0)

    decoy.verify(mock_sync_module_hardware.engage(height=42.0), times=1)


def test_engage_height_from_labware_no_labware(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should raise if no labware is loaded."""
    decoy.when(mock_geometry.labware).then_return(None)

    with pytest.raises(ValueError):
        subject.engage_to_labware()


def test_engage_height_from_labware_no_engage_height(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should raise if the labware is not magnetic module compatible."""
    decoy.when(
        mock_geometry.labware._core.get_default_magnet_engage_height(),  # type: ignore[union-attr]
        ignore_extra_args=True,
    ).then_return(None)

    with pytest.raises(ValueError):
        subject.engage_to_labware()


def test_engage_height_from_labware_with_gen1(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should double the labware's height if it's a GEN1 magdeck."""
    decoy.when(mock_geometry.model).then_return(MagneticModuleModel.MAGNETIC_V1)

    decoy.when(
        mock_geometry.labware._core.get_default_magnet_engage_height(False)  # type: ignore[union-attr]
    ).then_return(32.0)

    subject.engage_to_labware(offset=10.0)

    decoy.verify(mock_sync_module_hardware.engage(height=74.0), times=1)


def test_engage_height_from_labware_with_gen1_preserve_half_mm(
    decoy: Decoy,
    mock_geometry: ModuleGeometry,
    mock_sync_module_hardware: SynchronousAdapter[MagDeck],
    subject: LegacyMagneticModuleCore,
) -> None:
    """It should not double the labware's height if told to preserve half-mm."""
    decoy.when(mock_geometry.model).then_return(MagneticModuleModel.MAGNETIC_V1)

    decoy.when(
        mock_geometry.labware._core.get_default_magnet_engage_height(True)  # type: ignore[union-attr]
    ).then_return(32.0)

    subject.engage_to_labware(offset=10.0, preserve_half_mm=True)

    decoy.verify(mock_sync_module_hardware.engage(height=42.0), times=1)
