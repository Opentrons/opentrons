"""Protocol to test tip overlap in the 8 channel."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from opentrons.types import Point
from opentrons.config import IS_ROBOT
import csv
import time
import os


metadata = {"protocolName": "test overlap 2 - single"}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

if IS_ROBOT:
    from hardware_testing.drivers.mitutoyo_digimatic_indicator import find_dial


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


def run(ctx: ProtocolContext) -> None:
    """Run."""
    dial = None
    if IS_ROBOT and not ctx.is_simulating():
        dial = find_dial()
        assert dial is not None, "could not find dial"
    ctx.load_trash_bin("A3")
    tiprack1 = ctx.load_labware(f"opentrons_flex_96_{ctx.params.tip_type}", "C2")  # type: ignore [attr-defined]
    pipette = ctx.load_instrument(
        f"flex_1channel_{ctx.params.pipette_volume}", "left", tip_racks=[tiprack1]  # type: ignore [attr-defined]
    )
    test_labware = ctx.load_labware("dial_indicator", "C3")

    well = test_labware["A1"]
    nozzle_result: float = 0.0
    pipette.move_to(well.top().move(Point(0, 0, 5)))
    pipette.move_to(well.top())
    if IS_ROBOT and not ctx.is_simulating():
        nozzle_result = dial.read_stable()  # type: ignore [union-attr]
    pipette.move_to(well.top().move(Point(0, 0, 5)))
    results = {i: 0.0 for i in range(ctx.params.trials)}  # type: ignore [attr-defined]
    for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
        pipette.pick_up_tip()
        pipette.move_to(well.top().move(Point(0, 0, 5)))
        pipette.move_to(well.top())
        pipette.move_to(well.top().move(Point(0, 0, 5)))
        if IS_ROBOT and not ctx.is_simulating():
            results[trial] = nozzle_result - dial.read_stable()  # type: ignore [union-attr]
        if ctx.params.return_tip:  # type: ignore [attr-defined]
            pipette.return_tip()
        else:
            pipette.drop_tip()

    ctx.comment(str(results))
    if IS_ROBOT and not ctx.is_simulating():
        dial.disconnect()  # type: ignore [union-attr]
        formatted_time = time.strftime("%Y-%m-%d:%H:%M:%S", time.localtime(time.time()))
        test_name = f"overlap-P{ctx.params.pipette_volume}S-{formatted_time}"  # type: ignore [attr-defined]
        filename = f"/data/testing_data/overlap/{test_name}.csv"
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "Trial",
                    "Nozzle 1",
                ]
            )
            writer.writerow(["bare_nozzle", nozzle_result])
            for trial in range(ctx.params.trials):  # type: ignore [attr-defined]
                writer.writerow([trial, results[trial]])
