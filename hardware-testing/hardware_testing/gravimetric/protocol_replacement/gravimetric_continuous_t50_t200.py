"""Continuous T50/T200 gravimetric regression wrapper."""

from opentrons.protocol_api import ParameterContext, ProtocolContext

metadata = {"protocolName": "Continuous Gravimetric T50/T200 Regression"}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}

TIP_CAVITY_CHOICES = [
    {"display_name": name, "value": name}
    for name in [
        "Unused",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
    ]
]


def _enable_unattended_mode(ctx: ProtocolContext, gravimetric) -> None:
    """Disable runtime prompts so the continuous regression can run unattended."""

    def _skip_pause(message: str = "") -> None:
        ctx.comment(f"unattended: skipped pause: {message}")

    ctx.pause = _skip_pause  # type: ignore[method-assign]

    def _auto_yes(message: str) -> bool:
        ctx.comment(f"unattended: auto-yes prompt: {message}")
        return True

    gravimetric.AsairDriver.ui.get_user_answer = _auto_yes


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters without importing the heavy gravimetric module."""
    parameters.add_csv_file("QC test profile", "qc_test_profile")

    parameters.add_str(
        display_name="Operator",
        variable_name="operator",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Unused",
                "Haiyan",
                "Jiqing",
                "Yanglin",
                "Yangyin",
                "Hejie",
                "Zhihua",
                "Huanjun",
                "Chengkun",
                "Xiongjian",
                "Zhougui",
                "Zhiwei",
                "TE",
            ]
        ],
        description="Operator for this QC run",
    )

    parameters.add_str(
        display_name="Test Type",
        variable_name="test_type",
        default="Productions",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Productions",
                "Engineering",
            ]
        ],
        description="Testing for production line or engineering's verifications",
    )

    parameters.add_str(
        display_name="Production Type",
        variable_name="production_type",
        default="Opentrons",
        choices=[
            {"display_name": name, "value": name}
            for name in [
                "Opentrons",
                "Millipore",
                "Ultima",
            ]
        ],
        description="Distinguish OEM productions",
    )

    parameters.add_bool(
        display_name="Use Impact Protection",
        variable_name="use_impact_protection",
        default=True,
        description="Whether to use impact protection device during testing.",
    )

    parameters.add_bool(
        display_name="Upload CSV Automatically",
        variable_name="upload_csv_automatically",
        default=False,
        description="Whether to upload the CSV file automatically after testing.",
    )

    parameters.add_str(
        display_name="Tip Cavity for 50ul tips",
        variable_name="cavity_50",
        default="Unused",
        choices=TIP_CAVITY_CHOICES,
        description="Tip cavity for 50ul tips.",
    )

    parameters.add_int(
        display_name="Tip Batch for 50ul tips",
        variable_name="tip_batch_50",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity for 200ul tips",
        variable_name="cavity_200",
        default="Unused",
        choices=TIP_CAVITY_CHOICES,
        description="Tip cavity for 200ul tips.",
    )

    parameters.add_int(
        display_name="Tip Batch for 200ul tips",
        variable_name="tip_batch_200",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )

    parameters.add_str(
        display_name="Tip Cavity for 1000ul tips",
        variable_name="cavity_1000",
        default="Unused",
        choices=TIP_CAVITY_CHOICES,
        description="Tip cavity for 1000ul tips.",
    )

    parameters.add_int(
        display_name="Tip Batch for 1000ul tips",
        variable_name="tip_batch_1000",
        minimum=10000000,
        maximum=99999999,
        default=20250101,
        description="Date portion of tip batch.",
    )


def run(ctx: ProtocolContext) -> None:
    """Run gravimetric repeatedly until the operator stops the run."""
    simulating = ctx.is_simulating()

    from hardware_testing.gravimetric.protocol_replacement import gravimetric

    _enable_unattended_mode(ctx, gravimetric)
    fixture_settings = gravimetric.FixtureSettings.build(ctx)
    if simulating:
        ctx.comment(
            "simulating: loaded gravimetric deck for calibration; "
            "skip continuous hardware run"
        )
        fixture_settings.recorder.stop()
        return

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
