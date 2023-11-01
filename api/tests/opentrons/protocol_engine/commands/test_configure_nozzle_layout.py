"""Test configure nozzle layout commands."""
import pytest
from decoy import Decoy
from typing import Union, Optional, Dict

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
    EmptyNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
)


NINETY_SIX_MAP = {
    "A1": Point(-36.0, -25.5, -259.15),
    "A2": Point(-27.0, -25.5, -259.15),
    "A3": Point(-18.0, -25.5, -259.15),
    "A4": Point(-9.0, -25.5, -259.15),
    "A5": Point(0.0, -25.5, -259.15),
    "A6": Point(9.0, -25.5, -259.15),
    "A7": Point(18.0, -25.5, -259.15),
    "A8": Point(27.0, -25.5, -259.15),
    "A9": Point(36.0, -25.5, -259.15),
    "A10": Point(45.0, -25.5, -259.15),
    "A11": Point(54.0, -25.5, -259.15),
    "A12": Point(63.0, -25.5, -259.15),
    "B1": Point(-36.0, -34.5, -259.15),
    "B2": Point(-27.0, -34.5, -259.15),
    "B3": Point(-18.0, -34.5, -259.15),
    "B4": Point(-9.0, -34.5, -259.15),
    "B5": Point(0.0, -34.5, -259.15),
    "B6": Point(9.0, -34.5, -259.15),
    "B7": Point(18.0, -34.5, -259.15),
    "B8": Point(27.0, -34.5, -259.15),
    "B9": Point(36.0, -34.5, -259.15),
    "B10": Point(45.0, -34.5, -259.15),
    "B11": Point(54.0, -34.5, -259.15),
    "B12": Point(63.0, -34.5, -259.15),
    "C1": Point(-36.0, -43.5, -259.15),
    "C2": Point(-27.0, -43.5, -259.15),
    "C3": Point(-18.0, -43.5, -259.15),
    "C4": Point(-9.0, -43.5, -259.15),
    "C5": Point(0.0, -43.5, -259.15),
    "C6": Point(9.0, -43.5, -259.15),
    "C7": Point(18.0, -43.5, -259.15),
    "C8": Point(27.0, -43.5, -259.15),
    "C9": Point(36.0, -43.5, -259.15),
    "C10": Point(45.0, -43.5, -259.15),
    "C11": Point(54.0, -43.5, -259.15),
    "C12": Point(63.0, -43.5, -259.15),
    "D1": Point(-36.0, -52.5, -259.15),
    "D2": Point(-27.0, -52.5, -259.15),
    "D3": Point(-18.0, -52.5, -259.15),
    "D4": Point(-9.0, -52.5, -259.15),
    "D5": Point(0.0, -52.5, -259.15),
    "D6": Point(9.0, -52.5, -259.15),
    "D7": Point(18.0, -52.5, -259.15),
    "D8": Point(27.0, -52.5, -259.15),
    "D9": Point(36.0, -52.5, -259.15),
    "D10": Point(45.0, -52.5, -259.15),
    "D11": Point(54.0, -52.5, -259.15),
    "D12": Point(63.0, -52.5, -259.15),
    "E1": Point(-36.0, -61.5, -259.15),
    "E2": Point(-27.0, -61.5, -259.15),
    "E3": Point(-18.0, -61.5, -259.15),
    "E4": Point(-9.0, -61.5, -259.15),
    "E5": Point(0.0, -61.5, -259.15),
    "E6": Point(9.0, -61.5, -259.15),
    "E7": Point(18.0, -61.5, -259.15),
    "E8": Point(27.0, -61.5, -259.15),
    "E9": Point(36.0, -61.5, -259.15),
    "E10": Point(45.0, -61.5, -259.15),
    "E11": Point(54.0, -61.5, -259.15),
    "E12": Point(63.0, -61.5, -259.15),
    "F1": Point(-36.0, -70.5, -259.15),
    "F2": Point(-27.0, -70.5, -259.15),
    "F3": Point(-18.0, -70.5, -259.15),
    "F4": Point(-9.0, -70.5, -259.15),
    "F5": Point(0.0, -70.5, -259.15),
    "F6": Point(9.0, -70.5, -259.15),
    "F7": Point(18.0, -70.5, -259.15),
    "F8": Point(27.0, -70.5, -259.15),
    "F9": Point(36.0, -70.5, -259.15),
    "F10": Point(45.0, -70.5, -259.15),
    "F11": Point(54.0, -70.5, -259.15),
    "F12": Point(63.0, -70.5, -259.15),
    "G1": Point(-36.0, -79.5, -259.15),
    "G2": Point(-27.0, -79.5, -259.15),
    "G3": Point(-18.0, -79.5, -259.15),
    "G4": Point(-9.0, -79.5, -259.15),
    "G5": Point(0.0, -79.5, -259.15),
    "G6": Point(9.0, -79.5, -259.15),
    "G7": Point(18.0, -79.5, -259.15),
    "G8": Point(27.0, -79.5, -259.15),
    "G9": Point(36.0, -79.5, -259.15),
    "G10": Point(45.0, -79.5, -259.15),
    "G11": Point(54.0, -79.5, -259.15),
    "G12": Point(63.0, -79.5, -259.15),
    "H1": Point(-36.0, -88.5, -259.15),
    "H2": Point(-27.0, -88.5, -259.15),
    "H3": Point(-18.0, -88.5, -259.15),
    "H4": Point(-9.0, -88.5, -259.15),
    "H5": Point(0.0, -88.5, -259.15),
    "H6": Point(9.0, -88.5, -259.15),
    "H7": Point(18.0, -88.5, -259.15),
    "H8": Point(27.0, -88.5, -259.15),
    "H9": Point(36.0, -88.5, -259.15),
    "H10": Point(45.0, -88.5, -259.15),
    "H11": Point(54.0, -88.5, -259.15),
    "H12": Point(63.0, -88.5, -259.15),
}


@pytest.mark.parametrize(
    argnames=["request_model", "expected_nozzlemap", "nozzle_params"],
    argvalues=[
        [
            SingleNozzleLayoutConfiguration(primary_nozzle="A1"),
            NozzleMap.build(
                physical_nozzle_map={"A1": Point(0, 0, 0)},
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="A1",
            ),
            {"primary_nozzle": "A1"},
        ],
        [
            ColumnNozzleLayoutConfiguration(primary_nozzle="A1"),
            NozzleMap.build(
                physical_nozzle_map=NINETY_SIX_MAP,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="H1",
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "H1"},
        ],
        [
            QuadrantNozzleLayoutConfiguration(
                primary_nozzle="A1", front_right_nozzle="E1"
            ),
            NozzleMap.build(
                physical_nozzle_map=NINETY_SIX_MAP,
                starting_nozzle="A1",
                back_left_nozzle="A1",
                front_right_nozzle="E1",
            ),
            {"primary_nozzle": "A1", "front_right_nozzle": "E1"},
        ],
        [
            EmptyNozzleLayoutConfiguration(),
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
        EmptyNozzleLayoutConfiguration,
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
        configuration_params=request_model,
    )

    decoy.when(
        await tip_handler.available_for_nozzle_layout(
            "pipette-id", **request_model.dict()
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
        pipette_id="pipette-id", nozzle_map=expected_nozzlemap
    )
