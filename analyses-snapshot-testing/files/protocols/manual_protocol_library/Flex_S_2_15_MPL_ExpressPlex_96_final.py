def get_values(*names):
    import json

    _all_values = json.loads("""{"DryRun":true,"Plates":"1","protocol_filename":"ExpressPlex_96_final"}""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api

metadata = {"author": "DAndra Howell <dandra.howell@opentrons.com>", "source": "Protocol Library"}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}


def run(ctx):

    Plates = 2
    DryRun = True

    try:
        [DryRun, Plates] = get_values("DryRun", "Plates")  # noqa: F821

    except NameError:
        pass
        # get values not defined

    Plates = int(Plates)

    # Modules
    heater_shaker = ctx.load_module("heaterShakerModuleV1", "10")
    hs_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    # Labware
    Index_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1, "Indices_1")
    Reagent_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 2, "Reaction Plate_1")
    DNA_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 3)
    # Locations
    Index_1 = Index_Plate_1["A1"]
    Reagent_1 = Reagent_Plate_1["A1"]
    DNA_1 = DNA_Plate_1["A1"]
    tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "4", adapter="opentrons_flex_96_tiprack_adapter")
    tiprack_50_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "5", adapter="opentrons_flex_96_tiprack_adapter")
    if Plates == 2:
        Index_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 7, "Indices_2")
        Reagent_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 8, "Reaction Plate_2")
        DNA_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 9)
        # Locations
        Index_2 = Index_Plate_2["A1"]
        Reagent_2 = Reagent_Plate_2["A1"]
        DNA_2 = DNA_Plate_2["A1"]
        tiprack_50_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "6", adapter="opentrons_flex_96_tiprack_adapter")
        tiprack_50_4 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "11", adapter="opentrons_flex_96_tiprack_adapter")
    Tips = [tiprack_50_1, tiprack_50_2] if Plates == 1 else [tiprack_50_1, tiprack_50_2, tiprack_50_3, tiprack_50_4]

    # Pipettes
    pip = ctx.load_instrument("flex_96channel_1000", "left", tip_racks=Tips)
    pip.flow_rate.aspirate = 2
    pip.flow_rate.dispense = 3
    pip.default_speed = 280

    # Liquid Definitions
    Index = ctx.define_liquid(name="Indices 1", description="Index Plate color", display_color="#0000ff")
    Index2 = ctx.define_liquid(name="Indices 2", description="Index2 Plate color", display_color="#ff00ff")
    for well in Index_Plate_1.wells():
        well.load_liquid(liquid=Index, volume=8)
    if Plates == 2:
        for well in Index_Plate_2.wells():
            well.load_liquid(liquid=Index2, volume=8)
    Reaction_Plate = ctx.define_liquid(name="Reaction Plate", description="Reaction Plate color", display_color="#ff0066")
    for well in Reagent_Plate_1.wells():
        well.load_liquid(liquid=Reaction_Plate, volume=8)
    if Plates == 2:
        for well in Reagent_Plate_2.wells():
            well.load_liquid(liquid=Reaction_Plate, volume=8)
    DNA = ctx.define_liquid(name="DNA 1", description="DNA Plate color", display_color="#009900")
    DNA2 = ctx.define_liquid(name="DNA 2", description="DNA2 Plate color", display_color="#ffcc00")
    for well in DNA_Plate_1.wells():
        well.load_liquid(liquid=DNA, volume=10)
    if Plates == 2:
        for well in DNA_Plate_2.wells():
            well.load_liquid(liquid=DNA2, volume=10)

    def Index_transfer(vol1, start_loc, end_loc):
        pip.pick_up_tip()
        pip.aspirate(vol1 + 2, start_loc.bottom(z=1))  # Reverse Pipette as not to introduce bubbles
        ctx.delay(seconds=10)
        pip.dispense(vol1, end_loc.bottom(z=1.5))
        ctx.delay(seconds=20)
        if DryRun == False:
            pip.drop_tip()
        else:
            pip.return_tip()

    def DNA_transfer(vol1, start_loc, end_loc):
        pip.pick_up_tip()
        pip.aspirate(vol1 + 2, start_loc.bottom(z=1))  # Reverse Pipette as not to introduce bubbles
        ctx.delay(seconds=5)
        pip.dispense(vol1, end_loc.bottom(z=1.5))
        ctx.delay(seconds=10)
        if DryRun == False:
            pip.drop_tip()
        else:
            pip.return_tip()

    def move_plate(labware, new_location):
        ctx.move_labware(
            labware,
            new_location,
            use_gripper=False,
        )

    # Commands
    heater_shaker.open_labware_latch()
    Index_transfer(4, Index_1, Reagent_1)
    DNA_transfer(4, DNA_1, Reagent_1)

    ctx.pause("Seal and manually place Reaction Plate 1 onto heater shaker")
    move_plate(Reagent_Plate_1, hs_adapter)
    heater_shaker.close_labware_latch()
    heater_shaker.set_and_wait_for_shake_speed(3000)
    ctx.delay(minutes=1.5)
    heater_shaker.deactivate_shaker()
    heater_shaker.open_labware_latch()
    move_plate(Reagent_Plate_1, protocol_api.OFF_DECK)
    ctx.comment("Seal and place Reagent Plate 1 into preprogrammed thermocycler")

    if Plates == 2:
        Index_transfer(4, Index_2, Reagent_2)
        DNA_transfer(4, DNA_2, Reagent_2)

        ctx.pause("Seal and manually place Reagent Plate 2 onto heater shaker")
        move_plate(Reagent_Plate_2, hs_adapter)
        heater_shaker.close_labware_latch()
        heater_shaker.set_and_wait_for_shake_speed(3000)
        ctx.delay(minutes=1.5)
        heater_shaker.deactivate_shaker()
        heater_shaker.open_labware_latch()
        move_plate(Reagent_Plate_2, protocol_api.OFF_DECK)
        ctx.comment("Seal and place Reagent Plate 2 into preprogrammed thermocycler")

    ctx.home()
