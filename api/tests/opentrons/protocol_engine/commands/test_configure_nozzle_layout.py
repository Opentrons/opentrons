"""Test configure nozzle layout commands."""

from collections import OrderedDict
from typing import Dict, Union

import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.pipette_definition import (
    AvailableSensorDefinition,
    ValidNozzleMaps,
)
from opentrons_shared_data.pipette.types import (
    LiquidClasses as VolumeModes,
)
from opentrons_shared_data.pipette.types import (
    PipetteNameType,
)

import opentrons.protocol_engine.state.update_types as update_types
from ..pipette_fixtures import (
    NINETY_SIX_COLS,
    NINETY_SIX_MAP,
    NINETY_SIX_ROWS,
    get_default_nozzle_map,
)
from opentrons.hardware_control.nozzle_manager import NozzleMap
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.configure_nozzle_layout import (
    ConfigureNozzleLayoutImplementation,
    ConfigureNozzleLayoutParams,
    ConfigureNozzleLayoutResult,
)
from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    LoadedConfigureNozzleLayoutData,
    TipHandler,
)
from opentrons.protocol_engine.resources.pipette_data_provider import (
    LoadedStaticPipetteData,
)
from opentrons.protocol_engine.state.update_types import (
    PipetteNozzleMapUpdate,
    StateUpdate,
)
from opentrons.protocol_engine.types import (
    AllNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    FlowRates,
    QuadrantNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
)
from opentrons.types import Point


@pytest.fixture
def available_sensors() -> AvailableSensorDefinition:
    """Provide a list of sensors."""
    return AvailableSensorDefinition(sensors=["pressure", "capacitive", "environment"])


@pytest.mark.parametrize(
    argnames=["request_model", "expected_nozzlemap", "nozzle_params"],
    argvalues=[
        [
            SingleNozzleLayoutConfiguration(primaryNozzle="A1"),
            NozzleMap.build(
                physical_nozzles=OrderedDict({"A1": Point(0, 0, 0)}),
                physical_rows=OrderedDict({"A": ["A1"]}),
                physical_columns=OrderedDict({"1": ["A1"]}),
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="A1",
                valid_nozzle_maps=ValidNozzleMaps(maps={"A1": ["A1"]}),
            ),
            {"primary_nozzle": "A1"},
        ],
        [
            ColumnNozzleLayoutConfiguration(primaryNozzle="A1"),
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="H1",
                valid_nozzle_maps=ValidNozzleMaps(
                    maps={"Column1": NINETY_SIX_COLS["1"]}
                ),
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "H1"},
        ],
        [
            QuadrantNozzleLayoutConfiguration(
                primaryNozzle="A1", frontRightNozzle="E1", backLeftNozzle="A1"
            ),
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="E1",
                valid_nozzle_maps=ValidNozzleMaps(
                    maps={"A1_E1": ["A1", "B1", "C1", "D1", "E1"]}
                ),
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "E1"},
        ],
    ],
)
async def test_configure_nozzle_layout_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    tip_handler: TipHandler,
    available_sensors: AvailableSensorDefinition,
    request_model: Union[
        AllNozzleLayoutConfiguration,
        ColumnNozzleLayoutConfiguration,
        QuadrantNozzleLayoutConfiguration,
        SingleNozzleLayoutConfiguration,
    ],
    expected_nozzlemap: NozzleMap,
    nozzle_params: Dict[str, str],
) -> None:
    """A ConfigureForVolume command should have an execution implementation."""
    subject = ConfigureNozzleLayoutImplementation(
        equipment=equipment, tip_handler=tip_handler
    )

    config = LoadedStaticPipetteData(
        model="some-model",
        display_name="Hello",
        min_volume=0,
        max_volume=251,
        channels=8,
        home_position=123.1,
        nozzle_offset_z=331.0,
        flow_rates=FlowRates(
            default_aspirate={}, default_dispense={}, default_blow_out={}
        ),
        tip_configuration_lookup_table={},
        nominal_tip_overlap={},
        nozzle_map=get_default_nozzle_map(PipetteNameType.P300_MULTI),
        back_left_corner_offset=Point(10, 20, 30),
        front_right_corner_offset=Point(40, 50, 60),
        pipette_lld_settings={},
        plunger_positions={
            "top": 0.0,
            "bottom": 5.0,
            "blow_out": 19.0,
            "drop_tip": 20.0,
        },
        shaft_ul_per_mm=5.0,
        available_sensors=available_sensors,
        volume_mode=VolumeModes.lowVolumeDefault,
        available_volume_modes_min_vol={},
    )

    requested_nozzle_layout = ConfigureNozzleLayoutParams(
        pipetteId="pipette-id",
        configurationParams=request_model,
    )
    primary_nozzle = (
        None
        if isinstance(request_model, AllNozzleLayoutConfiguration)
        else request_model.primaryNozzle
    )
    front_right_nozzle = (
        request_model.frontRightNozzle
        if isinstance(request_model, QuadrantNozzleLayoutConfiguration)
        else None
    )
    back_left_nozzle = (
        request_model.backLeftNozzle
        if isinstance(request_model, QuadrantNozzleLayoutConfiguration)
        else None
    )

    decoy.when(
        await tip_handler.available_for_nozzle_layout(
            pipette_id="pipette-id",
            style=request_model.style,
            primary_nozzle=primary_nozzle,
            front_right_nozzle=front_right_nozzle,
            back_left_nozzle=back_left_nozzle,
        )
    ).then_return(nozzle_params)

    decoy.when(
        await equipment.configure_nozzle_layout(
            pipette_id="pipette-id",
            **nozzle_params,
        )
    ).then_return(
        LoadedConfigureNozzleLayoutData(
            pipette_id="pipette-id",
            serial_number="some number",
            nozzle_map=expected_nozzlemap,
            static_config=config,
        )
    )

    result = await subject.execute(requested_nozzle_layout)

    assert result == SuccessData(
        public=ConfigureNozzleLayoutResult(),
        state_update=StateUpdate(
            pipette_nozzle_map=PipetteNozzleMapUpdate(
                pipette_id="pipette-id",
                nozzle_map=expected_nozzlemap,
            ),
            pipette_config=update_types.PipetteConfigUpdate(
                pipette_id="pipette-id", serial_number="some number", config=config
            ),
        ),
    )
