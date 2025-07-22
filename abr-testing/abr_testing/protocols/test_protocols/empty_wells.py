"""Mix Protocol with Error Recovery Turned Off."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
)
from opentrons.hardware_control.types import Axis

metadata = {
    "protocolName": "Empty Well without Error Recovery",
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
        default="flex_96channel_1000",
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
        default="opentrons_flex_96_tiprack_1000ul",
    )
    parameters.add_str(
        variable_name="labware_type",
        display_name="Labware Type",
        choices=[
            {
                "display_name": "12 well reservoir",
                "value": "opentrons_tough_12_reservoir_22ml",
            },
            {
                "display_name": "PCR Plate",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
            {
                "display_name": "Corning 6 Plate",
                "value": "corning_6_wellplate_16.8ml_flat",
            },
            {
                "display_name": "1 Well Reservoir",
                "value": "opentrons_tough_1_reservoir_300ml",
            },
        ],
        default="opentrons_tough_1_reservoir_300ml",
    )


def home_axes_only(ctx: ProtocolContext) -> None:
    """Home axes and no plungers."""
    hw_api = ctx._core.get_hardware()
    hw_api.home([Axis.Z_L, Axis.Z_R, Axis.X, Axis.Y])


def run(ctx: ProtocolContext) -> None:
    """Empty well."""
    labware_type = ctx.params.labware_type  # type: ignore[attr-defined]
    labware = ctx.load_labware(labware_type, "D2")
    pipette_type = ctx.params.left_mount  # type: ignore[attr-defined]

    tip_rack_type = ctx.params.tip_type
    if int(pipette_type.split("_")[2]) > 8:
        tiprack_adapter = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", "C2")
        tip_rack = tiprack_adapter.load_labware(tip_rack_type)
    else:
        tip_rack = ctx.load_labware(tip_rack_type, "C2")  # type: ignore[attr-defined]
    tip_volume = float(tip_rack_type.split("_")[-1].split("ul")[0])
    pipette = ctx.load_instrument(pipette_type, "left", tip_racks=[tip_rack])

    well_location = {
        "opentrons_tough_12_reservoir_22ml": "A1",
        "opentrons_96_wellplate_200ul_pcr_full_skirt": "A1",
        "corning_6_wellplate_16.8ml_flat": "B1",
        "opentrons_tough_1_reservoir_300ml": "A1",
    }
    well = labware[well_location[labware_type]]
    pipette.pick_up_tip()
    z_height = 0.5
    pipette.aspirate(100, well.bottom(z=z_height))
    NO_OVERPRESSURE = True

    while NO_OVERPRESSURE:
        z_height -= 0.2
        ctx.comment(f"Z height {z_height}")
        try:
            print(z_height)
            if (tip_volume - pipette.current_volume) >= 5:
                pipette.aspirate(100, well.bottom(z=z_height))
            else:
                break
        except Exception as e:
            msg = str(e)
            if "pressure" in msg:
                ctx.comment(f"error caught: {e}")
                adjusted_height = z_height + 0.1
                pipette._retract()
                try:
                    pipette._retract()
                    pipette.move_to(well.bottom(adjusted_height))
                    aspirate_vol = min(tip_volume, pipette.remaining_volume)
                    pipette.aspirate(aspirate_vol)
                except:
                    home_axes_only(ctx)
                    pipette.move_to(well.bottom(adjusted_height))
                    aspirate_vol = min(tip_volume, pipette.remaining_volume)
                    pipette.aspirate(aspirate_vol)
                ctx.comment(
                    f"Height at overpressure: {z_height} adjusted to {adjusted_height}"
                )
                break
            else:
                raise
        if z_height < -5:
            break
