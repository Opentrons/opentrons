"""Tests for pipette state changes in the protocol_engine state store."""
import pytest

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons_shared_data.pipette import pipette_definition

from opentrons.protocol_engine.state import update_types
from opentrons.types import MountType, Point
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.types import (
    CurrentAddressableArea,
    DeckPoint,
    LoadedPipette,
    FlowRates,
    CurrentWell,
    TipGeometry,
)
from opentrons.protocol_engine.actions import (
    SetPipetteMovementSpeedAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.state.pipettes import (
    PipetteStore,
    PipetteState,
    CurrentDeckPoint,
    StaticPipetteConfig,
    BoundingNozzlesOffsets,
    PipetteBoundingBoxOffsets,
)
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)

from .command_fixtures import (
    create_load_pipette_command,
    create_aspirate_command,
    create_aspirate_in_place_command,
    create_dispense_command,
    create_dispense_in_place_command,
    create_pick_up_tip_command,
    create_drop_tip_command,
    create_drop_tip_in_place_command,
    create_succeeded_command,
    create_unsafe_drop_tip_in_place_command,
    create_blow_out_command,
    create_blow_out_in_place_command,
    create_prepare_to_aspirate_command,
    create_unsafe_blow_out_in_place_command,
)
from ..pipette_fixtures import get_default_nozzle_map


@pytest.fixture
def subject() -> PipetteStore:
    """Get a PipetteStore test subject for all subsequent tests."""
    return PipetteStore()


def test_sets_initial_state(subject: PipetteStore) -> None:
    """It should initialize its state object properly."""
    result = subject.state

    assert result == PipetteState(
        pipettes_by_id={},
        aspirated_volume_by_id={},
        current_location=None,
        current_deck_point=CurrentDeckPoint(mount=None, deck_point=None),
        attached_tip_by_id={},
        movement_speed_by_id={},
        static_config_by_id={},
        flow_rates_by_id={},
        nozzle_configuration_by_id={},
        liquid_presence_detection_by_id={},
    )


def test_location_state_update(subject: PipetteStore) -> None:
    """It should update pipette locations."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.RIGHT,
    )
    subject.handle_action(
        SucceedCommandAction(command=load_command, private_result=None)
    )

    # Update the location to a well:
    dummy_command = create_succeeded_command()
    subject.handle_action(
        SucceedCommandAction(
            command=dummy_command,
            private_result=None,
            state_update=update_types.StateUpdate(
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id",
                    new_location=update_types.Well(
                        labware_id="come on barbie",
                        well_name="let's go party",
                    ),
                    new_deck_point=DeckPoint(x=111, y=222, z=333),
                ),
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    liquid_presence_detection=None,
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.RIGHT,
                ),
            ),
        )
    )
    assert subject.state.current_location == CurrentWell(
        pipette_id="pipette-id", labware_id="come on barbie", well_name="let's go party"
    )
    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.RIGHT, deck_point=DeckPoint(x=111, y=222, z=333)
    )

    # Update the location to an addressable area:
    subject.handle_action(
        SucceedCommandAction(
            command=dummy_command,
            private_result=None,
            state_update=update_types.StateUpdate(
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id",
                    new_location=update_types.AddressableArea(
                        addressable_area_name="na na na na na"
                    ),
                    new_deck_point=DeckPoint(x=333, y=444, z=555),
                )
            ),
        )
    )
    assert subject.state.current_location == CurrentAddressableArea(
        pipette_id="pipette-id", addressable_area_name="na na na na na"
    )
    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.RIGHT, deck_point=DeckPoint(x=333, y=444, z=555)
    )

    # Clear the logical location:
    subject.handle_action(
        SucceedCommandAction(
            command=dummy_command,
            private_result=None,
            state_update=update_types.StateUpdate(
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id",
                    new_location=None,
                    new_deck_point=update_types.NO_CHANGE,
                )
            ),
        )
    )
    assert subject.state.current_location is None
    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.RIGHT, deck_point=DeckPoint(x=333, y=444, z=555)
    )

    # Repopulate the locations, then test clearing all pipette locations:
    subject.handle_action(
        SucceedCommandAction(
            command=dummy_command,
            private_result=None,
            state_update=update_types.StateUpdate(
                pipette_location=update_types.PipetteLocationUpdate(
                    pipette_id="pipette-id",
                    new_location=update_types.AddressableArea(
                        addressable_area_name="na na na na na"
                    ),
                    new_deck_point=DeckPoint(x=333, y=444, z=555),
                )
            ),
        )
    )
    assert subject.state.current_location is not None
    assert subject.state.current_deck_point != CurrentDeckPoint(
        mount=None, deck_point=None
    )
    subject.handle_action(
        SucceedCommandAction(
            command=dummy_command,
            private_result=None,
            state_update=update_types.StateUpdate(pipette_location=update_types.CLEAR),
        )
    )
    assert subject.state.current_location is None
    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=None, deck_point=None
    )


def test_handles_load_pipette(subject: PipetteStore) -> None:
    """It should add the pipette data to the state."""
    command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )

    result = subject.state

    assert result.pipettes_by_id["pipette-id"] == LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    assert result.aspirated_volume_by_id["pipette-id"] is None
    assert result.movement_speed_by_id["pipette-id"] is None
    assert result.attached_tip_by_id["pipette-id"] is None


def test_handles_pick_up_and_drop_tip(subject: PipetteStore) -> None:
    """It should set tip and volume details on pick up and drop tip."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="abc",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    pick_up_tip_command = create_pick_up_tip_command(
        pipette_id="abc", tip_volume=42, tip_length=101, tip_diameter=8.0
    )

    drop_tip_command = create_drop_tip_command(
        pipette_id="abc",
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_pipette_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="abc",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=pick_up_tip_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="abc",
                    tip_geometry=TipGeometry(volume=42, length=101, diameter=8.0),
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["abc"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["abc"] == 0

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=drop_tip_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="abc", tip_geometry=None
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["abc"] is None
    assert subject.state.aspirated_volume_by_id["abc"] is None


def test_handles_drop_tip_in_place(subject: PipetteStore) -> None:
    """It should clear tip and volume details after a drop tip in place."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="xyz",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    pick_up_tip_command = create_pick_up_tip_command(
        pipette_id="xyz", tip_volume=42, tip_length=101, tip_diameter=8.0
    )

    drop_tip_in_place_command = create_drop_tip_in_place_command(
        pipette_id="xyz",
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_pipette_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="xyz",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=pick_up_tip_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="xyz",
                    tip_geometry=TipGeometry(volume=42, length=101, diameter=8.0),
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["xyz"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["xyz"] == 0

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=drop_tip_in_place_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="xyz", tip_geometry=None
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["xyz"] is None
    assert subject.state.aspirated_volume_by_id["xyz"] is None


def test_handles_unsafe_drop_tip_in_place(subject: PipetteStore) -> None:
    """It should clear tip and volume details after a drop tip in place."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="xyz",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    pick_up_tip_command = create_pick_up_tip_command(
        pipette_id="xyz", tip_volume=42, tip_length=101, tip_diameter=8.0
    )

    unsafe_drop_tip_in_place_command = create_unsafe_drop_tip_in_place_command(
        pipette_id="xyz",
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_pipette_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="xyz",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=pick_up_tip_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="xyz",
                    tip_geometry=TipGeometry(volume=42, length=101, diameter=8.0),
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["xyz"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["xyz"] == 0

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=unsafe_drop_tip_in_place_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="xyz", tip_geometry=None
                )
            ),
        )
    )
    assert subject.state.attached_tip_by_id["xyz"] is None
    assert subject.state.aspirated_volume_by_id["xyz"] is None


@pytest.mark.parametrize(
    "aspirate_command",
    [
        create_aspirate_command(pipette_id="pipette-id", volume=42, flow_rate=1.23),
        create_aspirate_in_place_command(
            pipette_id="pipette-id", volume=42, flow_rate=1.23
        ),
    ],
)
def test_aspirate_adds_volume(
    subject: PipetteStore, aspirate_command: cmd.Command
) -> None:
    """It should add volume to pipette after an aspirate."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=aspirate_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 42

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=aspirate_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 84


@pytest.mark.parametrize(
    "dispense_command",
    [
        create_dispense_command(pipette_id="pipette-id", volume=21, flow_rate=1.23),
        create_dispense_in_place_command(
            pipette_id="pipette-id",
            volume=21,
            flow_rate=1.23,
        ),
    ],
)
def test_dispense_subtracts_volume(
    subject: PipetteStore, dispense_command: cmd.Command
) -> None:
    """It should subtract volume from pipette after a dispense."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    aspirate_command = create_aspirate_command(
        pipette_id="pipette-id",
        volume=42,
        flow_rate=1.23,
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=aspirate_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=dispense_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 21

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=dispense_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] == 0


@pytest.mark.parametrize(
    "blow_out_command",
    [
        create_blow_out_command("pipette-id", 1.23),
        create_blow_out_in_place_command("pipette-id", 1.23),
        create_unsafe_blow_out_in_place_command("pipette-id", 1.23),
    ],
)
def test_blow_out_clears_volume(
    subject: PipetteStore, blow_out_command: cmd.Command
) -> None:
    """It should wipe out the aspirated volume after a blowOut."""
    load_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    aspirate_command = create_aspirate_command(
        pipette_id="pipette-id",
        volume=42,
        flow_rate=1.23,
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    pipette_name=PipetteNameType.P300_SINGLE,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=aspirate_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=blow_out_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] is None


def test_set_movement_speed(subject: PipetteStore) -> None:
    """It should issue an action to set the movement speed."""
    pipette_id = "pipette-id"
    load_pipette_command = create_load_pipette_command(
        pipette_id=pipette_id,
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SetPipetteMovementSpeedAction(pipette_id=pipette_id, speed=123.456)
    )
    assert subject.state.movement_speed_by_id[pipette_id] == 123.456


def test_add_pipette_config(
    subject: PipetteStore,
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """It should update state from any pipette config private result."""
    command = cmd.LoadPipette.construct(  # type: ignore[call-arg]
        params=cmd.LoadPipetteParams.construct(
            mount=MountType.LEFT, pipetteName="p300_single"  # type: ignore[arg-type]
        ),
        result=cmd.LoadPipetteResult(pipetteId="pipette-id"),
    )
    config = LoadedStaticPipetteData(
        model="pipette-model",
        display_name="pipette name",
        min_volume=1.23,
        max_volume=4.56,
        channels=7,
        flow_rates=FlowRates(
            default_aspirate={"a": 1},
            default_dispense={"b": 2},
            default_blow_out={"c": 3},
        ),
        tip_configuration_lookup_table={4: supported_tip_fixture},
        nominal_tip_overlap={"default": 5},
        home_position=8.9,
        nozzle_offset_z=10.11,
        nozzle_map=get_default_nozzle_map(PipetteNameType.P300_SINGLE),
        back_left_corner_offset=Point(x=1, y=2, z=3),
        front_right_corner_offset=Point(x=4, y=5, z=6),
        pipette_lld_settings={},
    )

    private_result = cmd.LoadPipettePrivateResult(
        pipette_id="pipette-id", serial_number="pipette-serial", config=config
    )
    subject.handle_action(
        SucceedCommandAction(
            command=command,
            private_result=private_result,
            state_update=update_types.StateUpdate(
                pipette_config=update_types.PipetteConfigUpdate(
                    pipette_id="pipette-id",
                    config=config,
                    serial_number="pipette-serial",
                )
            ),
        )
    )

    assert subject.state.static_config_by_id["pipette-id"] == StaticPipetteConfig(
        model="pipette-model",
        serial_number="pipette-serial",
        display_name="pipette name",
        min_volume=1.23,
        max_volume=4.56,
        channels=7,
        tip_configuration_lookup_table={4: supported_tip_fixture},
        nominal_tip_overlap={"default": 5},
        home_position=8.9,
        nozzle_offset_z=10.11,
        bounding_nozzle_offsets=BoundingNozzlesOffsets(
            back_left_offset=Point(x=0, y=0, z=0),
            front_right_offset=Point(x=0, y=0, z=0),
        ),
        default_nozzle_map=get_default_nozzle_map(PipetteNameType.P300_SINGLE),
        pipette_bounding_box_offsets=PipetteBoundingBoxOffsets(
            back_left_corner=Point(x=1, y=2, z=3),
            front_right_corner=Point(x=4, y=5, z=6),
            front_left_corner=Point(x=1, y=5, z=3),
            back_right_corner=Point(x=4, y=2, z=3),
        ),
        lld_settings={},
    )
    assert subject.state.flow_rates_by_id["pipette-id"].default_aspirate == {"a": 1.0}
    assert subject.state.flow_rates_by_id["pipette-id"].default_dispense == {"b": 2.0}
    assert subject.state.flow_rates_by_id["pipette-id"].default_blow_out == {"c": 3.0}


@pytest.mark.parametrize(
    "previous",
    [
        create_blow_out_command(pipette_id="pipette-id", flow_rate=1.0),
        create_dispense_command(pipette_id="pipette-id", volume=10, flow_rate=1.0),
    ],
)
def test_prepare_to_aspirate_marks_pipette_ready(
    subject: PipetteStore, previous: cmd.Command
) -> None:
    """It should mark a pipette as ready to aspirate."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P50_MULTI_FLEX,
        mount=MountType.LEFT,
    )
    pick_up_tip_command = create_pick_up_tip_command(
        pipette_id="pipette-id", tip_volume=42, tip_length=101, tip_diameter=8.0
    )
    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=load_pipette_command,
            state_update=update_types.StateUpdate(
                loaded_pipette=update_types.LoadPipetteUpdate(
                    pipette_id="pipette-id",
                    pipette_name=PipetteNameType.P50_MULTI_FLEX,
                    mount=MountType.LEFT,
                    liquid_presence_detection=None,
                )
            ),
        )
    )
    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=pick_up_tip_command,
            state_update=update_types.StateUpdate(
                pipette_tip_state=update_types.PipetteTipStateUpdate(
                    pipette_id="pipette-id",
                    tip_geometry=TipGeometry(volume=42, length=101, diameter=8.0),
                )
            ),
        )
    )

    subject.handle_action(
        SucceedCommandAction(
            private_result=None,
            command=previous,
        )
    )

    prepare_to_aspirate_command = create_prepare_to_aspirate_command(
        pipette_id="pipette-id"
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=prepare_to_aspirate_command)
    )
    assert subject.state.aspirated_volume_by_id["pipette-id"] == 0.0
