def get_values(*names):
    import json

    _all_values = json.loads("""{"DryRun":false,"Plates":"4","columns":12,"protocol_filename":"ExpressPlex_Pooling_Final"}""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api
from opentrons import types
from opentrons.types import Point

metadata = {"author": "DAndra Howell <dandra.howell@opentrons.com>", "source": "Protocol Library"}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}


def run(ctx):
    # Parameters
    DryRun = False
    Plates = 4
    if Plates == 1:
        columns = 12
    else:
        columns = 12

    try:
        [DryRun, Plates, columns] = get_values("DryRun", "Plates", "columns")  # noqa: F821
    except NameError:
        pass
        # get values not defined

    Plates = int(Plates)

    # Modules
    heater_shaker = ctx.load_module("heaterShakerModuleV1", "10")
    hs_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")
    tiprack_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "11")

    # Prepare 4 2ml tubes; place in A1, A3, A5 and C1 of tube rack
    Final_pool_tube = ctx.load_labware("opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap", "7", "Final Pool")
    Pool_Plate = hs_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Pooling Plate")

    # Deck Setup, Liquids abd Locations
    if Plates == 1:
        Reagent_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1, "Ready Reaction Plate 1")
        tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "4")
        Tips = [tiprack_50_1]
        Reagent_1 = Reagent_Plate_1.rows()[0][:12]
        Pool_1 = Pool_Plate.wells()[:8]

        Reagent1 = ctx.define_liquid(name="Amplified Libraries_1", description="Amplified Libraries_1", display_color="#ff0000")
        for well in Reagent_Plate_1.wells()[: 8 * columns]:
            well.load_liquid(liquid=Reagent1, volume=16)

        FP_color1 = ctx.define_liquid(name="Final Pool", description="Final Pool", display_color="#ff0000")
        Final_pool_tube.wells()[0].load_liquid(liquid=FP_color1, volume=10 * columns)

        Pool_color1 = ctx.define_liquid(name="Pool 1", description="Pool 1", display_color="#ff0000")
        for well in Pool_Plate.wells()[:8]:
            well.load_liquid(liquid=Pool_color1, volume=12 * columns)
        # Lists
        reaction_plates = [Reagent_1]
        pool_columns = [Pool_1]
        pool_tubes = ["A1"]

    if Plates == 2:
        Reagent_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1, "Ready Reaction Plate 1")
        tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "4")
        Reagent_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 2, "Ready Reaction Plate 2")
        tiprack_50_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "5")
        Tips = [tiprack_50_1, tiprack_50_2]
        Reagent_1 = Reagent_Plate_1.rows()[0][:12]
        Pool_1 = Pool_Plate.wells()[:8]

        Reagent_2 = Reagent_Plate_2.rows()[0][:12]
        Pool_2 = Pool_Plate.wells()[16:24]

        Reagent1 = ctx.define_liquid(name="Amplified Libraries_1", description="Amplified Libraries_1", display_color="#ff0000")
        for well in Reagent_Plate_1.wells():
            well.load_liquid(liquid=Reagent1, volume=16)
        Reagent2 = ctx.define_liquid(name="Amplified Libraries_2", description="Amplified Libraries_1", display_color="#ff66cc")
        for well in Reagent_Plate_2.wells():
            well.load_liquid(liquid=Reagent2, volume=16)

        FP_color1 = ctx.define_liquid(name="Final Pool_1", description="Final Pool_1", display_color="#ff0000")
        Final_pool_tube.wells()[0].load_liquid(liquid=FP_color1, volume=120)
        FP_color2 = ctx.define_liquid(name="Final Pool_2", description="Final Pool_2", display_color="#ff66cc")
        Final_pool_tube.wells()[8].load_liquid(liquid=FP_color2, volume=120)

        Pool_color1 = ctx.define_liquid(name="Pool 1", description="Pool 1", display_color="#ff0000")
        for well in Pool_Plate.wells()[:8]:
            well.load_liquid(liquid=Pool_color1, volume=144)
        Pool_color2 = ctx.define_liquid(name="Pool 2", description="Pool 2", display_color="#ff66cc")
        for well in Pool_Plate.wells()[16:24]:
            well.load_liquid(liquid=Pool_color2, volume=144)

        # Lists
        reaction_plates = [Reagent_1, Reagent_2]
        pool_columns = [Pool_1, Pool_2]
        pool_tubes = ["A1", "A3"]

    if Plates == 3:
        Reagent_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1, "Ready Reaction Plate 1")
        tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "4")
        Reagent_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 2, "Ready Reaction Plate 2")
        tiprack_50_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "5")
        Reagent_Plate_3 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 3, "Ready Reaction Plate 3")
        tiprack_50_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "6")
        Tips = [tiprack_50_1, tiprack_50_2, tiprack_50_3]
        Reagent_1 = Reagent_Plate_1.rows()[0][:12]
        Pool_1 = Pool_Plate.wells()[:8]

        Reagent_2 = Reagent_Plate_2.rows()[0][:12]
        Pool_2 = Pool_Plate.wells()[16:24]

        Reagent_3 = Reagent_Plate_3.rows()[0][:12]
        Pool_3 = Pool_Plate.wells()[32:40]

        Reagent1 = ctx.define_liquid(name="Amplified Libraries_1", description="Amplified Libraries_1", display_color="#ff0000")
        for well in Reagent_Plate_1.wells():
            well.load_liquid(liquid=Reagent1, volume=16)
        Reagent2 = ctx.define_liquid(name="Amplified Libraries_2", description="Amplified Libraries_2", display_color="#ff66cc")
        for well in Reagent_Plate_2.wells():
            well.load_liquid(liquid=Reagent2, volume=16)
        Reagent3 = ctx.define_liquid(name="Amplified Libraries_3", description="Amplified Libraries_3", display_color="#00ff99")
        for well in Reagent_Plate_3.wells():
            well.load_liquid(liquid=Reagent3, volume=16)

        FP_color1 = ctx.define_liquid(name="Final Pool_1", description="Final Pool_1", display_color="#ff0000")
        Final_pool_tube.wells()[0].load_liquid(liquid=FP_color1, volume=120)
        FP_color2 = ctx.define_liquid(name="Final Pool_2", description="Final Pool_2", display_color="#ff66cc")
        Final_pool_tube.wells()[8].load_liquid(liquid=FP_color2, volume=120)
        FP_color3 = ctx.define_liquid(name="Final Pool_3", description="Final Pool_3", display_color="#00ff99")
        Final_pool_tube.wells()[16].load_liquid(liquid=FP_color3, volume=120)

        Pool_color1 = ctx.define_liquid(name="Pool 1", description="Pool 1", display_color="#ff0000")
        for well in Pool_Plate.wells()[:8]:
            well.load_liquid(liquid=Pool_color1, volume=144)
        Pool_color2 = ctx.define_liquid(name="Pool 2", description="Pool 2", display_color="#ff66cc")
        for well in Pool_Plate.wells()[16:24]:
            well.load_liquid(liquid=Pool_color2, volume=144)
        Pool_color3 = ctx.define_liquid(name="Pool 3", description="Pool 2", display_color="#00ff99")
        for well in Pool_Plate.wells()[32:40]:
            well.load_liquid(liquid=Pool_color3, volume=144)

        # Lists
        reaction_plates = [Reagent_1, Reagent_2, Reagent_3]
        pool_columns = [Pool_1, Pool_2, Pool_3]
        pool_tubes = ["A1", "A3", "A5"]

    if Plates == 4:
        Reagent_Plate_1 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 1, "Ready Reaction Plate 1")
        tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "4")
        Reagent_Plate_2 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 2, "Ready Reaction Plate 2")
        tiprack_50_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "5")
        Reagent_Plate_3 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 3, "Ready Reaction Plate 3")
        tiprack_50_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "6")
        Reagent_Plate_4 = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 8, "Ready Reaction Plate 4")
        tiprack_50_4 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "9")
        Tips = [tiprack_50_1, tiprack_50_2, tiprack_50_3, tiprack_50_4]
        Reagent_1 = Reagent_Plate_1.rows()[0][:12]
        Pool_1 = Pool_Plate.wells()[:8]

        Reagent_2 = Reagent_Plate_2.rows()[0][:12]
        Pool_2 = Pool_Plate.wells()[16:24]

        Reagent_3 = Reagent_Plate_3.rows()[0][:12]
        Pool_3 = Pool_Plate.wells()[32:40]

        Reagent_4 = Reagent_Plate_4.rows()[0][:12]
        Pool_4 = Pool_Plate.wells()[48:56]

        Reagent1 = ctx.define_liquid(name="Amplified Libraries_1", description="Amplified Libraries_1", display_color="#ff0000")
        for well in Reagent_Plate_1.wells():
            well.load_liquid(liquid=Reagent1, volume=16)
        Reagent2 = ctx.define_liquid(name="Amplified Libraries_2", description="Amplified Libraries_2", display_color="#ff66cc")
        for well in Reagent_Plate_2.wells():
            well.load_liquid(liquid=Reagent2, volume=16)
        Reagent3 = ctx.define_liquid(name="Amplified Libraries_3", description="Amplified Libraries_3", display_color="#00ff99")
        for well in Reagent_Plate_3.wells():
            well.load_liquid(liquid=Reagent3, volume=16)
        Reagent4 = ctx.define_liquid(name="Amplified Libraries_4", description="Amplified Libraries_4", display_color="#0066ff")
        for well in Reagent_Plate_4.wells():
            well.load_liquid(liquid=Reagent4, volume=16)

        FP_color1 = ctx.define_liquid(name="Final Pool_1", description="Final Pool_1", display_color="#ff0000")
        Final_pool_tube.wells()[0].load_liquid(liquid=FP_color1, volume=120)
        FP_color2 = ctx.define_liquid(name="Final Pool_2", description="Final Pool_2", display_color="#ff66cc")
        Final_pool_tube.wells()[8].load_liquid(liquid=FP_color2, volume=120)
        FP_color3 = ctx.define_liquid(name="Final Pool_3", description="Final Pool_3", display_color="#00ff99")
        Final_pool_tube.wells()[16].load_liquid(liquid=FP_color3, volume=120)
        FP_color4 = ctx.define_liquid(name="Final Pool_4", description="Final Pool_4", display_color="#0066ff")
        Final_pool_tube.wells()[2].load_liquid(liquid=FP_color4, volume=120)

        Pool_color1 = ctx.define_liquid(name="Pool 1", description="Pool 1", display_color="#ff0000")
        for well in Pool_Plate.wells()[:8]:
            well.load_liquid(liquid=Pool_color1, volume=144)
        Pool_color2 = ctx.define_liquid(name="Pool 2", description="Pool 2", display_color="#ff66cc")
        for well in Pool_Plate.wells()[16:24]:
            well.load_liquid(liquid=Pool_color2, volume=144)
        Pool_color3 = ctx.define_liquid(name="Pool 3", description="Pool 2", display_color="#00ff99")
        for well in Pool_Plate.wells()[32:40]:
            well.load_liquid(liquid=Pool_color3, volume=144)
        Pool_color4 = ctx.define_liquid(name="Pool 4", description="Pool 4", display_color="#0066ff")
        for well in Pool_Plate.wells()[48:56]:
            well.load_liquid(liquid=Pool_color4, volume=144)

        # Lists
        reaction_plates = [Reagent_1, Reagent_2, Reagent_3, Reagent_4]
        pool_columns = [Pool_1, Pool_2, Pool_3, Pool_4]
        pool_tubes = ["A1", "A3", "A5", "C1"]

    # Pipettes
    p20_multi = ctx.load_instrument("flex_8channel_50", "right", tip_racks=Tips)
    p20_multi.flow_rate.aspirate = 4
    p20_multi.flow_rate.dispense = 3
    p20_multi.flow_rate.blow_out = 1
    p1000_single = ctx.load_instrument("flex_1channel_1000", "left", tip_racks=[tiprack_200])
    p1000_single.flow_rate.blow_out = 10
    p1000_single.flow_rate.dispense = 50
    p1000_single.flow_rate.aspirate = 100

    def Strip_tube_pooling(start, end):
        for x in range(columns):
            p20_multi.pick_up_tip()
            p20_multi.aspirate(12, start[x].bottom(z=0.5), rate=0.5)
            ctx.delay(seconds=10)
            p20_multi.dispense(12, end[0].top().move(types.Point(z=-7, x=-2.7)))
            ctx.delay(seconds=10)
            p20_multi.blow_out()
            if DryRun == True:
                p20_multi.return_tip()
            else:
                p20_multi.drop_tip()

    def Final_tube_pooling(start, end):
        for z in range(8):
            p1000_single.pick_up_tip()
            p1000_single.aspirate(10 * columns, start[z].bottom(z=1))
            ctx.delay(seconds=10)
            p1000_single.dispense(10 * columns, Final_pool_tube[end].top().move(types.Point(z=-5, x=-4.3)))
            ctx.delay(seconds=10)
            p1000_single.blow_out()
            if DryRun == True:
                p1000_single.return_tip()
            else:
                p1000_single.drop_tip()

    # Commands
    heater_shaker.close_labware_latch()
    ctx.pause("Pulse spin plates once amplification is finished")

    # Begin pooling
    for a, b in zip(reaction_plates, pool_columns):
        Strip_tube_pooling(a, b)

    # Mix pool on heater shaker
    ctx.pause("Thouroughly seal plate and return to Heater Shaker")
    heater_shaker.set_and_wait_for_shake_speed(3000)
    ctx.delay(minutes=1.5)
    heater_shaker.deactivate_shaker()
    heater_shaker.open_labware_latch()
    ctx.pause("Pulse spin plate, carefully unseal and return to Heater Shaker")
    heater_shaker.close_labware_latch()

    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    # Start final tube pooling
    ctx.comment("Begin pooling in 2ml tubes")
    for c, d in zip(pool_columns, pool_tubes):
        Final_tube_pooling(c, d)

    heater_shaker.open_labware_latch()
    ctx.home()
