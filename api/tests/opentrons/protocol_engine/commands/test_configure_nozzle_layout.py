"""Test configure nozzle layout commands."""
import pytest
from decoy import Decoy
from typing import Union, Optional, Dict
from collections import OrderedDict

from opentrons.protocol_engine.execution import (
    EquipmentHandler,
    TipHandler,
)
from opentrons.types import Point
from opentrons.hardware_control.nozzle_manager import NozzleMap


from opentrons.protocol_engine.commands.configure_nozzle_layout import (
    ConfigureNozzleLayoutParams,
    ConfigureNozzleLayoutResult,
    ConfigureNozzleLayoutPrivateResult,
    ConfigureNozzleLayoutImplementation,
)

from opentrons.protocol_engine.types import (
    AllNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
)
from ..pipette_fixtures import (
    NINETY_SIX_MAP,
    NINETY_SIX_COLS,
    NINETY_SIX_ROWS,
)


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
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "H1"},
        ],
        [
            QuadrantNozzleLayoutConfiguration(
                primaryNozzle="A1", frontRightNozzle="E1"
            ),
            NozzleMap.build(
                physical_nozzles=NINETY_SIX_MAP,
                physical_rows=NINETY_SIX_ROWS,
                physical_columns=NINETY_SIX_COLS,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="E1",
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "E1"},
        ],
        [
            AllNozzleLayoutConfiguration(),
            None,
            {},
        ],
    ],
)
async def test_configure_nozzle_layout_implementation(
    decoy: Decoy,
    equipment: EquipmentHandler,
    tip_handler: TipHandler,
    request_model: Union[
        AllNozzleLayoutConfiguration,
        ColumnNozzleLayoutConfiguration,
        QuadrantNozzleLayoutConfiguration,
        SingleNozzleLayoutConfiguration,
    ],
    expected_nozzlemap: Optional[NozzleMap],
    nozzle_params: Dict[str, str],
) -> None:
    """A ConfigureForVolume command should have an execution implementation."""
    subject = ConfigureNozzleLayoutImplementation(
        equipment=equipment, tip_handler=tip_handler
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

    decoy.when(
        await tip_handler.available_for_nozzle_layout(
            pipette_id="pipette-id",
            style=request_model.style,
            primary_nozzle=primary_nozzle,
            front_right_nozzle=front_right_nozzle,
        )
    ).then_return(nozzle_params)

    decoy.when(
        await equipment.configure_nozzle_layout(
            pipette_id="pipette-id",
            **nozzle_params,
        )
    ).then_return(expected_nozzlemap)

    result, private_result = await subject.execute(requested_nozzle_layout)

    assert result == ConfigureNozzleLayoutResult()
    assert private_result == ConfigureNozzleLayoutPrivateResult(
        pipette_id="pipette-id",
        nozzle_map=expected_nozzlemap,
    )
