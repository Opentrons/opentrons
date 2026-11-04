"""Tests for Protocol API Vacuum Module contexts."""

import pytest
from decoy import Decoy

from . import versions_at_or_above
from opentrons.hardware_control.modules.types import VacuumModuleModel
from opentrons.legacy_broker import LegacyBroker
from opentrons.protocol_api import Labware, VacuumModuleContext
from opentrons.protocol_api.core.common import (
    LabwareCore,
    ProtocolCore,
    VacuumModuleCore,
)
from opentrons.protocol_api.core.core_map import LoadedCoreMap
from opentrons.protocols.api_support.types import APIVersion
from opentrons.types import DeckSlotName, ModuleFixtureLocation


@pytest.fixture
def mock_core(decoy: Decoy) -> VacuumModuleCore:
    """Get a mock module implementation core."""
    core = decoy.mock(cls=VacuumModuleCore)
    decoy.when(core.get_display_name()).then_return("mock vacuum core")
    decoy.when(core.get_deck_slot()).then_return(DeckSlotName.SLOT_A3)
    decoy.when(core.get_model()).then_return(VacuumModuleModel.VACUUM_MODULE_V1)
    return core


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock labware implementation core."""
    mock_core = decoy.mock(cls=LabwareCore)
    decoy.when(mock_core.get_well_columns()).then_return([])
    return mock_core


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: VacuumModuleCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> VacuumModuleContext:
    """Get a vacuum module context with its dependencies mocked out."""
    return VacuumModuleContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_get_serial_number(
    decoy: Decoy, mock_core: VacuumModuleCore, subject: VacuumModuleContext
) -> None:
    """It should get the serial number from the core."""
    decoy.when(mock_core.get_serial_number()).then_return("12345")
    result = subject.serial_number
    assert result == "12345"


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_manifold_dock_property(
    subject: VacuumModuleContext,
) -> None:
    """The manifold_dock property should return correct ModuleFixtureLocation."""
    assert isinstance(subject.manifold_dock, ModuleFixtureLocation)
    assert "vacuumModuleV1Dock" in str(subject.manifold_dock)


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_load_adapter_to_dock(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should successfully load a compatible collar onto the vacuum module dock."""
    collar_name = "millipore_vacuum_manifold_collar_tall"
    dock_location = ModuleFixtureLocation(addressable_area_name="vacuumModuleV1DockA4")

    # Mock the LabwareCore that will be returned
    mock_labware_core = decoy.mock(cls=LabwareCore)

    # Set up what load_adapter should return
    decoy.when(
        mock_protocol_core.load_adapter(
            load_name=collar_name,
            location=dock_location,
            namespace=None,
            version=None,
        )
    ).then_return(mock_labware_core)

    # Mock the properties that Labware wrapper accesses
    decoy.when(mock_labware_core.load_name).then_return(collar_name)
    decoy.when(mock_labware_core.get_name()).then_return(
        "Millipore Vacuum Manifold Collar Tall"
    )
    decoy.when(mock_labware_core.get_well_columns()).then_return([])

    # Act
    result = subject.load_adapter_to_dock(collar_name)

    # Assert
    assert isinstance(result, Labware)
    assert result.load_name == collar_name
    assert result.name == "Millipore Vacuum Manifold Collar Tall"

    # Verify the core call was made with correct ModuleFixtureLocation
    decoy.verify(
        mock_protocol_core.load_adapter(
            load_name=collar_name,
            location=dock_location,
            namespace=None,
            version=None,
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_move_to_dock(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_protocol_core: ProtocolCore,
    mock_labware_core: LabwareCore,
) -> None:
    """It should move labware to the manifold dock."""
    mock_labware = Labware(
        core=mock_labware_core,
        api_version=APIVersion(2, 30),
        protocol_core=mock_protocol_core,
        core_map=decoy.mock(cls=LoadedCoreMap),
    )

    subject.move_to_dock(mock_labware)

    decoy.verify(
        mock_protocol_core.move_labware(
            labware_core=mock_labware_core,
            new_location=subject.manifold_dock,
            use_gripper=False,
            pause_for_manual_move=True,
            pick_up_offset=None,
            drop_offset=None,
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_move_to_dock_with_options(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_protocol_core: ProtocolCore,
    mock_labware_core: LabwareCore,
) -> None:
    """It should pass through use_gripper and offsets correctly."""
    mock_labware = Labware(
        core=mock_labware_core,
        api_version=APIVersion(2, 30),
        protocol_core=mock_protocol_core,
        core_map=decoy.mock(cls=LoadedCoreMap),
    )

    pick_up_offset = {"x": 1.0, "y": 2.0, "z": 3.0}
    drop_offset = {"x": -1.0, "y": -2.0, "z": -3.0}

    subject.move_to_dock(
        mock_labware,
        use_gripper=True,
        pick_up_offset=pick_up_offset,
        drop_offset=drop_offset,
    )

    decoy.verify(
        mock_protocol_core.move_labware(
            labware_core=mock_labware_core,
            new_location=subject.manifold_dock,
            use_gripper=True,
            pause_for_manual_move=True,
            pick_up_offset=(1, 2, 3),
            drop_offset=(-1, -2, -3),
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_start_set_vacuum_pressure(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_core: VacuumModuleCore,
) -> None:
    """Make sure the command parameters get passed to the protocol engine correctly."""
    gauge_pressure_mbar = -300
    duration_s = 40
    ramp_rate = None
    timeout_s = 100
    vent_after = None

    subject.start_set_vacuum_pressure(
        gauge_pressure_mbar=gauge_pressure_mbar,
        duration_s=duration_s,
        ramp_rate=ramp_rate,
        timeout_s=timeout_s,
        vent_after=vent_after,
    )

    decoy.verify(
        mock_core.start_set_vacuum_pressure(
            gauge_pressure_mbar=gauge_pressure_mbar,
            duration=duration_s,
            ramp_rate=ramp_rate,
            timeout_s=timeout_s,
            vent_after=vent_after,
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_start_set_vacuum_power(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_core: VacuumModuleCore,
) -> None:
    """Make sure the command parameters get passed to the protocol engine correctly."""
    percent_power = 22
    duration_s = 40
    ramp_rate = 1.2
    timeout_s = 101
    vent_after = True

    subject.start_set_vacuum_power(
        percent_power=percent_power,
        duration_s=duration_s,
        ramp_rate=ramp_rate,
        timeout_s=timeout_s,
        vent_after=vent_after,
    )

    decoy.verify(
        mock_core.start_set_vacuum_power(
            percent_power=percent_power,
            duration=duration_s,
            ramp_rate=ramp_rate,
            timeout_s=timeout_s,
            vent_after=vent_after,
        )
    )


@pytest.mark.parametrize(
    "api_version", versions_at_or_above(from_version=APIVersion(2, 30))
)
def test_vacuum_module_stop_vacuum(
    decoy: Decoy,
    subject: VacuumModuleContext,
    mock_core: VacuumModuleCore,
) -> None:
    """Make sure the the protocol engine function gets called correctly."""
    subject.stop_vacuum_pump()

    decoy.verify(mock_core.stop_vacuum())
