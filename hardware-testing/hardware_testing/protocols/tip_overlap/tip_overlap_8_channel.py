"""Protocol to test tip overlap in the 8 channel."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.types import Point
from opentrons.config import IS_ROBOT
from typing import List, Dict, Optional
import csv
import time
import os

from opentrons.protocol_api.core.engine import (
    pipette_movement_conflict,
)
from opentrons.protocol_api._nozzle_layout import NozzleLayout

metadata = {"protocolName": "test overlap 2 - multi"}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

if IS_ROBOT:
    from hardware_testing.drivers.mitutoyo_digimatic_indicator import find_dial
    from hardware_testing.gravimetric import helpers


def add_parameters(parameters: ParameterContext) -> None:
    """Add the rtp."""
    parameters.add_int(
        display_name="Trials",
        variable_name="trials",
        minimum=1,
        maximum=12,
        default=10,
        description="Number of trials to run",
    )
    parameters.add_str(
        display_name="Pipette volume",
        variable_name="pipette_volume",
        default="1000",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "1000",
                "50",
            ]
        ],
        description="P1000 or P50",
    )
    parameters.add_str(
        display_name="Layout Style",
        variable_name="layout",
        default="Full",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "SingleA1",
                "SingleH1",
                "H1toG1",
                "H1toF1",
                "H1toE1",
                "H1toD1",
                "H1toC1",
                "H1toB1",
                "Full",
            ]
        ],
        description="Which layout to test",
    )

    parameters.add_str(
        display_name="Tip Type",
        variable_name="tip_type",
        default="tiprack_50ul",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "tiprack_20ul",
                "filtertiprack_20ul",
                "tiprack_50ul",
                "filtertiprack_50ul",
                "tiprack_200ul",
                "filtertiprack_200ul",
                "tiprack_1000ul",
                "filtertiprack_1000ul",
            ]
        ],
        description="Which tip type to test",
    )
    parameters.add_bool(
        display_name="Return Tip",
        variable_name="return_tip",
        default=True,
        description="Return tips or drop tips",
    )


LAYOUT_TO_NOZZLES: Dict[str, List[int]] = {
    "SingleA1": [0],
    "SingleH1": [7],
    "H1toG1": [6, 7],
    "H1toF1": [5, 6, 7],
    "H1toE1": [4, 5, 6, 7],
    "H1toD1": [3, 4, 5, 6, 7],
    "H1toC1": [2, 3, 4, 5, 6, 7],
    "H1toB1": [1, 2, 3, 4, 5, 6, 7],
    "Full": [0, 1, 2, 3, 4, 5, 6, 7],
}

LAYOUT_TO_STYLE: Dict[str, NozzleLayout] = {
    "SingleA1": NozzleLayout.SINGLE,
    "SingleH1": NozzleLayout.SINGLE,
    "H1toG1": NozzleLayout.PARTIAL_COLUMN,
    "H1toF1": NozzleLayout.PARTIAL_COLUMN,
    "H1toE1": NozzleLayout.PARTIAL_COLUMN,
    "H1toD1": NozzleLayout.PARTIAL_COLUMN,
    "H1toC1": NozzleLayout.PARTIAL_COLUMN,
    "H1toB1": NozzleLayout.PARTIAL_COLUMN,
    "Full": NozzleLayout.ALL,
}

LAYOUT_TO_START: Dict[str, Optional[str]] = {
    "SingleA1": "A1",
    "SingleH1": "H1",
    "H1toG1": "H1",
    "H1toF1": "H1",
    "H1toE1": "H1",
    "H1toD1": "H1",
    "H1toC1": "H1",
    "H1toB1": "H1",
    "Full": None,
}
LAYOUT_TO_END: Dict[str, Optional[str]] = {
    "SingleA1": "A1",
    "SingleH1": "H1",
    "H1toG1": "G1",
    "H1toF1": "F1",
    "H1toE1": "E1",
    "H1toD1": "D1",
    "H1toC1": "C1",
    "H1toB1": "B1",
    "Full": None,
}


def offset_for_channel(channel: int, layout: str) -> Point:
    """Get the y offset for each nozzle."""
    if layout in ["SingleA1", "Full"]:
        # channel 0 is the critical point
        return Point(x=0, y=channel * 9, z=0)
    else:
        # channel 7 is the critical point
        return Point(x=0, y=(channel - 7) * 9.0, z=0)


def run(ctx: ProtocolContext) -> None:
    """Run."""
    dial = None
    if IS_ROBOT and not ctx.is_simulating():
        dial = find_dial()
        assert dial is not None, "could not find dial"
    ctx.load_trash_bin("A3")
    tiprack1 = ctx.load_labware(f"opentrons_flex_96_{ctx.params.tip_type}", "C2")  # type: ignore [attr-defined]
    pipette = ctx.load_instrument(
        f"flex_8channel_{ctx.params.pipette_volume}", "left", tip_racks=[tiprack1]  # type: ignore [attr-defined]
    )
    test_labware = ctx.load_labware("dial_indicator", "C3")
    if IS_ROBOT:
        pipette_movement_conflict.check_safe_for_pipette_movement = (
            helpers._override_check_safe_for_pipette_movement
        )
    well = test_labware["A1"]
    nozzle_results: List[float] = [i * 0.0 for i in range(8)]
    for channel in range(8):
        pipette.move_to(
            well.top().move(offset_for_channel(channel, "Full")).move(Point(0, 0, 5))  # type: ignore [attr-defined]
        )
        pipette.move_to(
            well.top().move(offset_for_channel(channel, "Full"))  # type: ignore [attr-defined]
        )
        if IS_ROBOT and not ctx.is_simulating():
            nozzle_results[channel] = dial.read_stable()  # type: ignore [union-attr]
        pipette.move_to(
            well.top().move(offset_for_channel(channel, "Full")).move(Point(0, 0, 5))  # type: ignore [attr-defined]
        )
    results = {i: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] for i in range(ctx.params.trials)}  # type: ignore [attr-defined]
    for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
        pipette.configure_nozzle_layout(
            style=LAYOUT_TO_STYLE[ctx.params.layout],  # type: ignore [attr-defined]
            start=LAYOUT_TO_START[ctx.params.layout],  # type: ignore [attr-defined]
            end=LAYOUT_TO_END[ctx.params.layout],  # type: ignore [attr-defined]
            tip_racks=[tiprack1],
        )
        pipette.pick_up_tip()
        for channel in LAYOUT_TO_NOZZLES[ctx.params.layout]:  # type: ignore [attr-defined]
            pipette.move_to(
                well.top().move(offset_for_channel(channel, ctx.params.layout)).move(Point(0, 0, 5))  # type: ignore [attr-defined]
            )
            pipette.move_to(
                well.top().move(offset_for_channel(channel, ctx.params.layout))  # type: ignore [attr-defined]
            )
            if IS_ROBOT and not ctx.is_simulating():
                results[trial][channel] = nozzle_results[channel] - dial.read_stable()  # type: ignore [union-attr]
            pipette.move_to(
                well.top().move(offset_for_channel(channel, ctx.params.layout)).move(Point(0, 0, 5))  # type: ignore [attr-defined]
            )
        if ctx.params.return_tip:  # type: ignore [attr-defined]
            pipette.return_tip()
        else:
            pipette.drop_tip()

    ctx.comment(str(results))
    if IS_ROBOT and not ctx.is_simulating():
        dial.disconnect()  # type: ignore [union-attr]
        formatted_time = time.strftime("%Y-%m-%d:%H:%M:%S", time.localtime(time.time()))
        test_name = f"overlap-P{ctx.params.pipette_volume}M-{ctx.params.layout}-{formatted_time}"  # type: ignore [attr-defined]
        filename = f"/data/testing_data/overlap/{test_name}.csv"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "Trial",
                    "Nozzle 1",
                    "Nozzle 2",
                    "Nozzle 3",
                    "Nozzle 4",
                    "Nozzle 5",
                    "Nozzle 6",
                    "Nozzle 7",
                    "Nozzle 8",
                ]
            )
            writer.writerow(["bare_nozzles"] + nozzle_results)
            for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
                writer.writerow([trial] + results[trial])
