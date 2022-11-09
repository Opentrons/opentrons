"""Test for the ProtocolEngine-based instrument API core."""
from typing import cast

import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType

from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocol_engine import (
    DeckPoint,
    LoadedPipette,
    WellLocation,
    WellOffset,
    WellOrigin,
)
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine import InstrumentCore, WellCore, ProtocolCore
from opentrons.types import Location, Mount, MountType, Point


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_hardware(decoy: Decoy) -> SyncHardwareAPI:
    """Get a mock SyncHardwareAPI synchronous client."""
    return decoy.mock(cls=SyncHardwareAPI)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def subject(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_hardware: SyncHardwareAPI,
    mock_protocol_core: ProtocolCore,
) -> InstrumentCore:
    """Get a InstrumentCore test subject with its dependencies mocked out."""
    decoy.when(mock_engine_client.state.pipettes.get("abc123")).then_return(
        LoadedPipette.construct(mount=MountType.LEFT)  # type: ignore[call-arg]
    )
    pipette_dict = cast(
        PipetteDict,
        {
            "default_aspirate_flow_rates": {"1.1": 22},
            "default_dispense_flow_rates": {"3.3": 44},
            "default_blow_out_flow_rates": {"5.5": 66},
        },
    )
    decoy.when(mock_sync_hardware.get_attached_instrument(Mount.LEFT)).then_return(
        pipette_dict
    )
    return InstrumentCore(
        pipette_id="abc123",
        engine_client=mock_engine_client,
        sync_hardware_api=mock_sync_hardware,
        protocol_core=mock_protocol_core,
    )


def test_pipette_id(subject: InstrumentCore) -> None:
    """It should have a ProtocolEngine ID."""
    assert subject.pipette_id == "abc123"


def test_get_pipette_name(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should get the pipette's load name."""
    decoy.when(mock_engine_client.state.pipettes.get("abc123")).then_return(
        LoadedPipette.construct(pipetteName=PipetteNameType.P300_SINGLE)  # type: ignore[call-arg]
    )

    result = subject.get_pipette_name()

    assert result == "p300_single"


def test_get_mount(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should get the pipette's mount."""
    decoy.when(mock_engine_client.state.pipettes.get("abc123")).then_return(
        LoadedPipette.construct(mount=MountType.LEFT)  # type: ignore[call-arg]
    )

    result = subject.get_mount()

    assert result == Mount.LEFT


def test_get_hardware_state(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_hardware: SyncHardwareAPI,
    subject: InstrumentCore,
) -> None:
    """It should return the actual state of the pipette hardware."""
    pipette_dict = cast(PipetteDict, {"display_name": "Cool Pipette", "has_tip": True})

    decoy.when(mock_engine_client.state.pipettes.get("abc123")).then_return(
        LoadedPipette.construct(mount=MountType.LEFT)  # type: ignore[call-arg]
    )
    decoy.when(mock_sync_hardware.get_attached_instrument(Mount.LEFT)).then_return(
        pipette_dict
    )

    assert subject.get_hardware_state() == pipette_dict
    assert subject.has_tip() is True


def test_move_to_well(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="labware-id",
            well_name="well-name",
            absolute_point=Point(1, 2, 3),
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.move_to(
        location=location,
        well_core=well_core,
        force_direct=False,
        minimum_z_height=None,
        speed=None,
    )

    decoy.verify(
        mock_engine_client.move_to_well(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
        ),
        times=1,
    )


def test_move_to_coordinates(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(
        location=location,
        well_core=None,
        force_direct=True,
        minimum_z_height=42.0,
        speed=None,
    )

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=42.0,
            force_direct=True,
        ),
        times=1,
    )


def test_pick_up_tip(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should pick up a tip from a well."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="labware-id",
            well_name="well-name",
            absolute_point=Point(1, 2, 3),
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.pick_up_tip(
        location=location,
        well_core=well_core,
        presses=None,
        increment=None,
    )

    decoy.verify(
        mock_engine_client.pick_up_tip(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
        ),
        times=1,
    )


def test_drop_tip_no_location(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should drop a tip given a well core."""
    well_core = WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )

    subject.drop_tip(location=None, well_core=well_core, home_after=True)

    decoy.verify(
        mock_engine_client.drop_tip(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=0)
            ),
        ),
        times=1,
    )


def test_aspirate_from_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    subject: InstrumentCore,
) -> None:
    """It should aspirate from a well."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="my cool well", labware_id="123abc", engine_client=mock_engine_client
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="123abc", well_name="my cool well", absolute_point=Point(1, 2, 3)
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.aspirate(
        location=location, well_core=well_core, volume=12.34, rate=5.6, flow_rate=7.8
    )

    decoy.verify(
        mock_engine_client.aspirate(
            pipette_id="abc123",
            labware_id="123abc",
            well_name="my cool well",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
            volume=12.34,
            flow_rate=7.8,
        )
    )
