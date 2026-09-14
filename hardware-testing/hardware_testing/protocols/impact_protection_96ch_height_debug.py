"""Debug the selectable sensor heights on the 96-channel impact fixture."""

import re
from typing import Any, Dict, List, Tuple

from opentrons.protocol_api import ParameterContext, ProtocolContext


metadata = {"protocolName": "96ch Impact Sensor Height Debug"}
requirements = {"robotType": "Flex", "apiLevel": "2.21"}


HEIGHTS: Tuple[str, ...] = ("P20", "P200", "P1000")
SETTER_BY_HEIGHT: Dict[str, str] = {
    "P20": "set_left_p20",
    "P200": "set_left_p200",
    "P1000": "set_left_p1000",
}
EXPECTED_STATE_BY_HEIGHT: Dict[str, Tuple[str, ...]] = {
    "P20": ("P20",),
    # The fixture firmware may report P50 for its shared P50/P200 position.
    "P200": ("P50", "P200"),
    "P1000": ("P1000",),
}


def add_parameters(parameters: ParameterContext) -> None:
    """Define controls for selecting and inspecting fixture heights."""
    parameters.add_str(
        display_name="Sensor Height",
        variable_name="sensor_height",
        default="ALL",
        choices=[
            {"display_name": "All heights", "value": "ALL"},
            {"display_name": "P20", "value": "P20"},
            {"display_name": "P200 / P50", "value": "P200"},
            {"display_name": "P1000", "value": "P1000"},
        ],
        description="Select one sensor height or inspect all three in order.",
    )
    parameters.add_int(
        display_name="Cycles",
        variable_name="cycles",
        default=1,
        minimum=1,
        maximum=100,
        description="Number of times to repeat the selected height sequence.",
    )
    parameters.add_int(
        display_name="Position Settle Time",
        variable_name="settle_seconds",
        default=15,
        minimum=1,
        maximum=60,
        unit="seconds",
        description="Time allowed for the fixture to reach a new height.",
    )
    parameters.add_bool(
        display_name="Pause At Each Height",
        variable_name="pause_at_each_height",
        default=True,
        description="Pause after each move so the sensor height can be adjusted.",
    )
    parameters.add_bool(
        display_name="Home Between Heights",
        variable_name="home_between_heights",
        default=False,
        description="Return home before every move to test positioning repeatability.",
    )
    parameters.add_bool(
        display_name="Return Home When Finished",
        variable_name="return_home",
        default=True,
        description="Return the fixture to its home position before disconnecting.",
    )


def _require_ok(action: str, response: str) -> None:
    if "OK" not in response.upper():
        raise RuntimeError(f"96ch impact fixture {action} failed: {response!r}")


def _home(ctx: ProtocolContext, fixture: Any) -> None:
    state = fixture.home()
    ctx.comment(f"Fixture home response: {state.raw_response}")
    _require_ok("home", state.raw_response)


def _move_to_height(
    ctx: ProtocolContext,
    fixture: Any,
    height: str,
    settle_seconds: int,
) -> None:
    setter_name = SETTER_BY_HEIGHT[height]
    state = getattr(fixture, setter_name)()
    ctx.comment(
        f"Height command: target={height}, command={setter_name}, "
        f"response={state.raw_response}"
    )
    _require_ok(f"move to {height}", state.raw_response)

    if "OK_ALREADY" not in state.raw_response.upper():
        ctx.delay(
            seconds=settle_seconds,
            msg=f"Waiting for the fixture to reach the {height} sensor height.",
        )

    reported = fixture.get_pipette().raw_response
    ctx.comment(f"Height query: target={height}, response={reported}")
    reported_positions = set(
        re.findall(r"\bP(?:1000|200|50|20)\b", reported.upper())
    )
    if reported_positions.isdisjoint(EXPECTED_STATE_BY_HEIGHT[height]):
        expected = "/".join(EXPECTED_STATE_BY_HEIGHT[height])
        raise RuntimeError(
            f"96ch impact fixture did not report {expected} after moving to "
            f"{height}: {reported!r}"
        )


def _selected_heights(sensor_height: str) -> List[str]:
    if sensor_height == "ALL":
        return list(HEIGHTS)
    if sensor_height not in SETTER_BY_HEIGHT:
        raise ValueError(f"Unsupported sensor height: {sensor_height}")
    return [sensor_height]


def run(ctx: ProtocolContext) -> None:
    """Move the fixture through selected heights for measurement or adjustment."""
    sensor_height = ctx.params.sensor_height  # type: ignore[attr-defined]
    cycles = ctx.params.cycles  # type: ignore[attr-defined]
    settle_seconds = ctx.params.settle_seconds  # type: ignore[attr-defined]
    pause_at_height = ctx.params.pause_at_each_height  # type: ignore[attr-defined]
    home_between = ctx.params.home_between_heights  # type: ignore[attr-defined]
    return_home = ctx.params.return_home  # type: ignore[attr-defined]
    heights = _selected_heights(sensor_height)

    ctx.comment(
        "96ch impact sensor height debug: "
        f"heights={','.join(heights)}, cycles={cycles}, "
        f"settle_seconds={settle_seconds}"
    )

    # App analysis does not have access to the robot's serial fixture. Keep the
    # analysis path deterministic while reporting the sequence it will run.
    if ctx.is_simulating():
        for cycle in range(1, cycles + 1):
            for height in heights:
                ctx.comment(f"Simulation: cycle {cycle}/{cycles}, height={height}")
        return

    from hardware_testing.drivers.ImpactProtection_96ch import (
        BuildImpactProtection96ch,
    )

    fixture = BuildImpactProtection96ch(simulate=False, ctx=ctx)
    completed = False
    try:
        version = fixture.get_version()
        ctx.comment(f"Connected to 96ch impact fixture: {version}")
        _home(ctx, fixture)

        move_number = 0
        total_moves = cycles * len(heights)
        for cycle in range(1, cycles + 1):
            for height in heights:
                if home_between and move_number > 0:
                    _home(ctx, fixture)

                move_number += 1
                ctx.comment(
                    f"Height check {move_number}/{total_moves}: "
                    f"cycle={cycle}/{cycles}, target={height}"
                )
                _move_to_height(ctx, fixture, height, settle_seconds)

                if pause_at_height:
                    ctx.pause(
                        f"Fixture is at the {height} sensor height. Measure or "
                        "adjust the sensor, then resume the protocol."
                    )
        completed = True
    finally:
        try:
            if return_home:
                try:
                    _home(ctx, fixture)
                except Exception as error:
                    if completed:
                        raise
                    ctx.comment(f"Cleanup home failed after protocol error: {error}")
        finally:
            try:
                fixture.close()
            except Exception as error:
                ctx.comment(f"Failed to close 96ch impact fixture serial port: {error}")
