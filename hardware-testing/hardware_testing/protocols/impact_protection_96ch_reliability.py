"""Reliability test for the 96-channel impact protection fixture."""

from opentrons.protocol_api import ParameterContext, ProtocolContext

from hardware_testing.drivers import ImpactProtection_96ch as ImpactProtection96ch

metadata = {"protocolName": "96ch Impact Protection Reliability Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}

DEFAULT_CYCLES = 100
REAL_MOVE_WAIT_SECONDS = 15
VIRTUAL_MOVE_WAIT_SECONDS = 0.1


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters."""
    parameters.add_bool(
        display_name="Virtual Fixture",
        variable_name="virtual_fixture",
        default=False,
        description="Run without connecting to the real 96ch impact fixture.",
    )
    parameters.add_int(
        display_name="Cycles",
        variable_name="cycles",
        default=DEFAULT_CYCLES,
        minimum=1,
        maximum=10000,
        description="Number of reliability test cycles to run.",
    )


def _log(ctx: ProtocolContext, message: str) -> None:
    print(message)
    ctx.delay(seconds=0.1, msg=message)


def _run_command(ctx: ProtocolContext, cycle: int, name: str, command) -> None:
    _log(ctx, f"cycle={cycle} command={name} start")
    result = command()
    _log(ctx, f"cycle={cycle} command={name} response={result.raw_response}")


def run(ctx: ProtocolContext) -> None:
    """Run repeated 96ch impact fixture command cycles."""
    virtual_fixture = ctx.is_simulating() or bool(  # type: ignore[attr-defined]
        ctx.params.virtual_fixture
    )
    cycles = int(ctx.params.cycles)  # type: ignore[attr-defined]
    move_wait_seconds = (
        VIRTUAL_MOVE_WAIT_SECONDS if virtual_fixture else REAL_MOVE_WAIT_SECONDS
    )

    _log(
        ctx,
        "connecting 96ch impact protection fixture "
        f"virtual_fixture={virtual_fixture}",
    )
    impact, port = ImpactProtection96ch.BuildImpactProtection96chWithPort(
        simulate=virtual_fixture,
        ctx=ctx,
    )
    _log(ctx, f"connected 96ch impact protection fixture port={port}")
    simulating = ctx.is_simulating()
    if not simulating:
        try:
            for cycle in range(1, cycles + 1):
                _log(ctx, f"cycle={cycle}/{cycles} begin")
                _run_command(ctx, cycle, "get_pipette_before_p200", impact.get_pipette)
                _run_command(ctx, cycle, "set_left_p200", impact.set_left_p200)
                ctx.delay(
                    seconds=move_wait_seconds,
                    msg=f"waiting for p200 position cycle={cycle}",
                )
                _run_command(ctx, cycle, "get_pipette_after_p200", impact.get_pipette)

                _run_command(ctx, cycle, "set_left_p1000", impact.set_left_p1000)
                ctx.delay(
                    seconds=move_wait_seconds,
                    msg=f"waiting for p1000 position cycle={cycle}",
                )
                _run_command(ctx, cycle, "get_pipette_after_p1000", impact.get_pipette)

                _run_command(ctx, cycle, "set_left_p20", impact.set_left_p20)
                ctx.delay(
                    seconds=move_wait_seconds,
                    msg=f"waiting for p20 position cycle={cycle}",
                )
                _run_command(ctx, cycle, "get_pipette_after_p20", impact.get_pipette)
                _log(ctx, f"cycle={cycle}/{cycles} complete")
        finally:
            impact.close()
            _log(ctx, "96ch impact protection fixture closed")
