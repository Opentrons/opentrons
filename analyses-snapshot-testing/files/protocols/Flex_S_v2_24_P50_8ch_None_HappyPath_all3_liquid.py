requirements = {"robotType": "Flex", "apiLevel": "2.24"}
metadata = {"protocolName": "P50 8ch volume < tip volume - transfer, distribute, consolidate, _liquid"}


def run(ctx):
    # Stock liquid classes
    water_class = ctx.get_liquid_class("water")
    ethanol_class = ctx.get_liquid_class("ethanol_80")
    glycerol_class = ctx.get_liquid_class("glycerol_50")

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
    WATER_SOURCE_WELL = "A1"
    WATER_SOURCE_COLUMN_WELLS = source.columns()[0]
    ETHANOL_SOURCE_WELL = "A2"
    ETHANOL_SOURCE_COLUMN_WELLS = source.columns()[1]
    GLYCEROL_SOURCE_WELL = "A3"
    GLYCEROL_SOURCE_COLUMN_WELLS = source.columns()[2]

    WATER_SOURCE_WELLS = [WATER_SOURCE_WELL, "A5", "A6", "A7"]
    WATER_SOURCE_COLUMNS_WELLS = [source.columns()[0], source.columns()[4], source.columns()[5], source.columns()[6]]
    ETHANOL_SOURCE_WELLS = [ETHANOL_SOURCE_WELL, "A8", "A9", "A10", "A11"]
    ETHANOL_SOURCE_COLUMNS_WELLS = [
        source.columns()[1],
        source.columns()[7],
        source.columns()[8],
        source.columns()[9],
        source.columns()[10],
    ]
    GLYCEROL_SOURCE_WELLS = [GLYCEROL_SOURCE_WELL, "A12"]
    GLYCEROL_SOURCE_COLUMNS_WELLS = [source.columns()[2], source.columns()[11]]

    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")

    # Load liquids into source wells
    for well in WATER_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=water, volume=14000)
    for well in ETHANOL_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=ethanol, volume=14000)
    for well in GLYCEROL_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=glycerol, volume=14000)

    # Target
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    target = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")
    WATER_TARGET_COLUMN_WELLS = target.columns()[0]
    ETHANOL_TARGET_COLUMN_WELLS = target.columns()[1]
    GLYCEROL_TARGET_COLUMN_WELLS = target.columns()[2]

    WATER_TARGET_COLUMNS_WELLS = [target.columns()[3], target.columns()[4]]
    ETHANOL_TARGET_COLUMNS_WELLS = [target.columns()[5], target.columns()[6]]
    GLYCEROL_TARGET_COLUMNS_WELLS = [target.columns()[7], target.columns()[8]]

    # Transfer with regular tips

    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=tipracks)
    volume = 41.5
    new_tip = "once"
    # new_tip = "always"

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMN_WELLS,
        dest=WATER_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMN_WELLS,
        dest=ETHANOL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMN_WELLS,
        dest=GLYCEROL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    # Distribute with regular tips

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMN_WELLS,
        dest=WATER_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMN_WELLS,
        dest=ETHANOL_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMN_WELLS,
        dest=GLYCEROL_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    # Consolidate with regular tips
    volume = 244
    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMNS_WELLS,
        dest=WATER_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMNS_WELLS,
        dest=ETHANOL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMNS_WELLS,
        dest=GLYCEROL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    # Now with filter tips !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    pipette_8ch_50.tip_racks = filter_tipracks
    volume = 33
    new_tip = "once"
    # new_tip = "always"

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMN_WELLS,
        dest=WATER_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMN_WELLS,
        dest=ETHANOL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMN_WELLS,
        dest=GLYCEROL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    # Distribute with filter tips

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMN_WELLS,
        dest=WATER_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMN_WELLS,
        dest=ETHANOL_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMN_WELLS,
        dest=GLYCEROL_TARGET_COLUMNS_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    # Consolidate with filter tips
    volume = 15
    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=WATER_SOURCE_COLUMNS_WELLS,
        dest=WATER_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ETHANOL_SOURCE_COLUMNS_WELLS,
        dest=ETHANOL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )

    pipette_8ch_50.consolidate_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=GLYCEROL_SOURCE_COLUMNS_WELLS,
        dest=GLYCEROL_TARGET_COLUMN_WELLS,
        new_tip=new_tip,
        trash_location=trash,
    )
