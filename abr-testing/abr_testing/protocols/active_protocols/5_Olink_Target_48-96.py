"""Olink Target 48/96 Protocol."""
from opentrons import types
from opentrons.protocol_api import (
    ALL,
    COLUMN,
    SINGLE,
    ParameterContext,
    ProtocolContext,
    Well,
    Labware
)
from typing import List


metadata = {
    "protocolName": "Olink Target 96/ 48",
    "author": "Zachary Galluzzo <zachary.galluzzo@opentrons.com>",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}

open_location = "A4"


def add_parameters(p: ParameterContext) -> None:
    """Add parameters to the protocol context."""
    p.add_bool(
        display_name="Step 1?",
        variable_name="mmx_to_sample_plate",
        default=True,
        description="If on, this protocol will transfer mastermix to the sample plate.",
    )
    p.add_bool(
        display_name="Step 2?",
        variable_name="ep_to_sample_plate",
        default=True,
        description="If on, this protocol will transfer extension product to the sample plate.",
    )
    p.add_bool(
        display_name="Step 3?",
        variable_name="primer_to_chip",
        default=True,
        description="If on, this protocol will transfer Primers to the IFP chip.",
    )
    p.add_bool(
        display_name="Step 4?",
        variable_name="sample_to_chip",
        default=True,
        description="If on, this protocol will transfer sample to the IFP chip.",
    )
    p.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        default=96,
        choices=[
            {"display_name": "96", "value": 96},
            {"display_name": "48", "value": 48},
        ],
        description="Target 96 or 48 samples?",
    )
    p.add_int(
        display_name="Mastermix Column",
        variable_name="mm_col",
        default=0,
        choices=[
            {"display_name": "1", "value": 0},
            {"display_name": "2", "value": 1},
            {"display_name": "3", "value": 2},
            {"display_name": "4", "value": 3},
            {"display_name": "5", "value": 4},
            {"display_name": "6", "value": 5},
            {"display_name": "7", "value": 6},
            {"display_name": "8", "value": 7},
            {"display_name": "9", "value": 8},
        ],
        description="Which column is the mastermix in?",
    )
    p.add_bool(
        display_name="Waste Chute Present?",
        variable_name="waste_chute",
        default=False,
        description="ON - protocol will use the waste chute.",
    )


def run(ctx: ProtocolContext) -> None:
    """Main function to run the protocol."""
    global open_location

    # Import Parameters

    mmx_to_sample_plate = ctx.params.mmx_to_sample_plate  # type: ignore[attr-defined]
    ep_to_sample_plate = ctx.params.ep_to_sample_plate  # type: ignore[attr-defined]
    mm_col = ctx.params.mm_col  # type: ignore[attr-defined]
    primer_to_chip = ctx.params.primer_to_chip  # type: ignore[attr-defined]
    sample_to_chip = ctx.params.sample_to_chip  # type: ignore[attr-defined]
    num_samples = ctx.params.num_samples  # type: ignore[attr-defined]
    waste_chute = ctx.params.waste_chute  # type: ignore[attr-defined]

    if not waste_chute:
        open_location = "D4"

    ninety_six = True if num_samples == 96 else False

    ctx.comment(
        f"\n*****************************\nStarting Target {num_samples} Protocol\n*****************************\n"
    )

    # Load Pipette and Tips
    pip = ctx.load_instrument("flex_96channel_200")

    col_tips_1 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "A1", "Tips per Column #1"
    )
    col_tips_2 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "B3", "Tips per Column #2"
    )
    col_tips = [col_tips_1, col_tips_2]

    if ninety_six:
        tip_adap = ctx.load_adapter(
            "opentrons_flex_96_tiprack_adapter", "A3" if waste_chute else "D3"
        )
        full_tips_ = tip_adap.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", "Full 96 ch Tips"
        )
        full_tips = full_tips_.wells()[0]
        col_tips_3 = ctx.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", "B4", "Tips per Column #3"
        )
        col_tips.append(col_tips_3)

    # Start Tip Tracking Variables

    # Load Labware
    if waste_chute:
        ctx.load_waste_chute()
    else:
        ctx.load_trash_bin("A3")

    primer_plate = ctx.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "Primer Plate"
    )
    # used to be "psomagenolink_96_wellplate_200ul"
    sample_plate = ctx.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Plate"
    )
    # used †ø be ab©ene_96_wellplate_200ul
    ifp_plate = ctx.load_labware(
        "biorad_384_wellplate_50ul" if ninety_six else "fluidigm_ifp_48.48",
        "C2",
        "IFP Chip",
    )
    # used to be fluidigm_ifp_96.96
    product_plate = ctx.load_labware(
        "nest_96_wellplate_2ml_deep", "C1", "Extension Product Plate"
    )  # Would typically be semi-skirt plate with adapter
    # used to be olinksemiskirt_96_wellplate_300ul
    mm_plate = ctx.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3", "Mastermix Plate"
    )
    # used to be ab©ene_96_wellplate_200ul
    # Create Lists for distribution
    mastermix = mm_plate.wells()[8 * mm_col]  # 1 single column

    # mm_dest = [sample_plate.rows()[0][:6],sample_plate.rows()[0][6:]]
    mm_dest = sample_plate.rows()[0][: 12 if ninety_six else 6]

    # if ninety_six: # not using this difference - going to stamp whether it is 48 or 96
    extension_source = product_plate.wells()[0]
    sample_dest = sample_plate.wells()[
        0
    ]  # for 96 channel transfer of extension product to sample plate
    # else:
    # 	extension_source = []
    # 	for well in range(12):
    # 		extension_source.append(product_plate.rows()[0][well])
    # 	sample_dest = sample_plate.rows()[0]

    _source_list = (
        [0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11] if ninety_six else [0, 3, 1, 4, 2, 5]
    )
    primer_source = []
    sample_source = []
    for well in _source_list:
        primer_source.append(primer_plate.rows()[0][well])
        sample_source.append(sample_plate.rows()[0][well])

    prim_dest_list = (
        [0, 1, 16, 17, 32, 33, 48, 49, 64, 65, 80, 81]
        if ninety_six
        else [0, 1, 16, 17, 32, 33]
    )
    ifp_primer_dests = []
    for well in prim_dest_list:
        ifp_primer_dests.append(ifp_plate.wells()[well])

    samp_dest_list = (
        [95, 97, 112, 113, 128, 129, 144, 145, 160, 161, 176, 177]
        if ninety_six
        else [48, 49, 64, 65, 80, 81]
    )
    ifp_samp_dests = []
    for well in samp_dest_list:
        ifp_samp_dests.append(ifp_plate.wells()[well])

    # Need list of tips for IFP transfers (post 48 sample stamp)
    if not ninety_six:
        ifp_tips = [
            col_tips[0].wells()[5 * 8],
            col_tips[0].wells()[4 * 8],
            col_tips[0].wells()[3 * 8],
            col_tips[0].wells()[2 * 8],
            col_tips[0].wells()[8],
            col_tips[0].wells()[0],
        ] + col_tips[1].rows()[0][-1::-1]
        if mmx_to_sample_plate:
            ifp_tips.pop(0)
        ctx.comment(f"\nIFP Tips: {ifp_tips}")

    # Volumes
    pcr_product_vol = 2.8

    mm_vol = 9.1  # need to hit 7.2

    ifc_vol = 5

    # Speeds (from Hamilton Star settings as per Katie)

    retract_speed = 10

    mix_speed = 75

    asp_default = 20

    disp_default = 120

    gant_default = pip.default_speed

    delay_time = 1  # second

    pip.flow_rate.aspirate = asp_default
    pip.flow_rate.dispense = disp_default

    def swap_speed(
        dev: str, func: str | None, new_speed: float, on: bool = True
    ) -> None:
        """New Speed Function."""
        if on:
            if dev == "pip":
                if func == "asp":
                    pip.flow_rate.aspirate = new_speed
                    ctx.comment(f"\nNew Aspirate Speed: {new_speed}\n")
                if func == "disp":
                    pip.flow_rate.dispense = new_speed
                    ctx.comment(f"\nNew Dispense Speed: {new_speed}\n")

            if dev == "gantry":
                pip.default_speed = new_speed
                ctx.comment(f"\nNew Gantry Speed: {new_speed}\n")
        else:
            if dev == "pip":
                if func == "asp":
                    pip.flow_rate.aspirate = asp_default
                    ctx.comment(f"\nNew Aspirate Speed: {new_speed}\n")
                if func == "disp":
                    pip.flow_rate.dispense = disp_default
                    ctx.comment(f"\nNew Dispense Speed: {new_speed}\n")

            if dev == "gantry":
                pip.default_speed = gant_default
                ctx.comment(f"\nNew Gantry Speed: {new_speed}\n")

    def mixing(well: Well, vol: float, blow_out: bool = True, reps: int = 8) -> None:
        """Mixing Function."""
        swap_speed("pip", "asp", mix_speed)
        swap_speed("pip", "disp", mix_speed)

        pip.aspirate(1, well.top(1))
        for m in range(reps):
            pip.aspirate(vol, well.bottom(1.25))
            pip.dispense(
                vol if m != reps - 1 else pip.current_volume,
                well.bottom(6),
                rate=1 if m == reps - 1 else 0.2,
            )
        if blow_out:
            ctx.delay(seconds=delay_time)
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.blow_out(well.top(-3))
            ctx.delay(seconds=delay_time)
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
        else:
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(well.top())
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)

        swap_speed("pip", "asp", asp_default, on=False)
        swap_speed("pip", "disp", disp_default, on=False)

    def transfer_mm(
        src: Well, destination, volume: float, multi_disp: bool = False
    ) -> None:
        """Transfer Mastermix to Sample Plate."""
        global open_location
        # Distribute is for mastermix multi-dispense to sample plate

        pip.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=col_tips)
        try:
            pip.pick_up_tip()
        except:
            new_location = col_tips[0].parent
            new_open_location = col_tips[1].parent
            ctx.move_labware(col_tips.pop(0), open_location, use_gripper=True)
            ctx.move_labware(col_tips[0], new_location, use_gripper=True)
            open_location = new_open_location
            pip.pick_up_tip()

        if multi_disp:
            for i in range(2 if ninety_six else 1):
                pip.aspirate(
                    49 - pip.current_volume, src.bottom(1.25), rate=0.2
                )  # aspirate extra (backlash compensation)
                ctx.delay(seconds=delay_time)
                pip.dispense(
                    2, src.bottom(1.25)
                )  # get rid of backlash compensation volume
                # Retract
                swap_speed("gantry", func=None, new_speed=retract_speed)
                pip.move_to(src.top())
                swap_speed("gantry", func=None, new_speed=gant_default, on=False)
                for well in destination[i]:
                    pip.dispense(volume, well.bottom(2))
                    ctx.delay(seconds=delay_time)
                    pip.touch_tip(v_offset=-2, radius=0.75)
                    swap_speed("gantry", func=None, new_speed=retract_speed)
                    pip.move_to(well.top())
                    swap_speed("gantry", func=None, new_speed=gant_default, on=False)
                ctx.delay(seconds=delay_time)
            pip.drop_tip()

        else:
            length = (
                12 if ninety_six else 6
            )  # determines how many iterations should be run through
            for i in range(length):
                volume = 9.1 + i * 0.15
                ctx.comment(f"\nVOLUME: {volume}")
                pip.aspirate(
                    volume + 1.5 if i == 0 else volume, src.bottom(1.25), rate=0.35
                )
                ctx.delay(seconds=delay_time)
                # Retract
                swap_speed("gantry", func=None, new_speed=retract_speed)
                pip.move_to(src.top(10))
                swap_speed("gantry", func=None, new_speed=gant_default, on=False)
                pip.move_to(destination[i].top(10))
                pip.dispense(
                    volume,
                    destination[i].bottom(1.25),
                    rate=0.2 if volume <= 5 else 1,
                    push_out=0,
                )
                ctx.delay(seconds=delay_time)
                swap_speed("gantry", func=None, new_speed=retract_speed)
                pip.move_to(destination[i].top())
                swap_speed("gantry", func=None, new_speed=gant_default, on=False)

            pip.drop_tip()

    def transfer_ep(src, destination, volume):
        global open_location

        if (
            ninety_six
        ):  # for transferring extension product to sample plate in one single asp/disp
            pip.configure_nozzle_layout(style=ALL)
            pip.configure_for_volume(volume)
            pip.pick_up_tip(full_tips)
            pip.aspirate(volume, src.bottom(6))
            ctx.delay(seconds=delay_time)
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(src.top(10))
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            pip.move_to(destination.top(10))
            pip.dispense(
                volume, destination.bottom(3)
            )  # reverse pipetting slightly more than actual volume
            ctx.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tip
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(destination.top())
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            ctx.delay(seconds=delay_time)
            pip.drop_tip()

        else:
            pip.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=col_tips)

            length = (
                12 if ninety_six else 6
            )  # determines how many iterations should be run through
            pip.configure_for_volume(volume)
            # for i in range(length):
            # try:
            pip.pick_up_tip(
                col_tips[0].wells()[5 * 8 if mmx_to_sample_plate else 6 * 8]
            )
            # except:
            # 	new_location=col_tips[0].parent
            # 	new_open_location=col_tips[1].parent
            # 	ctx.move_labware(col_tips.pop(0),open_location,use_gripper=True)
            # 	ctx.move_labware(col_tips[0],new_location,use_gripper=True)
            # 	open_location=new_open_location
            # 	pip.pick_up_tip()
            pip.aspirate(volume, src.bottom(6), rate=0.2)
            ctx.delay(seconds=delay_time)
            # Retract
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(src.top(10) if type(src) == list else src.top(10))
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            pip.move_to(destination.top(10))
            pip.dispense(volume, destination.bottom(5), rate=0.2)
            ctx.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tips
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(destination.top(-2))
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            pip.drop_tip()

    def transfer_ifp(
        src: Well, destination: Well, volume: float,  col_tips:List[Labware], prim: bool = False
    ) -> None:
        """Transfer Sample to IFP Chip."""
        global open_location

        # Offsets for dispensing in IFP Chip
        z96 = -8.5
        x96 = 1.35
        z48 = -7
        x48 = 0.5
        pip.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=col_tips)

        length = (
            12 if ninety_six else 6
        )  # determines how many iterations should be run through
        for i in range(length):
            if ninety_six:
                try:
                    pip.pick_up_tip()
                except:
                    for tip_rack in pip.tip_racks:
                        print("BEFORE MOVE")
                        print(tip_rack.parent)
                    # Get current tiprack locations
                    current_tiprack = col_tips[0]
                    next_tiprack = col_tips[1]

                    current_slot = current_tiprack.parent
                    next_slot = next_tiprack.parent

                    # If the next tiprack is in the staging slot, we cannot use it directly.
                    # So we move it to the currently active slot, which will become free.
                    # And move the current one out of the way to the staging slot

                    # Step 1: move current_tiprack to staging (open) slot
                    ctx.move_labware(current_tiprack, open_location, use_gripper=True)

                    # Step 2: move next_tiprack into the now-free deck slot
                    ctx.move_labware(next_tiprack, current_slot, use_gripper=True)

                    # Step 3: update our tracking
                    open_location = next_slot
                    col_tips = col_tips[1:] + [col_tips[0]]
                    # Step 4: pick tip from the newly moved rack (now at a valid deck slot)
                    for tip_rack in pip.tip_racks:
                        print("AFTER MOVE")
                        print(tip_rack.parent)
                    pip.pick_up_tip()
            else:
                if mmx_to_sample_plate:
                    if i == 5 and prim:
                        loc = col_tips[0].parent
                        ctx.move_labware(
                            col_tips.pop(0), open_location, use_gripper=True
                        )
                        ctx.move_labware(col_tips[0], loc, use_gripper=True)

                pip.pick_up_tip(ifp_tips.pop(0))
            pip.aspirate(volume + 4, src[i].bottom(1), rate=0.2 if volume <= 5 else 1)
            ctx.delay(seconds=delay_time)
            pip.dispense(2, src[i].bottom(1.5))  # compensate for backlash
            # Retract
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(src[i].top(10))
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            pip.move_to(destination[i].top(10))
            pip.move_to(
                destination[i]
                .top()
                .move(types.Point(x=0, y=0, z=z96 if ninety_six else z48))
            )
            pip.dispense(
                volume + 1,
                destination[i]
                .top()
                .move(
                    types.Point(
                        x=x96 if ninety_six else x48, y=0, z=z96 if ninety_six else z48
                    )
                ),
                rate=0.2 if volume <= 5 else 1,
            )
            ctx.delay(seconds=delay_time)
            swap_speed("gantry", func=None, new_speed=retract_speed)
            pip.move_to(destination[i].top(-2))
            swap_speed("gantry", func=None, new_speed=gant_default, on=False)
            pip.aspirate(
                10
            )  # move liquid towards top of tip so that there is no splatter when dropping the tips
            pip.drop_tip()

        if not mmx_to_sample_plate and prim:
            loc = col_tips[0].parent
            ctx.move_labware(col_tips.pop(0), open_location, use_gripper=True)
            ctx.move_labware(col_tips[0], loc, use_gripper=True)

    if mmx_to_sample_plate:
        ctx.comment(
            f"\n***************\nTransferring Mastermix to Each Well of Sample Plate\n***************\n"
        )
        transfer_mm(
            mastermix, mm_dest, mm_vol, multi_disp=False if ninety_six else False
        )
    if ep_to_sample_plate:
        ctx.comment(
            f"\n***************\nTransferring Extension Product to Each Well of Sample Plate\n***************\n"
        )
        transfer_ep(extension_source, sample_dest, pcr_product_vol)
    if primer_to_chip:
        ctx.pause("Please vortex plate, centrifuge and return to D1")
        ctx.comment(
            f"\n***************\nTransferring Primers to IFP Chip\n***************\n"
        )
        transfer_ifp(primer_source, ifp_primer_dests, ifc_vol, col_tips=col_tips, prim=True)
    if sample_to_chip:
        ctx.comment(
            f"\n***************\nTransferring Sample to IFP Chip\n***************\n"
        )
        transfer_ifp(sample_source, ifp_samp_dests, ifc_vol, col_tips=col_tips)

    ########################### Adding Liquids to Setup ##################################
    mm_liq_vol = 95 if ninety_six else 47
    ep_liq_vol = 100
    prim_liq_vol = 12

    mm_liq = ctx.define_liquid(
        name="Master Mix", description=None, display_color="#FF0000"
    )
    ep_liq = ctx.define_liquid(
        name="Extension Product", description=None, display_color="#FF00FF"
    )
    prim_liq = ctx.define_liquid(
        name="Primers", description=None, display_color="#00FF00"
    )

    for well_n in mm_plate.wells()[8 * mm_col : 8 * mm_col + 8]:
        well_n.load_liquid(liquid=mm_liq, volume=mm_liq_vol)

    for x in range(96 if ninety_six else 48):
        product_plate.wells()[x].load_liquid(liquid=ep_liq, volume=ep_liq_vol)

    for x in range(96 if ninety_six else 48):
        primer_plate.wells()[x].load_liquid(liquid=prim_liq, volume=prim_liq_vol)
