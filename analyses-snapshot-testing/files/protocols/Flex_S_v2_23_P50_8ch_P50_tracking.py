from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, PARTIAL_COLUMN
import math

requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "Track liquid volume"}


def comment_labware_well_volume_status(ctx, labware):
    """
    Log the volume status for each well in a labware.

    Each row will print a line with the well name and its volume in microliters.

    Args:
        ctx: The protocol context, used to call `comment()`.
        labware: The labware object containing wells with volume info.
    """
    ctx.comment(f"Labware: {labware.name} on {labware.parent}")  # More readable identifier

    # Iterate over each row by index
    for row_index, row in enumerate(labware.rows()):
        status_line = ""
        for col_index, column in enumerate(labware.columns()):
            well = column[row_index]
            try:
                volume = well.current_liquid_volume()
            except:
                volume = "❌"
            status_line += f"{well.display_name.split(' of ')[0]}: {volume}  "
        ctx.comment(status_line)


def color_wells_with_liquid(labware, liquid):
    """
    Color the wells of a labware with a specific liquid.

    Args:
        labware: The labware object containing wells to be colored.
        liquid: The liquid object used to color the wells.
    """
    for well in labware.wells():
        try:
            volume = well.current_liquid_volume()
            if volume > 0:
                well.load_liquid(liquid=liquid, volume=volume)
        except:
            pass


def run(ctx):

    tiprack_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    tiprack_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B3")
    tiprack_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    filter_tiprack_1 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C1")
    filter_tiprack_2 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C2")
    filter_tiprack_3 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C3")
    tipracks = [tiprack_1, tiprack_2, tiprack_3]
    filter_tipracks = [filter_tiprack_1, filter_tiprack_2, filter_tiprack_3]
    trash = ctx.load_trash_bin("A3")

    # Liquids to transfer
    # Using a 15 mL reservoir as source
    # 1 row, 12 columns
    # https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
    source = ctx.load_labware("nest_12_reservoir_15ml", "B1", "source")

    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")
    filled = ctx.define_liquid(name="Has Liquid", description="Not Empty", display_color="#FF69B4")

    # Load liquids into source wells
    source_start_volume = 14000
    source.load_liquid(wells=[source.wells_by_name()["A1"]], liquid=water, volume=source_start_volume)
    source.load_liquid(wells=[source.wells_by_name()["A2"]], liquid=ethanol, volume=source_start_volume)
    source.load_liquid(wells=[source.wells_by_name()["A3"]], liquid=glycerol, volume=source_start_volume)

    comment_labware_well_volume_status(ctx, source)

    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")
    # displays black in deck map
    dest.load_empty(wells=dest.wells())

    pipette_50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=filter_tipracks)

    pipette_50.pick_up_tip()
    volume = 44
    pipette_50.aspirate(volume, source.wells_by_name()["A1"])
    pipette_50.dispense(volume, dest.wells_by_name()["A1"])

    dest_volume = dest.wells_by_name()["A1"].current_liquid_volume()
    assert math.isclose(volume, dest_volume, rel_tol=0.1, abs_tol=0.1), f"Expected volume {volume}, got {dest_volume}"

    actual_source_volume = source.wells_by_name()["A1"].current_liquid_volume()
    expected_source_volume = source_start_volume - volume
    assert math.isclose(
        expected_source_volume, actual_source_volume, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_source_volume}, got {actual_source_volume}"

    comment_labware_well_volume_status(ctx, dest)

    volume2 = 10

    pipette_50.aspirate(volume2, source.wells_by_name()["A1"])
    pipette_50.dispense(volume2, dest.wells_by_name()["A1"])

    expected_dest_volume = volume2 + volume
    dest_volume2 = dest.wells_by_name()["A1"].current_liquid_volume()
    assert math.isclose(
        expected_dest_volume, dest_volume2, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_dest_volume}, got {dest_volume2}"
    actual_source_volume2 = source.wells_by_name()["A1"].current_liquid_volume()
    expected_source_volume2 = expected_source_volume - volume2
    assert math.isclose(
        expected_source_volume2, actual_source_volume2, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_source_volume2}, got {actual_source_volume2}"

    comment_labware_well_volume_status(ctx, dest)

    # Now transfer from a different source but still to A1 dest
    volume3 = 20
    pipette_50.aspirate(volume3, source.wells_by_name()["A2"])
    pipette_50.dispense(volume3, dest.wells_by_name()["A1"])
    dest_volume3 = dest.wells_by_name()["A1"].current_liquid_volume()

    expected_dest_volume3 = expected_dest_volume + volume3
    assert math.isclose(
        expected_dest_volume3, dest_volume3, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_dest_volume3}, got {dest_volume3}"
    actual_source_volume3 = source.wells_by_name()["A2"].current_liquid_volume()
    expected_source_volume3 = source_start_volume - volume3
    assert math.isclose(
        expected_source_volume3, actual_source_volume3, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_source_volume3}, got {actual_source_volume3}"
    comment_labware_well_volume_status(ctx, dest)

    # Now with 8 channel

    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=tipracks)
    pipette_8ch_50.pick_up_tip()
    m_volume = 44
    pipette_8ch_50.aspirate(m_volume, source.wells_by_name()["A3"])
    pipette_8ch_50.dispense(m_volume, dest.wells_by_name()["A3"])
    m_actual_source_volume = source.wells_by_name()["A3"].current_liquid_volume()
    m_dest_volume = dest.wells_by_name()["A1"].current_liquid_volume()

    m_expected_source_volume = source_start_volume - (m_volume * 8)

    assert math.isclose(
        m_expected_source_volume, m_actual_source_volume, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {m_expected_source_volume}, got {m_actual_source_volume}"

    for well in dest.columns()[2]:
        assert math.isclose(
            m_volume, well.current_liquid_volume(), rel_tol=0.1, abs_tol=0.1
        ), f"Expected volume {m_volume}, got {well.current_liquid_volume()}"

    color_wells_with_liquid(dest, filled)
