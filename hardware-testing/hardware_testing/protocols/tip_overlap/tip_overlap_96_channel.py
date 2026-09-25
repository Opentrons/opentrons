"""Protocol to test tip overlap in the 96 channel."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.types import Point
from opentrons.config import IS_ROBOT
from typing import List, Dict, Optional
import csv
import time
import os
from math import floor

from opentrons.protocol_api.core.engine import (
    pipette_movement_conflict,
)
from opentrons.protocol_api._nozzle_layout import NozzleLayout

metadata = {"protocolName": "test overlap 2 - 96"}

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
                "200",
            ]
        ],
        description="P1000 or 200",
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
                "SingleA12",
                "SingleH12",
                "Column1",
                "Column12",
                "RowA",
                "RowH",
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
    "SingleH1": [84],
    "SingleA12": [11],
    "SingleH12": [95],
    "Column1": [0, 12, 24, 36, 48, 60, 72, 84],
    "Column12": [11, 23, 35, 47, 59, 71, 83, 95],
    "RowA": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "RowH": [84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95],
    "Full": [i for i in range(96)],
}

LAYOUT_TO_STYLE: Dict[str, NozzleLayout] = {
    "SingleA1": NozzleLayout.SINGLE,
    "SingleH1": NozzleLayout.SINGLE,
    "SingleA12": NozzleLayout.SINGLE,
    "SingleH12": NozzleLayout.SINGLE,
    "Column1": NozzleLayout.COLUMN,
    "Column12": NozzleLayout.COLUMN,
    "RowA": NozzleLayout.ROW,
    "RowH": NozzleLayout.ROW,
    "Full": NozzleLayout.ALL,
}

LAYOUT_TO_START: Dict[str, Optional[str]] = {
    "SingleA1": "A1",
    "SingleH1": "H1",
    "SingleA12": "A12",
    "SingleH12": "H12",
    "Column1": "A1",
    "Column12": "A12",
    "RowA": "A1",
    "RowH": "H1",
    "Full": None,
}
LAYOUT_TO_END: Dict[str, Optional[str]] = {
    "SingleA1": None,
    "SingleH1": None,
    "SingleA12": None,
    "SingleH12": None,
    "Column1": None,
    "Column12": None,
    "RowA": None,
    "RowH": None,
    "Full": None,
}

LAYOUT_TO_RACK_SLOTS: Dict[str, List[str]] = {
    "SingleA1": ["C1"],
    "SingleH1": ["C1"],
    "SingleA12": ["C2"],
    "SingleH12": ["C2"],
    "Column1": ["C1"],
    "Column12": ["C2"],
    "RowA": ["A2", "C2"],
    "RowH": ["B2", "D2"],
    "Full": ["A1", "A2", "B1", "B2", "B3", "C1", "C2", "D1", "D2", "D3"],
}


def offset_for_channel(channel: int, layout: str) -> Point:
    """Get the y offset for each nozzle."""
    row = int(floor(channel / 12))
    column = channel % 12
    if layout in ["SingleA1", "SingleA12", "SingleH1", "SingleH12"]:
        return Point(0, 0, 0)
    elif layout in ["Column1", "RowA", "Full"]:
        # channel 0 is the critical point
        return Point(x=column * -9, y=row * 9, z=0)
    elif layout in ["Column12"]:
        # channel 11 is the critical point
        return Point(x=0, y=row * 9, z=0)
    elif layout in ["RowH"]:
        # channel 84 is the critical point
        return Point(x=column * -9, y=0, z=0)
    else:
        raise RuntimeError("unknown layout")


def run(ctx: ProtocolContext) -> None:
    """Run."""
    if ctx.params.return_tip and ctx.params.layout != "Full":  # type: ignore [attr-defined]
        raise RuntimeError("Don't use return tip with anything but full layout")
    dial = None
    if IS_ROBOT and not ctx.is_simulating():
        dial = find_dial()
        assert dial is not None, "could not find dial"
    ctx.load_trash_bin("A3")
    tipracks = []
    adapter: Optional[str] = None
    if ctx.params.layout == "Full":  # type: ignore [attr-defined]
        adapter = "opentrons_flex_96_tiprack_adapter"  # type: ignore [attr-defined]
    for slot in LAYOUT_TO_RACK_SLOTS[ctx.params.layout]:  # type: ignore [attr-defined]
        tipracks.append(ctx.load_labware(f"opentrons_flex_96_{ctx.params.tip_type}", slot, adapter=adapter))  # type: ignore [attr-defined]
    pipette = ctx.load_instrument(
        f"flex_96channel_{ctx.params.pipette_volume}", "left", tip_racks=tipracks  # type: ignore [attr-defined]
    )
    test_labware = ctx.load_labware("dial_indicator", "C3")
    if IS_ROBOT:
        pipette_movement_conflict.check_safe_for_pipette_movement = (
            helpers._override_check_safe_for_pipette_movement
        )
    well = test_labware["A1"]
    nozzle_results: List[float] = [i * 0.0 for i in range(96)]
    for channel in range(96):
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
    results = {i: [0.0 * y for y in range(96)] for i in range(ctx.params.trials)}  # type: ignore [attr-defined]
    for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
        pipette.configure_nozzle_layout(
            style=LAYOUT_TO_STYLE[ctx.params.layout],  # type: ignore [attr-defined]
            start=LAYOUT_TO_START[ctx.params.layout],  # type: ignore [attr-defined]
            end=LAYOUT_TO_END[ctx.params.layout],  # type: ignore [attr-defined]
            tip_racks=tipracks,
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
        test_name = f"overlap-P{ctx.params.pipette_volume}H-{ctx.params.layout}-{formatted_time}"  # type: ignore [attr-defined]
        filename = f"/data/testing_data/overlap/{test_name}.csv"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            writer = csv.writer(f)
            title_row = ["Trial"]
            title_row += [f"Nozzle {i+1}" for i in range(96)]
            writer.writerow(title_row)
            writer.writerow(["bare_nozzles"] + nozzle_results)
            for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
                writer.writerow([trial] + results[trial])
