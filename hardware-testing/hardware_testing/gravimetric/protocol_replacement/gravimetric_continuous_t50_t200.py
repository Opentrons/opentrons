"""Continuous T50/T200 gravimetric regression wrapper."""

from opentrons.protocol_api import ParameterContext, ProtocolContext

from hardware_testing.gravimetric.protocol_replacement import gravimetric

metadata = {"protocolName": "Continuous Gravimetric T50/T200 Regression"}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}


def add_parameters(parameters: ParameterContext) -> None:
    """Use the same runtime parameters as the standard gravimetric protocol."""
    gravimetric.add_parameters(parameters)


def run(ctx: ProtocolContext) -> None:
    """Run gravimetric repeatedly until the operator stops the run."""
    fixture_settings = gravimetric.FixtureSettings.build(ctx)
    cycle = 1
    try:
        while True:
            gravimetric.print_header(f"Continuous gravimetric cycle {cycle}")
            gravimetric._run(ctx, fixture_settings)
            ctx.delay(
                seconds=1,
                msg=(
                    f"Continuous gravimetric cycle {cycle} complete. "
                    "Starting next cycle with the same tip racks."
                ),
            )
            cycle += 1
    finally:
        fixture_settings.recorder.stop()
