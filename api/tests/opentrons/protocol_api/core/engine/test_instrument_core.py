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
    MotorAxis,
    WellLocation,
    WellOffset,
    WellOrigin,
    DropTipWellLocation,
    DropTipWellOrigin,
)
from opentrons.protocol_engine.errors.exceptions import TipNotAttachedError
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import FlowRates, TipGeometry
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

    decoy.when(mock_engine_client.state.pipettes.get_flow_rates("abc123")).then_return(
        FlowRates(
            default_aspirate={"1.2": 2.3},
            default_dispense={"3.4": 4.5},
            default_blow_out={"5.6": 6.7},
        ),
    )

    return InstrumentCore(
        pipette_id="abc123",
        engine_client=mock_engine_client,
        sync_hardware_api=mock_sync_hardware,
        protocol_core=mock_protocol_core,
        # When this baby hits 88 mph, you're going to see some serious shit.
        default_movement_speed=39339.5,
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


def test_move_to_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
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
        force_direct=True,
        minimum_z_height=9.87,
        speed=6.54,
    )

    decoy.verify(
        mock_engine_client.move_to_well(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
            force_direct=True,
            minimum_z_height=9.87,
            speed=6.54,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_move_to_coordinates(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should move the pipette to a location."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.move_to(
        location=location,
        well_core=None,
        force_direct=True,
        minimum_z_height=42.0,
        speed=4.56,
    )

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=42.0,
            force_direct=True,
            speed=4.56,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_pick_up_tip(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
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
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_get_return_height(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should get the return tip scale from the engine state."""
    decoy.when(
        mock_engine_client.state.pipettes.get_return_tip_scale("abc123")
    ).then_return(0.123)

    result = subject.get_return_height()

    assert result == 0.123


def test_drop_tip_no_location(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should drop a tip given a well core."""
    well_core = WellCore(
        name="well-name",
        labware_id="labware-id",
        engine_client=mock_engine_client,
    )

    subject.drop_tip(
        location=None,
        well_core=well_core,
        home_after=True,
        randomize_drop_location=False,
    )

    decoy.verify(
        mock_engine_client.drop_tip(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=DropTipWellLocation(
                origin=DropTipWellOrigin.DEFAULT,
                offset=WellOffset(x=0, y=0, z=0),
            ),
            home_after=True,
            randomize_drop_location=False,
        ),
        times=1,
    )


def test_drop_tip_with_location(
    decoy: Decoy, mock_engine_client: EngineClient, subject: InstrumentCore
) -> None:
    """It should drop a tip given a well core."""
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

    subject.drop_tip(
        location=location,
        well_core=well_core,
        home_after=True,
        randomize_drop_location=True,
    )

    decoy.verify(
        mock_engine_client.drop_tip(
            pipette_id="abc123",
            labware_id="labware-id",
            well_name="well-name",
            well_location=DropTipWellLocation(
                origin=DropTipWellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
            home_after=True,
            randomize_drop_location=True,
        ),
        times=1,
    )


def test_aspirate_from_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
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
        location=location,
        well_core=well_core,
        volume=12.34,
        rate=5.6,
        flow_rate=7.8,
        in_place=False,
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
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_aspirate_from_location(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should aspirate from coordinates."""
    location = Location(point=Point(1, 2, 3), labware=None)
    subject.aspirate(
        volume=12.34,
        rate=5.6,
        flow_rate=7.8,
        well_core=None,
        location=location,
        in_place=False,
    )

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=None,
            force_direct=False,
            speed=None,
        ),
        mock_engine_client.aspirate_in_place(
            pipette_id="abc123",
            volume=12.34,
            flow_rate=7.8,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_aspirate_in_place(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should aspirate in place."""
    location = Location(point=Point(1, 2, 3), labware=None)
    subject.aspirate(
        volume=12.34,
        rate=5.6,
        flow_rate=7.8,
        well_core=None,
        location=location,
        in_place=True,
    )

    decoy.verify(
        mock_engine_client.aspirate_in_place(
            pipette_id="abc123",
            volume=12.34,
            flow_rate=7.8,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_blow_out_to_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should blow out from a well."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="my cool well", labware_id="123abc", engine_client=mock_engine_client
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="123abc", well_name="my cool well", absolute_point=Point(1, 2, 3)
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.blow_out(location=location, well_core=well_core, in_place=False)

    decoy.verify(
        mock_engine_client.blow_out(
            pipette_id="abc123",
            labware_id="123abc",
            well_name="my cool well",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
            flow_rate=6.7,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_blow_to_coordinates(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should move to coordinate and blow out in place."""
    location = Location(point=Point(1, 2, 3), labware=None)

    subject.blow_out(location=location, well_core=None, in_place=False)

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=None,
            speed=None,
            force_direct=False,
        ),
        mock_engine_client.blow_out_in_place(
            pipette_id="abc123",
            flow_rate=6.7,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_blow_out_in_place(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """Should blow-out in place."""
    location = Location(point=Point(1, 2, 3), labware=None)
    subject.blow_out(
        location=location,
        well_core=None,
        in_place=True,
    )

    decoy.verify(
        mock_engine_client.blow_out_in_place(
            pipette_id="abc123",
            flow_rate=6.7,
        ),
    )


def test_dispense_to_well(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should dispense to a well."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="my cool well", labware_id="123abc", engine_client=mock_engine_client
    )

    decoy.when(
        mock_engine_client.state.geometry.get_relative_well_location(
            labware_id="123abc", well_name="my cool well", absolute_point=Point(1, 2, 3)
        )
    ).then_return(WellLocation(origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)))

    subject.dispense(
        location=location,
        well_core=well_core,
        volume=12.34,
        rate=5.6,
        flow_rate=6.0,
        in_place=False,
    )

    decoy.verify(
        mock_engine_client.dispense(
            pipette_id="abc123",
            labware_id="123abc",
            well_name="my cool well",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=3, y=2, z=1)
            ),
            volume=12.34,
            flow_rate=6.0,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_dispense_in_place(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should dispense in place."""
    location = Location(point=Point(1, 2, 3), labware=None)
    subject.dispense(
        volume=12.34,
        rate=5.6,
        flow_rate=7.8,
        well_core=None,
        location=location,
        in_place=True,
    )

    decoy.verify(
        mock_engine_client.dispense_in_place(
            pipette_id="abc123",
            volume=12.34,
            flow_rate=7.8,
        ),
    )


def test_dispense_to_coordinates(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
    subject: InstrumentCore,
) -> None:
    """It should dispense in place."""
    location = Location(point=Point(1, 2, 3), labware=None)
    subject.dispense(
        volume=12.34,
        rate=5.6,
        flow_rate=7.8,
        well_core=None,
        location=location,
        in_place=False,
    )

    decoy.verify(
        mock_engine_client.move_to_coordinates(
            pipette_id="abc123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            minimum_z_height=None,
            force_direct=False,
            speed=None,
        ),
        mock_engine_client.dispense_in_place(
            pipette_id="abc123",
            volume=12.34,
            flow_rate=7.8,
        ),
    )


def test_initialization_sets_default_movement_speed(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should set a default movement speed as soon as it's initialized."""
    decoy.verify(
        mock_engine_client.set_pipette_movement_speed(
            pipette_id="abc123", speed=39339.5
        )
    )


def test_set_default_speed(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should delegate to the engine client to set the pipette's movement speed."""
    subject.set_default_speed(speed=9000.1)
    decoy.verify(
        mock_engine_client.set_pipette_movement_speed(
            pipette_id=subject.pipette_id, speed=9000.1
        )
    )


def test_get_default_speed(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should delegate to the engine client to set the pipette's movement speed."""
    decoy.when(
        mock_engine_client.state.pipettes.get_movement_speed(
            pipette_id=subject.pipette_id
        )
    ).then_return(9000.1)
    assert subject.get_default_speed() == 9000.1


def test_get_model(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's model name."""
    decoy.when(
        mock_engine_client.state.pipettes.get_model_name(pipette_id=subject.pipette_id)
    ).then_return("pipette-model")
    assert subject.get_model() == "pipette-model"


def test_get_display_name(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's display name."""
    decoy.when(
        mock_engine_client.state.pipettes.get_display_name(
            pipette_id=subject.pipette_id
        )
    ).then_return("display-name")
    assert subject.get_display_name() == "display-name"


def test_get_min_volume(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's min volume."""
    decoy.when(
        mock_engine_client.state.pipettes.get_minimum_volume(
            pipette_id=subject.pipette_id
        )
    ).then_return(1.23)
    assert subject.get_min_volume() == 1.23


def test_get_max_volume(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's max volume."""
    decoy.when(
        mock_engine_client.state.pipettes.get_maximum_volume(
            pipette_id=subject.pipette_id
        )
    ).then_return(4.56)
    assert subject.get_max_volume() == 4.56


def test_get_working_volume(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's working volume."""
    decoy.when(
        mock_engine_client.state.pipettes.get_working_volume(
            pipette_id=subject.pipette_id
        )
    ).then_return(7.89)
    assert subject.get_working_volume() == 7.89


def test_get_channels(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's number of channels."""
    decoy.when(
        mock_engine_client.state.tips.get_pipette_channels(
            pipette_id=subject.pipette_id
        )
    ).then_return(42)
    assert subject.get_channels() == 42


def test_get_current_volume(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's current volume."""
    decoy.when(
        mock_engine_client.state.pipettes.get_aspirated_volume(
            pipette_id=subject.pipette_id
        )
    ).then_return(123.4)
    assert subject.get_current_volume() == 123.4


def test_get_current_volume_returns_zero_when_no_tip_attached(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should return 0 when an exception is raised."""
    decoy.when(
        mock_engine_client.state.pipettes.get_aspirated_volume(
            pipette_id=subject.pipette_id
        )
    ).then_raise(TipNotAttachedError())
    assert subject.get_current_volume() == 0


def test_get_available_volume_returns_zero_no_tip_attached(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should return 0 when an exception is raised."""
    decoy.when(
        mock_engine_client.state.pipettes.get_available_volume(
            pipette_id=subject.pipette_id
        )
    ).then_raise(TipNotAttachedError())
    assert subject.get_available_volume() == 0


def test_get_available_volume(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should get the pipette's available volume."""
    decoy.when(
        mock_engine_client.state.pipettes.get_available_volume(
            pipette_id=subject.pipette_id
        )
    ).then_return(9001)
    assert subject.get_available_volume() == 9001


def test_home_z(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should home its Z-stage and plunger."""
    decoy.when(mock_engine_client.state.pipettes.get_z_axis("abc123")).then_return(
        MotorAxis.RIGHT_Z
    )
    decoy.when(
        mock_engine_client.state.pipettes.get_plunger_axis("abc123")
    ).then_return(MotorAxis.RIGHT_PLUNGER)

    subject.home()

    decoy.verify(
        mock_engine_client.home(axes=[MotorAxis.RIGHT_Z, MotorAxis.RIGHT_PLUNGER]),
        times=1,
    )


def test_home_plunger(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should home its plunger."""
    decoy.when(
        mock_engine_client.state.pipettes.get_plunger_axis("abc123")
    ).then_return(MotorAxis.LEFT_PLUNGER)

    subject.home_plunger()

    decoy.verify(
        mock_engine_client.home(axes=[MotorAxis.LEFT_PLUNGER]),
        times=1,
    )


def test_touch_tip(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
    mock_protocol_core: ProtocolCore,
) -> None:
    """It should touch the tip to the edges of the well."""
    location = Location(point=Point(1, 2, 3), labware=None)

    well_core = WellCore(
        name="my cool well", labware_id="123abc", engine_client=mock_engine_client
    )

    subject.touch_tip(
        location=location,
        well_core=well_core,
        radius=1.23,
        z_offset=4.56,
        speed=7.89,
    )

    decoy.verify(
        mock_engine_client.touch_tip(
            pipette_id="abc123",
            labware_id="123abc",
            well_name="my cool well",
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=4.56)
            ),
            radius=1.23,
            speed=7.89,
        ),
        mock_protocol_core.set_last_location(location=location, mount=Mount.LEFT),
    )


def test_has_tip(
    decoy: Decoy,
    subject: InstrumentCore,
    mock_engine_client: EngineClient,
) -> None:
    """It should return tip state."""
    decoy.when(
        mock_engine_client.state.pipettes.get_attached_tip("abc123")
    ).then_return(TipGeometry(length=1, diameter=2, volume=3))

    assert subject.has_tip() is True
