"""Idle reliability test for the 96-channel impact protection fixture."""

from opentrons.protocol_api import ParameterContext, ProtocolContext

from hardware_testing.drivers import ImpactProtection_96ch as ImpactProtection96ch

metadata = {"protocolName": "96ch Impact Protection Idle Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}

IDLE_SECONDS = [30, 180, 300, 600]
PIPETTE_COMMANDS = {
    "P20": "set_left_p20",
    "P200": "set_left_p200",
    "P1000": "set_left_p1000",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters."""
    parameters.add_str(
        display_name="Initial Pipette Position",
        variable_name="initial_pipette_position",
        default="P200",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "P20",
                "P200",
                "P1000",
            ]
        ],
        description="Set this 96ch fixture position before the idle checks.",
    )


def _log(ctx: ProtocolContext, message: str) -> None:
    print(message)
    ctx.delay(seconds=0.1, msg=message)


def _get_pipette(ctx: ProtocolContext, impact, label: str) -> None:
    _log(ctx, f"{label}: get_pipette start")
    state = impact.get_pipette()
    _log(ctx, f"{label}: get_pipette response={state.raw_response}")


def run(ctx: ProtocolContext) -> None:
    """Connect once, then verify the fixture still responds after idle periods."""
    simulating = ctx.is_simulating()
    initial_position = str(ctx.params.initial_pipette_position)  # type: ignore[attr-defined]
    if simulating:
        _log(ctx, "simulating: skip 96ch impact protection fixture connection")
        return

    _log(ctx, "connecting 96ch impact protection fixture")
    impact, port = ImpactProtection96ch.BuildImpactProtection96chWithPort(
        simulate=simulating,
        ctx=ctx,
    )
    _log(ctx, f"connected 96ch impact protection fixture port={port}")

    try:
        _get_pipette(ctx, impact, "before_initial_set")
        _log(ctx, f"setting initial pipette position={initial_position}")
        set_result = getattr(impact, PIPETTE_COMMANDS[initial_position])()
        _log(ctx, f"initial set response={set_result.raw_response}")
        ctx.delay(seconds=15, msg=f"waiting for {initial_position} position")
        _get_pipette(ctx, impact, "after_initial_set")
        for idle_s in IDLE_SECONDS:
            ctx.delay(seconds=idle_s, msg=f"idle wait {idle_s}s")
            _get_pipette(ctx, impact, f"after_idle_{idle_s}s")
        _log(ctx, "idle reliability test complete")
    finally:
        impact.close()
        _log(ctx, "96ch impact protection fixture closed")
