"""Universal photometric test."""
from opentrons import protocol_api

from typing import List

from opentrons.protocol_api import (
    InstrumentContext,
    Well,
    LiquidClass,
    Labware,
)
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
)


metadata = {"protocolName": "96ch Universal Photometric Protocol"}
requirements = {"robotType": "Flex", "apiLevel": "2.26"}

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
        default=1000,
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
    parameters.add_float(
        display_name="First aspirate submerge depth",
        variable_name="first_asp_sub_depth",
        description="Override the submerge depth for the first test.",
        default=1.5,
        minimum=0.0,
        maximum=20.0,
    )

    parameters.add_bool(
        variable_name="use_pip_motion_defaults",
        display_name="Use pipette motion defaults",
        description="Use default values for pipette motion.",
        default=True,
    )

    parameters.add_bool(
        variable_name="lld",
        display_name="enable lld",
        description=("Use LLD to detect liquid height."),
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


def dispense_with_liquid_class(
    pipette: InstrumentContext,
    volume: float,
    transfer_properties: TransferProperties,
    transfer_type: tx_comps_executor.TransferType,
    dest: Well,
    contents: List[tx_comps_executor.LiquidAndAirGapPair],
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Dispense with liquid class."""
    return pipette._core.dispense_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        dest=(
            dest.top(),
            dest._core,
        ),
        source=None,
        transfer_properties=transfer_properties,
        transfer_type=transfer_type,
        tip_contents=contents,
        add_final_air_gap=True,
        trash_location=pipette.trash_container,
    )


def multidispense_with_liquid_class(
    pipette: InstrumentContext,
    volume: float,
    transfer_properties: TransferProperties,
    transfer_type: tx_comps_executor.TransferType,
    dest: Well,
    contents: List[tx_comps_executor.LiquidAndAirGapPair],
    last_dispense: bool,
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Dispense with liquid class."""
    return pipette._core.dispense_liquid_class_during_multi_dispense(  # type: ignore [attr-defined]
        volume=volume,
        dest=(
            dest.top(),
            dest._core,
        ),
        source=None,
        transfer_properties=transfer_properties,
        transfer_type=transfer_type,
        tip_contents=contents,
        add_final_air_gap=True,
        trash_location=pipette.trash_container,
        conditioning_volume=0,
        disposal_volume=0,
        is_last_dispense_in_tip=last_dispense,
    )


def aspirate_with_liquid_class(
    pipette: InstrumentContext,
    volume: float,
    transfer_properties: TransferProperties,
    transfer_type: tx_comps_executor.TransferType,
    source: Well,
    tip_size: int,
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Aspirate with liquid class."""
    contents = pipette._core.aspirate_liquid_class(  # type: ignore [attr-defined]
        volume=volume,
        source=(
            source.top(),
            source._core,
        ),
        transfer_properties=transfer_properties,
        transfer_type=transfer_type,
        tip_contents=[
            tx_comps_executor.LiquidAndAirGapPair(
                liquid=0,
                air_gap=0,
            )
        ],
        max_pipette_and_tip_volume=tip_size,
        volume_for_pipette_mode_configuration=None,
    )
    return contents


def run(ctx: protocol_api.ProtocolContext) -> None:  # NOQA: C901
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

    def _validate_dye_liquid_height(trial: int) -> None:

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
                * (ctx.params.cycles - trial)  # type: ignore [attr-defined]
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
        # pip._retract()
        pip.return_tip()
        pip._retract()
        ctx.pause("Replace tip rack.")
        pip.pick_up_tip(tips["A1"])
        # if ctx.params.lld:  # type: ignore [attr-defined]
        #    pip.return_tip()
        #    pip._retract()
        #    ctx.pause("Replace tip rack.")
        #    pip.pick_up_tip(tips["A1"])

    target_volume = ctx.params.target_volume  # type: ignore [attr-defined]

    def _get_transfer_settings(tiprack: Labware, first_trial: bool) -> LiquidClass:
        liquid_class = ctx.get_liquid_class("water", version=3)
        transfer_properties = liquid_class.get_for(pip, tiprack)

        asp_offset = Coordinate(x=0, y=0, z=-1 * ctx.params.asp_sub_depth)  # type: ignore [attr-defined]
        if first_trial:
            asp_offset = Coordinate(x=0, y=0, z=-1 * ctx.params.first_asp_sub_depth)  # type: ignore [attr-defined]
        disp_offset = Coordinate(x=0, y=0, z=-1 * ctx.params.disp_sub_depth)  # type: ignore [attr-defined]

        transfer_properties.aspirate.submerge.start_position.offset = asp_offset
        transfer_properties.aspirate.aspirate_position.offset = asp_offset
        transfer_properties.aspirate.retract.end_position.offset = asp_offset
        transfer_properties.aspirate.aspirate_position.position_reference = (
            PositionReference.LIQUID_MENISCUS
        )
        transfer_properties.dispense.submerge.start_position.offset = disp_offset
        transfer_properties.dispense.dispense_position.offset = disp_offset
        transfer_properties.dispense.retract.end_position.offset = disp_offset
        transfer_properties.dispense.dispense_position.position_reference = (
            PositionReference.LIQUID_MENISCUS
        )
        transfer_properties.multi_dispense.submerge.start_position.offset = disp_offset  # type: ignore [attr-defined, union-attr]
        transfer_properties.multi_dispense.dispense_position.offset = disp_offset  # type: ignore [attr-defined, union-attr]
        transfer_properties.multi_dispense.retract.end_position.offset = disp_offset  # type: ignore [attr-defined, union-attr]
        transfer_properties.multi_dispense.dispense_position.position_reference = (  # type: ignore [attr-defined, union-attr]
            PositionReference.LIQUID_MENISCUS
        )

        if not ctx.params.use_pip_motion_defaults:  # type: ignore [attr-defined]
            transfer_properties.aspirate.flow_rate_by_volume.set_for_volume(target_volume, ctx.params.asp_flow_rate)  # type: ignore [attr-defined]
            transfer_properties.aspirate.submerge.speed = ctx.params.asp_submerge_speed  # type: ignore [attr-defined]
            transfer_properties.aspirate.submerge.delay.enabled = ctx.params.submerged_delay_time > 0  # type: ignore [attr-defined]
            transfer_properties.aspirate.submerge.delay.duration = ctx.params.submerged_delay_time  # type: ignore [attr-defined]
            transfer_properties.aspirate.retract.speed = ctx.params.asp_exit_speed  # type: ignore [attr-defined]

            transfer_properties.dispense.push_out_by_volume.set_for_volume(target_volume, ctx.params.push_out)  # type: ignore [attr-defined]
            transfer_properties.dispense.flow_rate_by_volume.set_for_volume(target_volume, ctx.params.disp_flow_rate)  # type: ignore [attr-defined]
            transfer_properties.dispense.retract.blowout.flow_rate = ctx.params.blowout_flow_rate  # type: ignore [attr-defined]
            transfer_properties.dispense.submerge.speed = ctx.params.disp_submerge_speed  # type: ignore [attr-defined]
            transfer_properties.dispense.retract.speed = ctx.params.disp_exit_speed  # type: ignore [attr-defined]

            transfer_properties.multi_dispense.push_out_by_volume.set_for_volume(target_volume, ctx.params.push_out)  # type: ignore [attr-defined, union-attr]
            transfer_properties.multi_dispense.flow_rate_by_volume.set_for_volume(target_volume, ctx.params.disp_flow_rate)  # type: ignore [attr-defined, union-attr]
            transfer_properties.multi_dispense.retract.blowout.flow_rate = ctx.params.blowout_flow_rate  # type: ignore [attr-defined, union-attr]
            transfer_properties.multi_dispense.submerge.speed = ctx.params.disp_submerge_speed  # type: ignore [attr-defined, union-attr]
            transfer_properties.multi_dispense.retract.speed = ctx.params.disp_exit_speed  # type: ignore [attr-defined, union-attr]

        liquid_class.update_for(pip, tiprack, transfer_properties)
        return liquid_class

    for i in range(ctx.params.cycles):  # type: ignore [attr-defined]
        tips = _get_tiprack(i)
        liquid_class = _get_transfer_settings(tips, i == 0)
        pip.pick_up_tip(tips["A1"])

        # if i == 0:
        #    _validate_dye_liquid_height()
        _validate_dye_liquid_height(i)

        # we'll always end up with 200 uL after dispensing
        prep_vol = max(200 - target_volume, 0)
        plate.load_liquid(plate.wells(), prep_vol, diluent)

        aspirate_volume = (
            target_volume
            + ctx.params.conditioning_volume  # type: ignore [attr-defined]
        )
        transfer_type = tx_comps_executor.TransferType.ONE_TO_ONE
        if ctx.params.conditioning_volume > 0 or target_volume > 250:  # type: ignore [attr-defined]
            transfer_type = tx_comps_executor.TransferType.ONE_TO_MANY
        contents = aspirate_with_liquid_class(
            pip,
            aspirate_volume,
            liquid_class.get_for(pip, tips),
            transfer_type,
            dye_source["A1"],
            ctx.params.tip_type,  # type: ignore [attr-defined]
        )
        # Dispense conditioning volume, if any, while submerged
        if ctx.params.conditioning_volume:  # type: ignore [attr-defined]
            contents = dispense_with_liquid_class(
                pip,
                ctx.params.conditioning_volume,  # type: ignore [attr-defined]
                liquid_class.get_for(pip, tips),
                transfer_type,
                dye_source["A1"],
                contents,
            )
        # Pause after aspiration
        if ctx.params.pause_after_asp:  # type: ignore [attr-defined]
            pip._retract()
            ctx.pause("Inspect for dropouts.")

        # Dispense
        if target_volume <= 250:
            contents = dispense_with_liquid_class(
                pip,
                target_volume,
                liquid_class.get_for(pip, tips),
                transfer_type,
                plate.wells()[0],
                contents,
            )
        else:
            best_divisor = 1
            disp_volume = target_volume / best_divisor
            while disp_volume > 250:
                best_divisor += 1
                disp_volume = target_volume / best_divisor
            for i in range(best_divisor):
                contents = multidispense_with_liquid_class(
                    pip,
                    disp_volume,
                    liquid_class.get_for(pip, tips),
                    transfer_type,
                    plate.wells()[0],
                    contents,
                    last_dispense=i == (best_divisor - 1),
                )
                pip._retract()
                ctx.pause("Replace dispense plate.")
                plate.load_liquid(plate.wells(), prep_vol, diluent)
        # Return tip to tip rack
        pip.return_tip()
        # Retract pipette
        pip._retract()
        # Pause protocol
        ctx.pause("Replace tips and dispense plate.")
