"""Olink Target 48/96 Protocol."""
from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    ParameterContext,
    Well,
    SINGLE
)
from typing import Tuple, Optional, Union
from opentrons.protocol_api import COLUMN, ALL
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
    TemperatureModuleContext,
    MagneticModuleContext,
    AbsorbanceReaderContext,
)


from typing import List, Dict

metadata = {
    "protocolName": "Olink Target 96/ 48 v3",
    "author": "Zachary Galluzzo <zachary.galluzzo@opentrons.com>",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

open_location: any = "A4"


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
    p.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


def run(protocol: ProtocolContext) -> None:
    """Main function to run the protocol."""
 
    global open_location
    protocol.capture_image(filename="start_of_run")

    # Import Parameters
    length = protocol.params.error_capture_duration  # type: ignore[attr-defined]
    mmx_to_sample_plate = protocol.params.mmx_to_sample_plate  # type: ignore[attr-defined]
    ep_to_sample_plate = protocol.params.ep_to_sample_plate  # type: ignore[attr-defined]
    mm_col = protocol.params.mm_col  # type: ignore[attr-defined]
    primer_to_chip = protocol.params.primer_to_chip  # type: ignore[attr-defined]
    sample_to_chip = protocol.params.sample_to_chip  # type: ignore[attr-defined]
    num_samples = protocol.params.num_samples  # type: ignore[attr-defined]
    waste_chute = protocol.params.waste_chute  # type: ignore[attr-defined]

    if not waste_chute:
        open_location = "B2"

    ninety_six = True if num_samples == 96 else False

    protocol.comment(f"\n********\nStarting Target {num_samples} Protocol\n********\n")

    # Load Pipette and Tips
    pip = protocol.load_instrument("flex_96channel_1000")

    col_tips_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "A1", "Tips per Column #1"
    )
    col_tips_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "B3", "Tips per Column #2"
    )
    col_tips = [col_tips_1, col_tips_2]

    if ninety_six:
        tip_adap = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "A3")
        full_tips_ = tip_adap.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", "Full 96 ch Tips"
        )
        full_tips = full_tips_.wells()[0]
        col_tips_3 = protocol.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", "B4", "Tips per Column #3"
        )
        col_tips.append(col_tips_3)

    # Start Tip Tracking Variables

    # Load Labware
    if waste_chute:
        protocol.load_waste_chute()
    else:
        protocol.load_trash_bin("D3")

    primer_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "Primer Plate"
    )
    # used to be "psomagenolink_96_wellplate_200ul"
    sample_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Plate"
    )
    sample_plate.load_empty(sample_plate.wells())
    # used †ø be ab©ene_96_wellplate_200ul
    ifp_plate = protocol.load_labware(
        "biorad_384_wellplate_50ul" if ninety_six else "fluidigm_ifp_48.48",
        "C2",
        "IFP Chip",
    )
    ifp_plate.load_empty(ifp_plate.wells())
    # used to be fluidigm_ifp_96.96
    product_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C1", "Extension Product Plate"
    )  # Would typically be semi-skirt plate with adapter
    # used to be olinksemiskirt_96_wellplate_300ul
    mm_plate = protocol.load_labware(
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
        [96, 97, 112, 113, 128, 129, 144, 145, 160, 161, 176, 177]
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
        protocol.comment(f"\nIFP Tips: {ifp_tips}")

    # Volumes
    pcr_product_vol = 2.8

    mm_vol = 9.1  # need to hit 7.2

    ifc_vol = 5

    # Speeds (from Hamilton Star settings as per Katie)

    asp_default = 20

    disp_default = 120

    delay_time = 1  # second

    pip.flow_rate.aspirate = asp_default
    pip.flow_rate.dispense = disp_default

    # Adding Liquids to Setup ##################################
    mm_liq_vol = 150 if ninety_six else 47
    ep_liq_vol = 100
    prim_liq_vol = 12

    mm_liq = protocol.define_liquid(
        name="Master Mix", description=None, display_color="#FF0000"
    )
    ep_liq = protocol.define_liquid(
        name="Extension Product", description=None, display_color="#FF00FF"
    )
    prim_liq = protocol.define_liquid(
        name="Primers", description=None, display_color="#00FF00"
    )

    for well_n in mm_plate.wells()[8 * mm_col : 8 * mm_col + 8]:
        well_n.load_liquid(liquid=mm_liq, volume=mm_liq_vol)

    for x in range(96 if ninety_six else 48):
        product_plate.wells()[x].load_liquid(liquid=ep_liq, volume=ep_liq_vol)

    for x in range(96 if ninety_six else 48):
        primer_plate.wells()[x].load_liquid(liquid=prim_liq, volume=prim_liq_vol)

    def is_in_staging_slot(labware: Labware) -> bool:
        """Check if labware is in a staging slot."""
        return str(labware.parent).strip().endswith("4")

    def mixing(well: Well, vol: float, blow_out: bool = True, reps: int = 8) -> None:
        """Mixing Function."""
        pip.aspirate(1, well.top(1))
        for m in range(reps):
            pip.aspirate(vol, well.meniscus(z=-1, target="end"))
            pip.dispense(
                vol if m != reps - 1 else pip.current_volume,
                well.meniscus(z=1, target="end"),
                rate=1 if m == reps - 1 else 0.2,
            )
        if blow_out:
            protocol.delay(seconds=delay_time)
            pip.blow_out(well.meniscus(z=2, target="end"))
            protocol.delay(seconds=delay_time)
        else:
            pip.move_to(well.top())
        pip.touch_tip(well)

    def transfer_mm(
        src: Well, destination: List[any], volume: float, multi_disp: bool = False
    ) -> None:
        """Transfer Mastermix to Sample Plate."""
        global open_location
        # Distribute is for mastermix multi-dispense to sample plate

        pip.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=col_tips)
        try:
            pip.pick_up_tip()
        except Exception:
            new_location = col_tips[0].parent
            new_open_location = col_tips[1].parent
            protocol.move_labware(col_tips.pop(0), open_location, use_gripper=True)
            protocol.move_labware(col_tips[0], new_location, use_gripper=True)
            open_location = new_open_location
            pip.pick_up_tip()
        if multi_disp:
            for i in range(2 if ninety_six else 1):
                pip.aspirate(
                    49 - pip.current_volume,
                    location=src.meniscus(z=-1, target="start"),
                    end_location=src.meniscus(z=-1, target="end"),
                    rate=0.2,
                )  # aspirate extra (backlash compensation)
                protocol.delay(seconds=delay_time)
                pip.dispense(
                    2, src.bottom(1.25)
                )  # get rid of backlash compensation volume
                # Retract
                pip.move_to(src.top())
                for well in destination[i]:
                    pip.dispense(volume, well.bottom(2))
                    pip.blow_out(well.meniscus(z=2, target="end"))
                    protocol.delay(seconds=delay_time)
                    pip.touch_tip()
                    pip.move_to(well.top())
                protocol.delay(seconds=delay_time)
            pip.drop_tip()

        else:
            length = (
                12 if ninety_six else 6
            )  # determines how many iterations should be run through
            for i in range(length):
                volume = 9.1 + i * 0.15
                protocol.comment(f"\nVOLUME: {volume}")
                pip.prepare_to_aspirate()
                pip.aspirate(
                    volume + 1.5 if i == 0 else volume,
                    location=src.meniscus(z=-1, target="start"),
                    end_location=src.meniscus(z=-1, target="end"),
                    rate=0.35,
                )
                protocol.delay(seconds=delay_time)
                # Retract
                pip.move_to(src.top(10))
                pip.move_to(destination[i].top(10))
                pip.dispense(
                    volume,
                    location=destination[i].meniscus(z=-1, target="start"),
                    end_location=destination[i].meniscus(z=-1, target="end"),
                    rate=0.2 if volume <= 5 else 1,
                    push_out=0,
                )
                pip.blow_out(destination[i].meniscus(z=2, target="end"))
                pip.touch_tip()
                protocol.delay(seconds=delay_time)
                pip.move_to(destination[i].top())

            pip.drop_tip()

    def transfer_ep(src: Well, destination: Well, volume: float) -> None:
        """Transfer Extension Product to Sample Plate."""
        global open_location

        if (
            ninety_six
        ):  # for transferring extension product to sample plate in one single asp/disp
            pip.configure_nozzle_layout(style=ALL)
            pip.configure_for_volume(volume)
            pip.pick_up_tip(full_tips)
            pip.aspirate(
                volume,
                location=src.meniscus(z=-1, target="start"),
                end_location=src.meniscus(z=-1, target="end"),
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                volume, destination.meniscus(z=-1, target="end")
            )  # reverse pipetting slightly more than actual volume
            protocol.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tip
            pip.move_to(destination.top())
            protocol.delay(seconds=delay_time)
            pip.return_tip()

        else:
            pip.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=col_tips)

            pip.configure_for_volume(volume)
            pip.pick_up_tip(
                col_tips[0].wells()[5 * 8 if mmx_to_sample_plate else 6 * 8]
            )
            pip.aspirate(
                volume,
                location=src.meniscus(z=-1, target="start"),
                end_location=src.meniscus(z=-1, target="end"),
                rate=0.2,
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                volume,
                location=destination.meniscus(z=-1, target="start"),
                end_location=destination.meniscus(z=-1, target="end"),
                rate=0.2,
            )
            pip.blow_out(destination.meniscus(z=2, target="end"))
            protocol.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tips
            pip.move_to(destination.top(-2))
            pip.drop_tip()

    def transfer_ifp(
        src: List[Well],
        destination: List[Well],
        volume: float,
        col_tips: List[Labware],
        prim: bool = False,
    ) -> None:
        """Transfer Sample to IFP Chip."""
        global open_location

        pip.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=col_tips)

        length = (
            12 if ninety_six else 6
        )  # determines how many iterations should be run through

        for i in range(length):
            if ninety_six:
                try:
                    if any(is_in_staging_slot(tip_rack) for tip_rack in pip.tip_racks):
                        raise Exception("Tiprack in staging slot")  # Trigger move logic
                    pip.pick_up_tip()
                except Exception:
                    current_tiprack = col_tips[0]
                    next_tiprack = col_tips[1]

                    current_slot = current_tiprack.parent
                    next_slot = next_tiprack.parent

                    protocol.move_labware(
                        current_tiprack, open_location, use_gripper=True
                    )
                    protocol.move_labware(next_tiprack, current_slot, use_gripper=True)

                    open_location = next_slot
                    col_tips = col_tips[1:] + [col_tips[0]]
                    pip.tip_racks = col_tips

                    # Final safety check before picking up a tip
                    if is_in_staging_slot(pip.tip_racks[0]):
                        raise Exception(
                            f"Cannot pick up tip from staging slot: {pip.tip_racks[0].parent}"
                        )

                    pip.pick_up_tip()
            else:
                if mmx_to_sample_plate:
                    if i == 5 and prim:
                        loc = col_tips[0].parent
                        protocol.move_labware(
                            col_tips.pop(0), open_location, use_gripper=True
                        )
                        protocol.move_labware(col_tips[0], loc, use_gripper=True)

                pip.pick_up_tip(ifp_tips.pop(0))
            pip.aspirate(
                volume + 4,
                location=src[i].meniscus(z=-1, target="start"),
                end_location=src[i].meniscus(z=-1, target="end"),
                rate=0.2 if volume <= 5 else 1,
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                2,
                location=src[i].meniscus(z=-1, target="start"),
                end_location=src[i].meniscus(z=-1, target="end"),
            )  # compensate for backlash
            # Retract
            pip.dispense(
                volume + 1,
                destination[i].meniscus(z=-1, target="end"),
                rate=0.2 if volume <= 5 else 1,
            )
            pip.blow_out(destination[i].meniscus(z=2, target="end"))
            pip.touch_tip()
            protocol.delay(seconds=delay_time)
            pip.aspirate(
                10
            )  # move liquid towards top of tip so that there is no splatter when dropping the tips
            pip.drop_tip()

        if not mmx_to_sample_plate and prim:
            loc = col_tips[0].parent
            protocol.move_labware(col_tips.pop(0), open_location, use_gripper=True)
            protocol.move_labware(col_tips[0], loc, use_gripper=True)


    if mmx_to_sample_plate:
        protocol.comment(
            "\n*****\nTransferring Mastermix to Each Well of Sample Plate\n*****\n"
        )
        transfer_mm(
            mastermix, mm_dest, mm_vol, multi_disp=False if ninety_six else False
        )
    if ep_to_sample_plate:
        protocol.comment(
            "\n*****\nTransferring Extension Product to Each Well of Sample Plate\n*****\n"
        )
        transfer_ep(extension_source, sample_dest, pcr_product_vol)
    if primer_to_chip:
        protocol.comment("\n*****\nTransferring Primers to IFP Chip\n*****\n")
        transfer_ifp(
            primer_source, ifp_primer_dests, ifc_vol, col_tips=col_tips, prim=True
        )
    if sample_to_chip:
        protocol.comment("\n*****\nTransferring Sample to IFP Chip\n*****\n")
        transfer_ifp(sample_source, ifp_samp_dests, ifc_vol, col_tips=col_tips)

    protocol.move_labware(col_tips[-1], "C4", use_gripper=True)
    protocol.move_labware(col_tips[-2], "A1", use_gripper=True)
    pip.configure_nozzle_layout(
        style=SINGLE,
        start="A1",
        tip_racks=col_tips,
    )  # Resetting to all tips for liquid tracking
    liquid_heights = {}
    pip.pick_up_tip()
    for ifp_plate_well in ifp_plate.wells():
        if ifp_plate_well.current_liquid_height() > 1:
            pip.measure_liquid_height(ifp_plate[ifp_plate_well.well_name])
        height = ifp_plate[ifp_plate_well.well_name].current_liquid_height()
        liquid_heights[ifp_plate_well.well_name] = height
    protocol.comment(str(liquid_heights))
    protocol.capture_image(filename="end_of_run")
    