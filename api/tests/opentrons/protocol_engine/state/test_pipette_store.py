"""Tests for pipette state changes in the protocol_engine state store."""
import pytest
from datetime import datetime
from typing import Optional, Union

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons_shared_data.pipette import pipette_definition

from opentrons.types import DeckSlotName, MountType, Point
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.commands.command import DefinedErrorData
from opentrons.protocol_engine.commands.pipetting_common import (
    LiquidNotFoundError,
    LiquidNotFoundErrorInternalData,
    OverpressureError,
    OverpressureErrorInternalData,
)
from opentrons.protocol_engine.error_recovery_policy import ErrorRecoveryType
from opentrons.protocol_engine.types import (
    DeckPoint,
    DeckSlotLocation,
    LoadedPipette,
    OFF_DECK_LOCATION,
    LabwareMovementStrategy,
    FlowRates,
    CurrentWell,
    TipGeometry,
)
from opentrons.protocol_engine.actions import (
    FailCommandAction,
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
    create_unsafe_drop_tip_in_place_command,
    create_touch_tip_command,
    create_move_to_well_command,
    create_blow_out_command,
    create_blow_out_in_place_command,
    create_move_labware_command,
    create_move_to_coordinates_command,
    create_move_relative_command,
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


def test_handles_load_pipette(subject: PipetteStore) -> None:
    """It should add the pipette data to the state."""
    command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(SucceedCommandAction(private_result=None, command=command))

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
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=pick_up_tip_command)
    )
    assert subject.state.attached_tip_by_id["abc"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["abc"] == 0

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=drop_tip_command)
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
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=pick_up_tip_command)
    )
    assert subject.state.attached_tip_by_id["xyz"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["xyz"] == 0

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=drop_tip_in_place_command)
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
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=pick_up_tip_command)
    )
    assert subject.state.attached_tip_by_id["xyz"] == TipGeometry(
        volume=42, length=101, diameter=8.0
    )
    assert subject.state.aspirated_volume_by_id["xyz"] == 0

    subject.handle_action(
        SucceedCommandAction(
            private_result=None, command=unsafe_drop_tip_in_place_command
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
        SucceedCommandAction(private_result=None, command=load_command)
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
        SucceedCommandAction(private_result=None, command=load_command)
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
        SucceedCommandAction(private_result=None, command=load_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=aspirate_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=blow_out_command)
    )

    assert subject.state.aspirated_volume_by_id["pipette-id"] is None


@pytest.mark.parametrize(
    ("action", "expected_location"),
    (
        (
            SucceedCommandAction(
                command=create_aspirate_command(
                    pipette_id="pipette-id",
                    labware_id="aspirate-labware-id",
                    well_name="aspirate-well-name",
                    volume=1337,
                    flow_rate=1.23,
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="aspirate-labware-id",
                well_name="aspirate-well-name",
            ),
        ),
        (
            FailCommandAction(
                running_command=cmd.Aspirate(
                    params=cmd.AspirateParams(
                        pipetteId="pipette-id",
                        labwareId="aspirate-labware-id",
                        wellName="aspirate-well-name",
                        volume=99999,
                        flowRate=1.23,
                    ),
                    id="command-id",
                    key="command-key",
                    createdAt=datetime.now(),
                    status=cmd.CommandStatus.RUNNING,
                ),
                error=DefinedErrorData(
                    public=OverpressureError(
                        id="error-id",
                        createdAt=datetime.now(),
                        errorInfo={"retryLocation": (0, 0, 0)},
                    ),
                    private=OverpressureErrorInternalData(
                        position=DeckPoint(x=0, y=0, z=0)
                    ),
                ),
                command_id="command-id",
                error_id="error-id",
                failed_at=datetime.now(),
                notes=[],
                type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="aspirate-labware-id",
                well_name="aspirate-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=create_dispense_command(
                    pipette_id="pipette-id",
                    labware_id="dispense-labware-id",
                    well_name="dispense-well-name",
                    volume=1337,
                    flow_rate=1.23,
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="dispense-labware-id",
                well_name="dispense-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=create_pick_up_tip_command(
                    pipette_id="pipette-id",
                    labware_id="pick-up-tip-labware-id",
                    well_name="pick-up-tip-well-name",
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="pick-up-tip-labware-id",
                well_name="pick-up-tip-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=create_drop_tip_command(
                    pipette_id="pipette-id",
                    labware_id="drop-tip-labware-id",
                    well_name="drop-tip-well-name",
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="drop-tip-labware-id",
                well_name="drop-tip-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=create_move_to_well_command(
                    pipette_id="pipette-id",
                    labware_id="move-to-well-labware-id",
                    well_name="move-to-well-well-name",
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="move-to-well-labware-id",
                well_name="move-to-well-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=create_blow_out_command(
                    pipette_id="pipette-id",
                    labware_id="move-to-well-labware-id",
                    well_name="move-to-well-well-name",
                    flow_rate=1.23,
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="move-to-well-labware-id",
                well_name="move-to-well-well-name",
            ),
        ),
        (
            FailCommandAction(
                running_command=cmd.Dispense(
                    params=cmd.DispenseParams(
                        pipetteId="pipette-id",
                        labwareId="dispense-labware-id",
                        wellName="dispense-well-name",
                        volume=50,
                        flowRate=1.23,
                    ),
                    id="command-id",
                    key="command-key",
                    createdAt=datetime.now(),
                    status=cmd.CommandStatus.RUNNING,
                ),
                error=DefinedErrorData(
                    public=OverpressureError(
                        id="error-id",
                        createdAt=datetime.now(),
                        errorInfo={"retryLocation": (0, 0, 0)},
                    ),
                    private=OverpressureErrorInternalData(
                        position=DeckPoint(x=0, y=0, z=0)
                    ),
                ),
                command_id="command-id",
                error_id="error-id",
                failed_at=datetime.now(),
                notes=[],
                type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="dispense-labware-id",
                well_name="dispense-well-name",
            ),
        ),
        # liquidProbe and tryLiquidProbe succeeding and with overpressure error
        (
            SucceedCommandAction(
                command=cmd.LiquidProbe(
                    id="command-id",
                    createdAt=datetime.now(),
                    startedAt=datetime.now(),
                    completedAt=datetime.now(),
                    key="command-key",
                    status=cmd.CommandStatus.SUCCEEDED,
                    params=cmd.LiquidProbeParams(
                        labwareId="liquid-probe-labware-id",
                        wellName="liquid-probe-well-name",
                        pipetteId="pipette-id",
                    ),
                    result=cmd.LiquidProbeResult(
                        position=DeckPoint(x=0, y=0, z=0), z_position=0
                    ),
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="liquid-probe-labware-id",
                well_name="liquid-probe-well-name",
            ),
        ),
        (
            FailCommandAction(
                running_command=cmd.LiquidProbe.model_construct(  # type: ignore[call-arg]
                    id="command-id",
                    createdAt=datetime.now(),
                    startedAt=datetime.now(),
                    key="command-key",
                    status=cmd.CommandStatus.RUNNING,
                    params=cmd.LiquidProbeParams(
                        labwareId="liquid-probe-labware-id",
                        wellName="liquid-probe-well-name",
                        pipetteId="pipette-id",
                    ),
                ),
                error=DefinedErrorData(
                    public=LiquidNotFoundError(
                        id="error-id",
                        createdAt=datetime.now(),
                    ),
                    private=LiquidNotFoundErrorInternalData(
                        position=DeckPoint(x=0, y=0, z=0)
                    ),
                ),
                command_id="command-id",
                error_id="error-id",
                failed_at=datetime.now(),
                notes=[],
                type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="liquid-probe-labware-id",
                well_name="liquid-probe-well-name",
            ),
        ),
        (
            SucceedCommandAction(
                command=cmd.TryLiquidProbe(
                    id="command-id",
                    createdAt=datetime.now(),
                    startedAt=datetime.now(),
                    completedAt=datetime.now(),
                    key="command-key",
                    status=cmd.CommandStatus.SUCCEEDED,
                    params=cmd.TryLiquidProbeParams(
                        labwareId="try-liquid-probe-labware-id",
                        wellName="try-liquid-probe-well-name",
                        pipetteId="pipette-id",
                    ),
                    result=cmd.TryLiquidProbeResult(
                        position=DeckPoint(x=0, y=0, z=0),
                        z_position=0,
                    ),
                ),
                private_result=None,
            ),
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="try-liquid-probe-labware-id",
                well_name="try-liquid-probe-well-name",
            ),
        ),
    ),
)
def test_movement_commands_update_current_well(
    action: Union[SucceedCommandAction, FailCommandAction],
    expected_location: CurrentWell,
    subject: PipetteStore,
) -> None:
    """It should save the last used pipette, labware, and well for movement commands."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(action)

    assert subject.state.current_location == expected_location


@pytest.mark.parametrize(
    "command",
    [
        cmd.Home(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.HomeParams(),
            result=cmd.HomeResult(),
        ),
        cmd.MoveToCoordinates(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.MoveToCoordinatesParams(
                pipetteId="pipette-id",
                coordinates=DeckPoint(x=1.1, y=2.2, z=3.3),
            ),
            result=cmd.MoveToCoordinatesResult(),
        ),
        cmd.thermocycler.OpenLid(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.thermocycler.OpenLidParams(moduleId="xyz"),
            result=cmd.thermocycler.OpenLidResult(),
        ),
        cmd.thermocycler.CloseLid(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.thermocycler.CloseLidParams(moduleId="xyz"),
            result=cmd.thermocycler.CloseLidResult(),
        ),
        cmd.heater_shaker.SetAndWaitForShakeSpeed(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.SetAndWaitForShakeSpeedParams(
                moduleId="xyz",
                rpm=123,
            ),
            result=cmd.heater_shaker.SetAndWaitForShakeSpeedResult(
                pipetteRetracted=True
            ),
        ),
        cmd.heater_shaker.OpenLabwareLatch(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.OpenLabwareLatchParams(moduleId="xyz"),
            result=cmd.heater_shaker.OpenLabwareLatchResult(pipetteRetracted=True),
        ),
    ],
)
def test_movement_commands_without_well_clear_current_well(
    subject: PipetteStore, command: cmd.Command
) -> None:
    """Commands that make the current well unknown should clear the current well."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    move_command = create_move_to_well_command(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="well-name",
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=move_command)
    )
    subject.handle_action(SucceedCommandAction(private_result=None, command=command))

    assert subject.state.current_location is None


@pytest.mark.parametrize(
    "command",
    [
        cmd.heater_shaker.SetAndWaitForShakeSpeed(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.SetAndWaitForShakeSpeedParams(
                moduleId="xyz",
                rpm=123,
            ),
            result=cmd.heater_shaker.SetAndWaitForShakeSpeedResult(
                pipetteRetracted=False
            ),
        ),
        cmd.heater_shaker.OpenLabwareLatch(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.OpenLabwareLatchParams(moduleId="xyz"),
            result=cmd.heater_shaker.OpenLabwareLatchResult(pipetteRetracted=False),
        ),
    ],
)
def test_heater_shaker_command_without_movement(
    subject: PipetteStore, command: cmd.Command
) -> None:
    """Heater Shaker commands that don't move pipettes shouldn't clear current_well or deck point."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    move_command = create_move_to_well_command(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="well-name",
        destination=DeckPoint(x=1, y=2, z=3),
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=move_command)
    )
    subject.handle_action(SucceedCommandAction(private_result=None, command=command))

    assert subject.state.current_location == CurrentWell(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="well-name",
    )

    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.LEFT, deck_point=DeckPoint(x=1, y=2, z=3)
    )


@pytest.mark.parametrize(
    ("move_labware_command", "expected_current_well"),
    (
        (
            create_move_labware_command(
                labware_id="non-matching-labware-id",
                strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                offset_id=None,
            ),
            # Current well NOT cleared,
            # because MoveLabware command had "non-matching-labware-id".
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="matching-labware-id",
                well_name="well-name",
            ),
        ),
        (
            create_move_labware_command(
                labware_id="matching-labware-id",
                strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                offset_id=None,
            ),
            # Current well IS cleared,
            # because MoveLabware command had "matching-labware-id".
            None,
        ),
        (
            create_move_labware_command(
                labware_id="non-matching-labware-id",
                strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
                new_location=OFF_DECK_LOCATION,
                offset_id=None,
            ),
            # Current well NOT cleared,
            # because MoveLabware command had "non-matching-labware-id".
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="matching-labware-id",
                well_name="well-name",
            ),
        ),
        (
            create_move_labware_command(
                labware_id="matching-labware-id",
                strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
                new_location=OFF_DECK_LOCATION,
                offset_id=None,
            ),
            # Current well IS cleared,
            # because MoveLabware command had "matching-labware-id".
            None,
        ),
        (
            create_move_labware_command(
                labware_id="non-matching-labware-id",
                new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
                strategy=LabwareMovementStrategy.USING_GRIPPER,
                offset_id=None,
            ),
            # Current well IS cleared,
            # because MoveLabware command used gripper.
            None,
        ),
    ),
)
def test_move_labware_clears_current_well(
    subject: PipetteStore,
    move_labware_command: cmd.MoveLabware,
    expected_current_well: Optional[CurrentWell],
) -> None:
    """Labware movement commands should sometimes clear the current well.

    It should be cleared when-
    * the current well belongs to the labware that was moved,
    * or gripper was used to move labware

    Otherwise, it should be left alone.
    """
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    move_to_well_command = create_move_to_well_command(
        pipette_id="pipette-id",
        labware_id="matching-labware-id",
        well_name="well-name",
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=move_to_well_command)
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=move_labware_command)
    )
    assert subject.state.current_location == expected_current_well


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
    command = cmd.LoadPipette.construct(
        params=cmd.LoadPipetteParams.construct(
            mount=MountType.LEFT, pipetteName="p300_single"
        ),
        result=cmd.LoadPipetteResult(pipetteId="pipette-id"),
    )
    private_result = cmd.LoadPipettePrivateResult(
        pipette_id="pipette-id",
        serial_number="pipette-serial",
        config=LoadedStaticPipetteData(
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
        ),
    )
    subject.handle_action(
        SucceedCommandAction(command=command, private_result=private_result)
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
    "action",
    (
        SucceedCommandAction(
            command=create_aspirate_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                volume=1337,
                flow_rate=1.23,
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        FailCommandAction(
            running_command=cmd.Aspirate(
                params=cmd.AspirateParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                    volume=99999,
                    flowRate=1.23,
                ),
                id="command-id",
                key="command-key",
                createdAt=datetime.now(),
                status=cmd.CommandStatus.RUNNING,
            ),
            error=DefinedErrorData(
                public=OverpressureError(
                    id="error-id",
                    detail="error-detail",
                    createdAt=datetime.now(),
                    errorInfo={"retryLocation": (11, 22, 33)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint(x=11, y=22, z=33)
                ),
            ),
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime.now(),
            notes=[],
            type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        ),
        SucceedCommandAction(
            command=create_dispense_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                volume=1337,
                flow_rate=1.23,
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_blow_out_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                flow_rate=1.23,
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_pick_up_tip_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_drop_tip_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_touch_tip_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_move_to_well_command(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="well-name",
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_move_to_coordinates_command(
                pipette_id="pipette-id",
                coordinates=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        SucceedCommandAction(
            command=create_move_relative_command(
                pipette_id="pipette-id",
                destination=DeckPoint(x=11, y=22, z=33),
            ),
            private_result=None,
        ),
        FailCommandAction(
            running_command=cmd.Dispense(
                params=cmd.DispenseParams(
                    pipetteId="pipette-id",
                    labwareId="labware-id",
                    wellName="well-name",
                    volume=125,
                    flowRate=1.23,
                ),
                id="command-id",
                key="command-key",
                createdAt=datetime.now(),
                status=cmd.CommandStatus.RUNNING,
            ),
            error=DefinedErrorData(
                public=OverpressureError(
                    id="error-id",
                    detail="error-detail",
                    createdAt=datetime.now(),
                    errorInfo={"retryLocation": (11, 22, 33)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint(x=11, y=22, z=33)
                ),
            ),
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime.now(),
            notes=[],
            type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        ),
        FailCommandAction(
            running_command=cmd.AspirateInPlace(
                params=cmd.AspirateInPlaceParams(
                    pipetteId="pipette-id",
                    volume=125,
                    flowRate=1.23,
                ),
                id="command-id",
                key="command-key",
                createdAt=datetime.now(),
                status=cmd.CommandStatus.RUNNING,
            ),
            error=DefinedErrorData(
                public=OverpressureError(
                    id="error-id",
                    detail="error-detail",
                    createdAt=datetime.now(),
                    errorInfo={"retryLocation": (11, 22, 33)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint(x=11, y=22, z=33)
                ),
            ),
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime.now(),
            notes=[],
            type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        ),
        FailCommandAction(
            running_command=cmd.DispenseInPlace(
                params=cmd.DispenseInPlaceParams(
                    pipetteId="pipette-id",
                    volume=125,
                    flowRate=1.23,
                ),
                id="command-id",
                key="command-key",
                createdAt=datetime.now(),
                status=cmd.CommandStatus.RUNNING,
            ),
            error=DefinedErrorData(
                public=OverpressureError(
                    id="error-id",
                    detail="error-detail",
                    createdAt=datetime.now(),
                    errorInfo={"retryLocation": (11, 22, 33)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint(x=11, y=22, z=33)
                ),
            ),
            command_id="command-id",
            error_id="error-id",
            failed_at=datetime.now(),
            notes=[],
            type=ErrorRecoveryType.WAIT_FOR_RECOVERY,
        ),
    ),
)
def test_movement_commands_update_deck_point(
    action: Union[SucceedCommandAction, FailCommandAction],
    subject: PipetteStore,
) -> None:
    """It should save the last used pipette, labware, and well for movement commands."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(action)

    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.LEFT, deck_point=DeckPoint(x=11, y=22, z=33)
    )


@pytest.mark.parametrize(
    "command",
    (
        cmd.Home(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.HomeParams(),
            result=cmd.HomeResult(),
        ),
        cmd.thermocycler.OpenLid(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.thermocycler.OpenLidParams(moduleId="xyz"),
            result=cmd.thermocycler.OpenLidResult(),
        ),
        cmd.thermocycler.CloseLid(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.thermocycler.CloseLidParams(moduleId="xyz"),
            result=cmd.thermocycler.CloseLidResult(),
        ),
        cmd.heater_shaker.SetAndWaitForShakeSpeed(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.SetAndWaitForShakeSpeedParams(
                moduleId="xyz",
                rpm=123,
            ),
            result=cmd.heater_shaker.SetAndWaitForShakeSpeedResult(
                pipetteRetracted=True
            ),
        ),
        cmd.heater_shaker.OpenLabwareLatch(
            id="command-id-2",
            key="command-key-2",
            status=cmd.CommandStatus.SUCCEEDED,
            createdAt=datetime(year=2021, month=1, day=1),
            params=cmd.heater_shaker.OpenLabwareLatchParams(moduleId="xyz"),
            result=cmd.heater_shaker.OpenLabwareLatchResult(pipetteRetracted=True),
        ),
        create_move_labware_command(
            new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            strategy=LabwareMovementStrategy.USING_GRIPPER,
        ),
    ),
)
def test_homing_commands_clear_deck_point(
    command: cmd.Command,
    subject: PipetteStore,
) -> None:
    """It should save the last used pipette, labware, and well for movement commands."""
    load_pipette_command = create_load_pipette_command(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.LEFT,
    )
    move_command = create_move_to_well_command(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="well-name",
        destination=DeckPoint(x=1, y=2, z=3),
    )

    subject.handle_action(
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=move_command)
    )

    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=MountType.LEFT, deck_point=DeckPoint(x=1, y=2, z=3)
    )

    subject.handle_action(SucceedCommandAction(private_result=None, command=command))

    assert subject.state.current_deck_point == CurrentDeckPoint(
        mount=None, deck_point=None
    )


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
        SucceedCommandAction(private_result=None, command=load_pipette_command)
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=pick_up_tip_command)
    )

    subject.handle_action(SucceedCommandAction(private_result=None, command=previous))

    prepare_to_aspirate_command = create_prepare_to_aspirate_command(
        pipette_id="pipette-id"
    )
    subject.handle_action(
        SucceedCommandAction(private_result=None, command=prepare_to_aspirate_command)
    )
    assert subject.state.aspirated_volume_by_id["pipette-id"] == 0.0
