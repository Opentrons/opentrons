"""Universal photometric test."""
from typing import Tuple

from opentrons import protocol_api
from opentrons.types import Mount

metadata = {"protocolName": "96ch Universal Photometric Protocol"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

DYE_RESERVOIR_DEAD_VOLUME = 20000  # 20k uL

TIPRACK_LOCATIONS = ["D1", "C1", "C2", "C3", "B1"]


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Add test parameters."""
    parameters.add_int(
        display_name="tip type",
        variable_name="tip_type",
        default=50,
        choices=[
            {"display_name": "20", "value": 20},
            {"display_name": "50", "value": 50},
            {"display_name": "200", "value": 200},
            {"display_name": "1000", "value": 1000},
        ],
        description="Select tip type",
    )

    parameters.add_int(
        display_name="model type",
        variable_name="model_type",
        default=200,
        choices=[
            {"display_name": "200", "value": 200},
            {"display_name": "1000", "value": 1000},
        ],
        description="Select model type.",
    )

    parameters.add_int(
        display_name="number of cycles",
        variable_name="cycles",
        default=5,
        minimum=1,
        maximum=100,
        description="Set number of cycles",
    )

    parameters.add_float(
        display_name="target volume",
        variable_name="target_volume",
        default=5,
        minimum=0,
        maximum=1000,
        description="Set target aspirate volume.",
    )
    parameters.add_int(
        variable_name="number_of_tipracks",
        display_name="Number of tipracks",
        description="Choose 1 or 5 tipracks to load at the start.",
        default=5,
        choices=[
            {"display_name": "1", "value": 1},
            {"display_name": "5", "value": 5},
        ],
    )

    parameters.add_bool(
        variable_name="use_pip_motion_defaults",
        display_name="Use pipette motion defaults",
        description="Use default values for pipette motion.",
        default=True,
    )

    parameters.add_float(
        display_name="conditioning volume",
        variable_name="conditioning_volume",
        default=0,
        minimum=0,
        maximum=1000,
        description="Set conditioning aspirate volume.",
    )

    parameters.add_int(
        display_name="aspirate flow rate min/max",
        variable_name="asp_flow_rate",
        default=22,
        minimum=1,
        maximum=200,
        description="Set aspirate flow rate.",
    )

    parameters.add_int(
        display_name="dispense flow rate min/max",
        variable_name="disp_flow_rate",
        default=22,
        minimum=1,
        maximum=200,
        description="Set dispense flow rate",
    )

    parameters.add_int(
        display_name="blowout flow rate min/max",
        variable_name="blowout_flow_rate",
        default=22,
        minimum=1,
        maximum=200,
        description="Set blowout flow rate.",
    )

    parameters.add_float(
        display_name="push out min/max",
        variable_name="push_out",
        default=3.5,
        minimum=1,
        maximum=10,
        description="Set push out volume.",
    )

    parameters.add_int(
        display_name="aspirate submerge speed",
        variable_name="asp_submerge_speed",
        default=50,
        minimum=1,
        maximum=100,
        description="Set aspirate submerge speed.",
    )

    parameters.add_int(
        display_name="dispense submerge speed",
        variable_name="disp_submerge_speed",
        default=50,
        minimum=1,
        maximum=100,
        description="Set dispense submerge speed.",
    )

    parameters.add_int(
        display_name="aspirate exit speed",
        variable_name="asp_exit_speed",
        default=50,
        minimum=1,
        maximum=100,
        description="Set aspirate exit speed.",
    )

    parameters.add_int(
        display_name="dispense exit speed",
        variable_name="disp_exit_speed",
        default=50,
        minimum=1,
        maximum=100,
        description="Set dispense exit speed.",
    )
    parameters.add_int(
        display_name="air gap",
        variable_name="air_gap",
        default=0,
        minimum=0,
        maximum=10,
        description="Set Trailing air gap.",
    )

    parameters.add_float(
        display_name="aspirate_submerge_depth",
        variable_name="asp_sub_depth",
        default=1.5,
        minimum=0,
        maximum=5,
        description="Set aspirate submerge depth.",
    )

    parameters.add_float(
        display_name="dispense_submerge_depth",
        variable_name="disp_sub_depth",
        default=1.5,
        minimum=0,
        maximum=5,
        description="Set dispense submerge depth.",
    )
    parameters.add_float(
        display_name="Dye volume",
        variable_name="dye_volume",
        default=40000,
        minimum=20000,
        maximum=290000,
        description="Set uL of Dye in the Reservoir.",
    )

    parameters.add_float(
        display_name="submerged delay time",
        variable_name="submerged_delay_time",
        default=0,
        minimum=0,
        maximum=60,
        description="Set submerged delay time.",
    )

    parameters.add_bool(
        variable_name="pause_after_asp",
        display_name="pause after aspirate",
        description=("Pause protocol after aspiration."),
        default=True,
    )

    parameters.add_str(
        variable_name="reservoir_labware_loadname",
        display_name="Source labware load name.",
        description=("Load name of the source labware."),
        choices=[
            {"display_name": "NEST 195mL", "value": "nest_1_reservoir_195ml"},
            {"display_name": "NEST 290mL", "value": "nest_1_reservoir_290ml"},
            {"display_name": "None", "value": "none"},
        ],
        default="nest_1_reservoir_290ml",
    )
    parameters.add_str(
        variable_name="destination_labware_loadname",
        display_name="Destination labware load name.",
        description=("Load name of the destination labware."),
        choices=[
            {
                "display_name": "Corning 96 360uL flat",
                "value": "corning_96_wellplate_360ul_flat",
            },
            {
                "display_name": "Nest 96 100uL pcr",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {"display_name": "None", "value": "none"},
        ],
        default="corning_96_wellplate_360ul_flat",
    )
    parameters.add_bool(
        variable_name="lld",
        display_name="enable lld",
        description=("Use LLD to detect liquid height."),
        default=True,
    )


def run(ctx: protocol_api.ProtocolContext) -> None:  # noqa: C901
    """Run."""
    ctx.load_trash_bin("A3")
    # tips
    tipracks = [
        ctx.load_labware(
            f"opentrons_flex_96_tiprack_{ctx.params.tip_type}uL",  # type: ignore [attr-defined]
            location=deck_slot,
            adapter="opentrons_flex_96_tiprack_adapter",
        )
        for deck_slot in TIPRACK_LOCATIONS
    ]

    def _get_tiprack(trial_number: int) -> protocol_api.Labware:
        if ctx.params.number_of_tipracks == 1:  # type: ignore [attr-defined]
            return tipracks[0]
        return tipracks[trial_number]

    # pipette
    pip = ctx.load_instrument(
        f"flex_96channel_{ctx.params.model_type}",  # type: ignore [attr-defined]
        "left",
        tip_racks=tipracks,
    )

    dye_source = ctx.load_labware(
        ctx.params.reservoir_labware_loadname,  # type: ignore [attr-defined]
        "D2",
    )
    dye = ctx.define_liquid(
        name="Dye",
        description="Food Coloring",
        display_color="#FF0000",
    )
    if not ctx.params.lld:  # type: ignore [attr-defined]
        dye_source["A1"].load_liquid(dye, ctx.params.dye_volume)  # type: ignore [attr-defined]

    plate = ctx.load_labware(
        ctx.params.destination_labware_loadname,  # type: ignore [attr-defined]
        location="D3",
    )
    diluent = ctx.define_liquid(
        name="Diluent",
        description="Food Coloring",
        display_color="#FE0000",
    )

    def _validate_dye_liquid_height() -> None:

        liquid_height_valid = False
        retrying = False
        nonlocal dye_source
        while not liquid_height_valid:
            # liquid probe and make sure there is enough volume for all trials
            if ctx.params.lld or retrying:  # type: ignore [attr-defined]
                # if this detects no liquid, the protocol will exit
                # if it detects liquid that is lower than expected, it will let you
                # try again.
                pip.detect_liquid_presence(dye_source["A1"])

            actual_starting_dye_volume = dye_source["A1"].current_liquid_volume()

            needed_starting_dye_volume = (
                96
                * ctx.params.cycles  # type: ignore [attr-defined]
                * ctx.params.target_volume  # type: ignore [attr-defined]
            ) + DYE_RESERVOIR_DEAD_VOLUME
            # note: want to acct for needed dead volume here
            if actual_starting_dye_volume > needed_starting_dye_volume:
                liquid_height_valid = True
            else:
                pip._retract()
                rounded = round(actual_starting_dye_volume, 2)  # type: ignore[arg-type]
                ctx.pause(
                    f"Need {round(needed_starting_dye_volume, 2)} uL dye to start. \
                     Only {rounded} uL detected. Refill and try again."
                )
                retrying = True
        pip._retract()
        if ctx.params.lld:  # type: ignore [attr-defined]
            pip.return_tip()
            pip._retract()
            ctx.pause("Replace tip rack.")
            pip.pick_up_tip(tips["A1"])

    def _set_pipette_motion_settings() -> Tuple[
        float, float, float, float, float, float
    ]:
        if ctx.params.use_pip_motion_defaults:  # type: ignore [attr-defined]
            aspirate_submerge_speed = 50
            dispense_submerge_speed = 50
            aspirate_exit_speed = 50
            dispense_exit_speed = 50
            air_gap = 0.0
            if not ctx.is_simulating():
                from hardware_testing.gravimetric.liquid_class.defaults import (
                    get_liquid_class,
                )

                liquid_class = get_liquid_class(
                    pipette=ctx.params.model_type,  # type: ignore [attr-defined]
                    channels=96,
                    tip=ctx.params.tip_type,  # type: ignore [attr-defined]
                    volume=ctx.params.target_volume,  # type: ignore [attr-defined]
                )
                pip.flow_rate.aspirate = liquid_class.aspirate.plunger_flow_rate
                pip.flow_rate.dispense = liquid_class.dispense.plunger_flow_rate
                set_push_out = liquid_class.dispense.blow_out_submerged
                air_gap = min(
                    liquid_class.aspirate.trailing_air_gap,
                    ctx.params.tip_type - ctx.params.target_volume,  # type: ignore [attr-defined]
                )
            else:  # if simulating
                pip.flow_rate.aspirate = ctx.params.asp_flow_rate  # type: ignore [attr-defined]
                pip.flow_rate.dispense = ctx.params.disp_flow_rate  # type: ignore [attr-defined]
                set_push_out = ctx.params.push_out  # type: ignore [attr-defined]
        else:
            set_push_out = ctx.params.push_out  # type: ignore [attr-defined]
            pip.flow_rate.aspirate = ctx.params.asp_flow_rate  # type: ignore [attr-defined]
            pip.flow_rate.dispense = ctx.params.disp_flow_rate  # type: ignore [attr-defined]
            pip.flow_rate.blow_out = ctx.params.blowout_flow_rate  # type: ignore [attr-defined]
            aspirate_submerge_speed = ctx.params.asp_submerge_speed  # type: ignore [attr-defined]
            dispense_submerge_speed = ctx.params.disp_submerge_speed  # type: ignore [attr-defined]
            air_gap = ctx.params.air_gap  # type: ignore [attr-defined]
        return (
            aspirate_submerge_speed,
            aspirate_exit_speed,
            dispense_submerge_speed,
            dispense_exit_speed,
            set_push_out,
            air_gap,
        )

    (
        aspirate_submerge_speed,
        aspirate_exit_speed,
        dispense_submerge_speed,
        dispense_exit_speed,
        set_push_out,
        air_gap,
    ) = _set_pipette_motion_settings()
    for i in range(ctx.params.cycles):  # type: ignore [attr-defined]
        tips = _get_tiprack(i)
        pip.pick_up_tip(tips["A1"])

        if i == 0:
            _validate_dye_liquid_height()

        aspirate_volume = (
            ctx.params.target_volume  # type: ignore [attr-defined]
            + ctx.params.conditioning_volume  # type: ignore [attr-defined]
        )
        aspirate_pos = (
            dye_source["A1"].estimate_liquid_height_after_pipetting(
                Mount.LEFT, -1 * ctx.params.target_volume  # type: ignore [attr-defined]
            )
            - ctx.params.asp_sub_depth  # type: ignore [attr-defined]
        )
        # Move above reservoir
        pip.move_to(location=dye_source["A1"].top())
        # Move to aspirate position at aspirate submerge speed
        if ctx.is_simulating():
            aspirate_pos = 0.1
        pip.move_to(
            location=dye_source["A1"].bottom(aspirate_pos),
            speed=aspirate_submerge_speed,
        )
        # Submerged delay time
        ctx.delay(seconds=ctx.params.submerged_delay_time)  # type: ignore [attr-defined]
        # Aspirate in place
        pip.aspirate(
            volume=aspirate_volume,
            location=None,
        )
        # Dispense conditioning volume, if any, while submerged
        if ctx.params.conditioning_volume:  # type: ignore [attr-defined]
            pip.dispense(
                volume=ctx.params.conditioning_volume,  # type: ignore [attr-defined]
                location=None,
            )
        # Exit liquid from aspirate position at aspirate exit speed
        pip.move_to(
            location=dye_source["A1"].top(),
            speed=aspirate_exit_speed,
        )
        pip.air_gap(air_gap, height=0)
        # Retract pipette
        pip._retract()
        # Pause after aspiration
        if ctx.params.pause_after_asp:  # type: ignore [attr-defined]
            ctx.pause("Inspect for dropouts.")
        # we'll always end up with 200 uL after dispensing
        prep_vol = 200 - ctx.params.target_volume  # type: ignore [attr-defined]
        plate.load_liquid(plate.wells(), prep_vol, diluent)
        dispense_pos = plate["A1"].estimate_liquid_height_after_pipetting(
            Mount.LEFT, ctx.params.target_volume  # type: ignore [attr-defined]
        )

        # note: would probably be good to add a needed dead volume in this comparison
        dispense_submerge_depth = ctx.params.disp_sub_depth  # type: ignore [attr-defined]
        if dispense_submerge_depth >= dispense_pos:  # type: ignore [attr-defined]
            raise ValueError(
                f"submerge depth {dispense_submerge_depth} \
                too deep for dispense position {dispense_pos}"
            )
        dispense_pos -= ctx.params.disp_sub_depth  # type: ignore [attr-defined]
        # Move to plate
        pip.move_to(location=plate["A1"].top())
        # Move to dispense position at dispense submerge speed
        pip.move_to(
            location=plate["A1"].bottom(dispense_pos),  # type: ignore [arg-type]
            speed=dispense_submerge_speed,
        )
        # Dispense
        pip.dispense(
            volume=ctx.params.target_volume,  # type: ignore [attr-defined]
            location=None,
            push_out=set_push_out,  # type: ignore [attr-defined]
        )
        # Exit liquid from dispense position at dispense exit speed
        blow_out_pos = plate["A1"].bottom(
            dispense_pos + ctx.params.disp_sub_depth + 5  # type: ignore [attr-defined]
        )
        pip.move_to(
            location=blow_out_pos,
            speed=dispense_exit_speed,
        )
        # Perform blow out
        pip.blow_out()
        # Return tip to tip rack
        pip.return_tip()
        # Retract pipette
        pip._retract()
        # Pause protocol
        ctx.pause("Replace tips and dispense plate.")
