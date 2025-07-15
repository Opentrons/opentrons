"""Mix Protocol with Error Recovery Turned Off."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Well,
    InstrumentContext,
)
from opentrons.hardware_control.types import Axis

metadata = {
    "protocolName": "Mix without Error Recovery",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com>",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.24",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters for the Mix protocol."""
    parameters.add_str(
        variable_name="left_mount",
        display_name="Left Mount",
        description="Pipette Type on Left Mount.",
        choices=[
            {"display_name": "8ch 50ul", "value": "flex_8channel_50"},
            {"display_name": "8ch 1000ul", "value": "flex_8channel_1000"},
            {"display_name": "1ch 50ul", "value": "flex_1channel_50"},
            {"display_name": "1ch 1000ul", "value": "flex_1channel_1000"},
            {"display_name": "96ch 1000ul", "value": "flex_96channel_1000"},
            {"display_name": "None", "value": "none"},
        ],
        default="flex_8channel_1000",
    )
    parameters.add_str(
        variable_name="tip_type",
        display_name="Tip Type",
        description="Tip Type to use for the test.",
        choices=[
            {"display_name": "50 uL", "value": "opentrons_flex_96_tiprack_50ul"},
            {
                "display_name": "50 uL Filter",
                "value": "opentrons_flex_96_filtertiprack_50ul",
            },
            {
                "display_name": "200 µL",
                "value": "opentrons_flex_96_tiprack_200ul",
            },
            {"display_name": "1000 µL", "value": "opentrons_flex_96_tiprack_1000ul"},
            {
                "display_name": "1000 µL FILTER",
                "value": "opentrons_flex_96_filtertiprack_1000ul",
            },
        ],
        default="opentrons_flex_96_tiprack_200ul",
    )
    parameters.add_str(
        variable_name="tip_rack_slot",
        display_name="Tip Rack Slot",
        description="Slot for the tip rack.",
        choices=[
            {"display_name": "A1", "value": "A1"},
            {"display_name": "B1", "value": "B1"},
            {"display_name": "C1", "value": "C1"},
            {"display_name": "D1", "value": "D1"},
            {"display_name": "A3", "value": "A3"},
            {"display_name": "B3", "value": "B3"},
            {"display_name": "C3", "value": "C3"},
            {"display_name": "D3", "value": "D3"},
        ],
        default="D1",
    )
    parameters.add_float(
        variable_name="mix_volume",
        display_name="Mix Volume (ul)",
        maximum=1000,
        minimum=1,
        default=200,
    )
    parameters.add_int(
        variable_name="mix_reps",
        display_name="Mix Repititions",
        maximum=10000,
        minimum=1,
        default=200,
    )
    parameters.add_float(
        variable_name="flow_rate",
        display_name="Flow Rate",
        description="Mix flow rate.",
        maximum=850,
        minimum=1,
        default=716,
    )


def home_axes_only(ctx: ProtocolContext) -> None:
    """Home axes and no plungers."""
    hw_api = ctx._core.get_hardware()
    hw_api.home([Axis.Z_L, Axis.Z_R, Axis.X, Axis.Y])


def safe_mix(
    pipette: InstrumentContext,
    location: Well,
    ctx: ProtocolContext,
) -> None:
    """Perform mix manually, catching stalls."""
    stall_count = 0
    mix_volume = ctx.params.mix_volume  # type: ignore[attr-defined]
    mix_reps = ctx.params.mix_reps  # type: ignore[attr-defined]
    mix_flow_rate = ctx.params.flow_rate  # type: ignore[attr-defined]

    for i in range(mix_reps):
        try:
            pipette.aspirate(mix_volume, location.bottom(z=1), flow_rate=mix_flow_rate)
            pipette.dispense(mix_volume, location.bottom(z=2), flow_rate=mix_flow_rate)
        except Exception as e:
            msg = str(e)
            if "stall" in msg:
                ctx.comment(f"Caught stall error (code 2003): {msg}")
                try:
                    pipette._retract()  # homes the z axis
                except Exception as e:
                    msg = str(e)
                    ctx.comment(f"second error {msg}")
                    if "position" in msg:
                        # if PositionUnknownError Occurs after the Z axis homes, t
                        # he pipette will home all axes excluding the plunger.
                        home_axes_only(ctx)
                pipette.blow_out(location.top())
                pipette.home()  # pipette homes again after blow out to ensure plunger is homed.
                pipette.move_to(location.top())
            else:
                ctx.comment(f"Unhandled error: {msg}")
                raise
            stall_count += 1
            continue
    ctx.comment(f"Total stalls: {stall_count}")


def run(ctx: ProtocolContext) -> None:
    """Run the Mix protocol."""
    # Load pipette
    left_mount = ctx.params.left_mount  # type: ignore[attr-defined]
    tip_rack = ctx.load_labware(
        ctx.params.tip_type, ctx.params.tip_rack_slot  # type: ignore[attr-defined]
    )
    pipette = ctx.load_instrument(
        left_mount,
        "left",
        tip_racks=[tip_rack],
    )
    reservoir = ctx.load_labware("opentrons_tough_12_reservoir_22ml", "D2")
    pipette.pick_up_tip()
    safe_mix(pipette, reservoir["A1"], ctx)
