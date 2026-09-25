"""Olink Target 48/96 Protocol."""

from opentrons.protocol_api import (
    ALL,
    COLUMN,
    SINGLE,
    ParameterContext,
    ProtocolContext,
    Well,
    Labware,
)
from opentrons.types import Location
from typing import List, Any, Literal

metadata = {
    "protocolName": "Olink Target 96/ 48 v3 Deck Safe",
    "author": "Zachary Galluzzo <zachary.galluzzo@opentrons.com>",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

# Home slots of the empty racks that collect used tips. Only D2 can be pipetted
# with a partial nozzle layout, so full racks are swapped out to the holding slots.
USED_TIP_SLOTS = ["D2", "A4", "C4"]
PARK_SLOT = "D2"
# Staging source racks are gripped onto A1 to be pipetted.
SOURCE_PIPETTING_SLOT = "A1"
# Somewhere to set a rack down mid-swap. D3 leads because a rack there blocks
# nothing: the idle nozzles overhang west, and D3 is the easternmost deck column.
HOLDING_SLOTS = ("D3", "A4", "C4", "B4")
# Closest the tips may get to a well floor. Meniscus targets are taken 1 mm below
# the surface, which lands under the floor once a well is down to a few microliters.
MIN_HANDLING_HEIGHT = 2.0


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
    p.add_bool(
        variable_name="enable_camera",
        display_name="Enable Camera",
        description="Capture start- and end-of-run images.",
        default=False,
    )


def run(protocol: ProtocolContext) -> None:
    """Main function to run the protocol."""
    enable_camera = protocol.params.enable_camera  # type: ignore[attr-defined]
    if enable_camera:
        protocol.capture_image(filename="start_of_run")

    # Import Parameters
    mmx_to_sample_plate = protocol.params.mmx_to_sample_plate  # type: ignore[attr-defined]
    ep_to_sample_plate = protocol.params.ep_to_sample_plate  # type: ignore[attr-defined]
    mm_col = protocol.params.mm_col  # type: ignore[attr-defined]
    primer_to_chip = protocol.params.primer_to_chip  # type: ignore[attr-defined]
    sample_to_chip = protocol.params.sample_to_chip  # type: ignore[attr-defined]
    num_samples = protocol.params.num_samples  # type: ignore[attr-defined]

    ninety_six = True if num_samples == 96 else False
    protocol.comment("Protocol Version: 03")

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
    tip_rack_homes: dict[Labware, str] = {col_tips_1: "A1", col_tips_2: "B3"}

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
        tip_rack_homes[col_tips_3] = "B4"

    # With COLUMN + start="A12" the idle nozzles hang to the LEFT of the active
    # column, so column N is only reachable once columns 1..N-1 are empty. That
    # rules out return_tip(): it refills those columns and the next pickup would
    # drag them along. Instead every used column is dropped into a dedicated
    # used-tip rack and left there; the reverse protocol moves them back to their
    # origin wells so the next forward run starts from full source racks.
    used_tip_racks = [
        protocol.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", slot, f"Used Tips #{i + 1}"
        )
        for i, slot in enumerate(USED_TIP_SLOTS[: 3 if ninety_six else 2])
    ]
    for used_rack in used_tip_racks:
        used_rack.set_empty()
        tip_rack_homes[used_rack] = str(used_rack.parent).strip()

    # Columns are consumed A1→A12 of each source rack in order and parked in the
    # same order. The reverse protocol rebuilds this mapping from the parameters.
    source_columns: List[Well] = []
    for rack in col_tips:
        source_columns.extend(rack.rows()[0])
    park_columns: List[Well] = []
    for used_rack in used_tip_racks:
        park_columns.extend(used_rack.rows()[0])
    parked_count = 0

    def slot_of(rack: Labware) -> str:
        return str(rack.parent).strip()

    def free_holding_slot() -> str:
        occupied = {slot_of(rack) for rack in tip_rack_homes}
        for slot in HOLDING_SLOTS:
            if slot not in occupied:
                return slot
        raise RuntimeError("No free holding slot available for a tip rack")

    def place_on(rack: Labware, slot: str) -> None:
        """Put a tip rack on a slot, moving whatever sits there out of the way."""
        if slot_of(rack) == slot:
            return
        for other in tip_rack_homes:
            if other is not rack and slot_of(other) == slot:
                protocol.move_labware(other, free_holding_slot(), use_gripper=True)
                break
        protocol.move_labware(rack, slot, use_gripper=True)

    def restore_tip_rack_slots() -> None:
        """Return every tip rack to its home slot, breaking any move cycle."""
        for _ in range(2 * len(tip_rack_homes) + 4):
            misplaced = [r for r, home in tip_rack_homes.items() if slot_of(r) != home]
            if not misplaced:
                return
            progressed = False
            for rack in misplaced:
                home = tip_rack_homes[rack]
                if all(slot_of(o) != home for o in tip_rack_homes if o is not rack):
                    protocol.move_labware(rack, home, use_gripper=True)
                    progressed = True
            if not progressed:
                protocol.move_labware(
                    misplaced[0], free_holding_slot(), use_gripper=True
                )
        raise RuntimeError("Could not restore tip racks to their home slots")

    def pick_column_tip() -> None:
        """Pick the next fresh column and stage the rack it will be parked in."""
        origin = source_columns.pop(0)
        # Both racks are positioned before pickup so nothing moves with tips on.
        place_on(park_columns[parked_count].parent, PARK_SLOT)  # type: ignore[arg-type]
        if slot_of(origin.parent).endswith("4"):  # type: ignore[arg-type]
            place_on(origin.parent, SOURCE_PIPETTING_SLOT)  # type: ignore[arg-type]
        pip.pick_up_tip(origin)

    def park_column_tips() -> None:
        """Leave the used tips in the used-tip rack staged during pickup."""
        nonlocal parked_count
        pip.drop_tip(park_columns[parked_count])
        parked_count += 1

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

    # Load Labware
    primer_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "Primer Plate"
    )
    sample_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Plate"
    )
    sample_plate.load_empty(sample_plate.wells())
    ifp_plate = protocol.load_labware(
        "biorad_384_wellplate_50ul" if ninety_six else "fluidigm_ifp_48.48",
        "C2",
        "IFP Chip",
    )
    ifp_plate.load_empty(ifp_plate.wells())
    product_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C1", "Extension Product Plate"
    )
    mm_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3", "Mastermix Plate"
    )
    mastermix = mm_plate.wells()[8 * mm_col]  # 1 single column
    mm_dest = sample_plate.rows()[0][: 12 if ninety_six else 6]
    extension_source = product_plate.wells()[0]
    sample_dest = sample_plate.wells()[0]

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

    def safe_meniscus(
        well: Well,
        z: float,
        target: Literal["start", "end"],
        volume: float = 0.0,
    ) -> Location:
        """Meniscus position, floored at MIN_HANDLING_HEIGHT above the well bottom.

        `volume` is the volume the pending operation moves, negative to aspirate and
        positive to dispense, and is only needed when targeting the end meniscus.
        """
        height = (
            well.estimate_liquid_height_after_pipetting(pip.mount, volume)
            if target == "end"
            else well.current_liquid_height()
        )
        if isinstance(height, (int, float)) and height + z < MIN_HANDLING_HEIGHT:
            return well.bottom(MIN_HANDLING_HEIGHT)
        return well.meniscus(z=z, target=target)

    def mixing(well: Well, vol: float, blow_out: bool = True, reps: int = 8) -> None:
        """Mixing Function."""
        pip.aspirate(1, well.top(1))
        for m in range(reps):
            pip.aspirate(vol, safe_meniscus(well, -1, "end", -vol))
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
        src: Well, destination: List[Any], volume: float, multi_disp: bool = False
    ) -> None:
        """Transfer Mastermix to Sample Plate."""
        # Distribute is for mastermix multi-dispense to sample plate

        pip.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=col_tips)
        pick_column_tip()
        if multi_disp:
            for i in range(2 if ninety_six else 1):
                asp_vol = 49 - pip.current_volume
                pip.aspirate(
                    asp_vol,
                    location=safe_meniscus(src, -1, "start"),
                    end_location=safe_meniscus(src, -1, "end", -asp_vol),
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
            park_column_tips()

        else:
            length = (
                12 if ninety_six else 6
            )  # determines how many iterations should be run through
            for i in range(length):
                volume = 9.1 + i * 0.15
                protocol.comment(f"\nVOLUME: {volume}")
                pip.prepare_to_aspirate()
                asp_vol = volume + 1.5 if i == 0 else volume
                pip.aspirate(
                    asp_vol,
                    location=safe_meniscus(src, -1, "start"),
                    end_location=safe_meniscus(src, -1, "end", -asp_vol),
                    rate=0.35,
                )
                protocol.delay(seconds=delay_time)
                # Retract
                pip.move_to(src.top(10))
                pip.move_to(destination[i].top(10))
                pip.dispense(
                    volume,
                    location=safe_meniscus(destination[i], -1, "start"),
                    end_location=safe_meniscus(destination[i], -1, "end", volume),
                    rate=0.2 if volume <= 5 else 1,
                    push_out=0,
                )
                pip.blow_out(destination[i].meniscus(z=2, target="end"))
                pip.touch_tip()
                protocol.delay(seconds=delay_time)
                pip.move_to(destination[i].top())

            park_column_tips()

    def transfer_ep(src: Well, destination: Well, volume: float) -> None:
        """Transfer Extension Product to Sample Plate."""
        if (
            ninety_six
        ):  # for transferring extension product to sample plate in one single asp/disp
            pip.configure_nozzle_layout(style=ALL)
            pip.configure_for_volume(volume)
            pip.pick_up_tip(full_tips)
            pip.aspirate(
                volume,
                location=safe_meniscus(src, -1, "start"),
                end_location=safe_meniscus(src, -1, "end", -volume),
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                volume, safe_meniscus(destination, -1, "end", volume)
            )  # reverse pipetting slightly more than actual volume
            protocol.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tip
            pip.move_to(destination.top())
            protocol.delay(seconds=delay_time)
            pip.return_tip()

        else:
            pip.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=col_tips)

            pip.configure_for_volume(volume)
            # Borrow one tip from the next fresh column and put it straight back,
            # so the column is still complete when it is picked with COLUMN later.
            pip.pick_up_tip(source_columns[0])
            pip.aspirate(
                volume,
                location=safe_meniscus(src, -1, "start"),
                end_location=safe_meniscus(src, -1, "end", -volume),
                rate=0.2,
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                volume,
                location=safe_meniscus(destination, -1, "start"),
                end_location=safe_meniscus(destination, -1, "end", volume),
                rate=0.2,
            )
            pip.blow_out(destination.meniscus(z=2, target="end"))
            protocol.delay(seconds=delay_time)
            mixing(destination, 6, reps=2)  # rinse sample off tips
            pip.move_to(destination.top(-2))
            pip.return_tip()

    def transfer_ifp(
        src: List[Well],
        destination: List[Well],
        volume: float,
        col_tips: List[Labware],
    ) -> None:
        """Transfer Sample to IFP Chip."""
        pip.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=col_tips)

        length = (
            12 if ninety_six else 6
        )  # determines how many iterations should be run through

        for i in range(length):
            pick_column_tip()
            asp_vol = volume + 4
            pip.aspirate(
                asp_vol,
                location=safe_meniscus(src[i], -1, "start"),
                end_location=safe_meniscus(src[i], -1, "end", -asp_vol),
                rate=0.2 if volume <= 5 else 1,
            )
            protocol.delay(seconds=delay_time)
            pip.dispense(
                2,
                location=safe_meniscus(src[i], -1, "start"),
                end_location=safe_meniscus(src[i], -1, "end", 2),
            )  # compensate for backlash
            # Retract
            pip.dispense(
                volume + 1,
                safe_meniscus(destination[i], -1, "end", volume + 1),
                rate=0.2 if volume <= 5 else 1,
            )
            pip.blow_out(destination[i].meniscus(z=2, target="end"))
            pip.touch_tip()
            protocol.delay(seconds=delay_time)
            pip.aspirate(
                10
            )  # move liquid towards top of tip so that there is no splatter when dropping the tips
            park_column_tips()

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
        transfer_ifp(primer_source, ifp_primer_dests, ifc_vol, col_tips=col_tips)
    if sample_to_chip:
        protocol.comment("\n*****\nTransferring Sample to IFP Chip\n*****\n")
        transfer_ifp(sample_source, ifp_samp_dests, ifc_vol, col_tips=col_tips)

    if parked_count:
        # Probe with the last parked tip — the source racks are empty by now.
        probe_tip = park_columns[parked_count - 1]
        place_on(probe_tip.parent, PARK_SLOT)  # type: ignore[arg-type]
        pip.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=used_tip_racks)
        liquid_heights = {}
        pip.pick_up_tip(probe_tip)
        for ifp_plate_well in ifp_plate.wells():
            if ifp_plate_well.current_liquid_height() > 1:
                pip.measure_liquid_height(ifp_plate[ifp_plate_well.well_name])
            height = ifp_plate[ifp_plate_well.well_name].current_liquid_height()
            liquid_heights[ifp_plate_well.well_name] = height
        protocol.comment(str(liquid_heights))
        pip.return_tip()

    protocol.comment(f"\nUsed columns left for the reverse protocol: {parked_count}\n")
    restore_tip_rack_slots()

    pip.reset_tipracks()
    if enable_camera:
        protocol.capture_image(filename="end_of_run")
