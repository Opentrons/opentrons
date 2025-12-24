"""Tests for the PipetteStore+PipetteState+PipetteView trifecta.

The trifecta is tested here as a single unit, treating PipetteState as a private
implementation detail.
"""

from collections import OrderedDict

import pytest

from opentrons_shared_data.pipette import pipette_definition
from opentrons_shared_data.pipette.types import (
    LiquidClasses as VolumeModes,
)
from opentrons_shared_data.pipette.types import (
    PipetteNameType,
)

from ..pipette_fixtures import (
    EIGHT_CHANNEL_COLS,
    EIGHT_CHANNEL_MAP,
    EIGHT_CHANNEL_ROWS,
    NINETY_SIX_COLS,
    NINETY_SIX_MAP,
    NINETY_SIX_ROWS,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine import actions, commands
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.pipettes import PipetteStore, PipetteView
from opentrons.protocol_engine.types import FlowRates, LabwareWellId, TipGeometry
from opentrons.types import MountType, Point


def _dummy_command() -> commands.Command:
    """Return a placeholder command."""
    return commands.Comment.model_construct()  # type: ignore[call-arg]


def test_handle_pipette_config_action(
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
) -> None:
    """Should add pipette channel to state."""
    subject = PipetteStore()

    config_update = update_types.PipetteConfigUpdate(
        pipette_id="pipette-id",
        serial_number="pipette-serial",
        config=LoadedStaticPipetteData(
            channels=8,
            max_volume=15,
            min_volume=3,
            model="gen a",
            display_name="display name",
            flow_rates=FlowRates(
                default_aspirate={},
                default_dispense={},
                default_blow_out={},
            ),
            tip_configuration_lookup_table={15: supported_tip_fixture},
            nominal_tip_overlap={},
            nozzle_offset_z=1.23,
            home_position=4.56,
            nozzle_map=NozzleMap.build(
                physical_nozzles=EIGHT_CHANNEL_MAP,
                physical_rows=EIGHT_CHANNEL_ROWS,
                physical_columns=EIGHT_CHANNEL_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="H1",
                valid_nozzle_maps=pipette_definition.ValidNozzleMaps(
                    maps={"Full": EIGHT_CHANNEL_COLS["1"]}
                ),
            ),
            back_left_corner_offset=Point(x=1, y=2, z=3),
            front_right_corner_offset=Point(x=4, y=5, z=6),
            pipette_lld_settings={},
            plunger_positions={
                "top": 0.0,
                "bottom": 5.0,
                "blow_out": 19.0,
                "drop_tip": 20.0,
            },
            shaft_ul_per_mm=5.0,
            available_sensors=pipette_definition.AvailableSensorDefinition(
                sensors=["pressure", "capacitive", "environment"]
            ),
            volume_mode=VolumeModes.default,
            available_volume_modes_min_vol={},
        ),
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(pipette_config=config_update),
            command=_dummy_command(),
        )
    )

    assert PipetteView(subject.state).get_channels("pipette-id") == 8
    assert PipetteView(subject.state).get_active_channels("pipette-id") == 8


@pytest.mark.parametrize(
    argnames=["nozzle_map", "expected_channels"],
    argvalues=[
        (
            NozzleMap.build(
                physical_nozzles=OrderedDict({"A1": Point(0, 0, 0)}),
                physical_rows=OrderedDict({"A": ["A1"]}),
                physical_columns=OrderedDict({"1": ["A1"]}),
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="A1",
                valid_nozzle_maps=pipette_definition.ValidNozzleMaps(
                    maps={"A1": ["A1"]}
                ),
            ),
            1,
        ),
        (
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="H12",
                valid_nozzle_maps=pipette_definition.ValidNozzleMaps(
                    maps={
                        "Full": sum(
                            [
                                NINETY_SIX_ROWS["A"],
                                NINETY_SIX_ROWS["B"],
                                NINETY_SIX_ROWS["C"],
                                NINETY_SIX_ROWS["D"],
                                NINETY_SIX_ROWS["E"],
                                NINETY_SIX_ROWS["F"],
                                NINETY_SIX_ROWS["G"],
                                NINETY_SIX_ROWS["H"],
                            ],
                            [],
                        )
                    }
                ),
            ),
            96,
        ),
        (
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="E1",
                valid_nozzle_maps=pipette_definition.ValidNozzleMaps(
                    maps={"A1_E1": ["A1", "B1", "C1", "D1", "E1"]}
                ),
            ),
            5,
        ),
    ],
)
def test_active_channels(
    supported_tip_fixture: pipette_definition.SupportedTipsDefinition,
    nozzle_map: NozzleMap,
    expected_channels: int,
) -> None:
    """Should update active channels after pipette configuration change."""
    subject = PipetteStore()

    # Load pipette to update state
    config_update = update_types.PipetteConfigUpdate(
        pipette_id="pipette-id",
        serial_number="pipette-serial",
        config=LoadedStaticPipetteData(
            channels=9,
            max_volume=15,
            min_volume=3,
            model="gen a",
            display_name="display name",
            flow_rates=FlowRates(
                default_aspirate={},
                default_dispense={},
                default_blow_out={},
            ),
            tip_configuration_lookup_table={15: supported_tip_fixture},
            nominal_tip_overlap={},
            nozzle_offset_z=1.23,
            home_position=4.56,
            nozzle_map=nozzle_map,
            back_left_corner_offset=Point(x=1, y=2, z=3),
            front_right_corner_offset=Point(x=4, y=5, z=6),
            pipette_lld_settings={},
            plunger_positions={
                "top": 0.0,
                "bottom": 5.0,
                "blow_out": 19.0,
                "drop_tip": 20.0,
            },
            shaft_ul_per_mm=5.0,
            available_sensors=pipette_definition.AvailableSensorDefinition(
                sensors=["pressure", "capacitive", "environment"]
            ),
            volume_mode=VolumeModes.default,
            available_volume_modes_min_vol={},
        ),
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(pipette_config=config_update),
            command=_dummy_command(),
        )
    )

    # Configure nozzle for partial configuration
    state_update = update_types.StateUpdate(
        pipette_nozzle_map=update_types.PipetteNozzleMapUpdate(
            pipette_id="pipette-id",
            nozzle_map=nozzle_map,
        )
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            command=_dummy_command(),
            state_update=state_update,
        )
    )
    assert (
        PipetteView(subject.state).get_active_channels("pipette-id")
        == expected_channels
    )


def test_last_tip_rack_well() -> None:
    """Should update last tip rack well after pipette load and tip state updates."""
    subject = PipetteStore()

    load_pipette_update = update_types.LoadPipetteUpdate(
        pipette_id="pipette-id",
        pipette_name=PipetteNameType.P50_SINGLE_FLEX,
        mount=MountType.RIGHT,
        liquid_presence_detection=None,
    )

    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(loaded_pipette=load_pipette_update),
            command=_dummy_command(),
        )
    )

    assert (
        PipetteView(subject.state).get_tip_rack_well_picked_up_from("pipette-id")
        is None
    )

    tip_picked_up_update = update_types.PipetteTipStateUpdate(
        pipette_id="pipette-id",
        tip_geometry=TipGeometry(length=1, diameter=2, volume=3),
        tip_source=LabwareWellId(
            labware_id="my-cool-labware", well_name="less-cool-well"
        ),
    )

    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(
                pipette_tip_state=tip_picked_up_update
            ),
            command=_dummy_command(),
        )
    )

    assert PipetteView(subject.state).get_tip_rack_well_picked_up_from(
        "pipette-id"
    ) == LabwareWellId(labware_id="my-cool-labware", well_name="less-cool-well")

    tip_dropped_update = update_types.PipetteTipStateUpdate(
        pipette_id="pipette-id", tip_geometry=None, tip_source=None
    )

    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(pipette_tip_state=tip_dropped_update),
            command=_dummy_command(),
        )
    )

    assert (
        PipetteView(subject.state).get_tip_rack_well_picked_up_from("pipette-id")
        is None
    )
