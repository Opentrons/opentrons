def get_values(*names):
    import json

    _all_values = json.loads(
        """{"VOL_REACTION":10,"NUM_COMBO":8,"insert_1":2,"vector_1":1,"insert_2":2,"vector_2":1,"insert_3":2,"vector_3":1,"insert_4":2,"vector_4":1,"insert_5":2,"vector_5":1,"insert_6":2,"vector_6":1,"insert_7":2,"vector_7":1,"insert_8":2,"vector_8":1,"protocol_filename":"Takara_InFusionSnapAssembly_Flex"}"""
    )
    return [_all_values[n] for n in names]


metadata = {"protocolName": "Takara In-Fusion Snap Assembly Kit on Flex", "author": "Boren Lin, Opentrons", "source": ""}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


def run(ctx):

    VOL_REACTION = 10
    ## can be 5 or 10 uL
    NUM_COMBO = 8
    ## maxi. 8

    try:
        [VOL_REACTION, NUM_COMBO] = get_values("VOL_REACTION", "NUM_COMBO")
    except NameError:
        # get_values is not defined, so proceed with defaults
        pass

    insert_1 = 2
    vector_1 = 1
    insert_2 = 2
    vector_2 = 1
    insert_3 = 2
    vector_3 = 1
    insert_4 = 2
    vector_4 = 1
    insert_5 = 2
    vector_5 = 1
    insert_6 = 2
    vector_6 = 1
    insert_7 = 2
    vector_7 = 1
    insert_8 = 2
    vector_8 = 1

    try:
        [
            insert_1,
            vector_1,
            insert_2,
            vector_2,
            insert_3,
            vector_3,
            insert_4,
            vector_4,
            insert_5,
            vector_5,
            insert_6,
            vector_6,
            insert_7,
            vector_7,
            insert_8,
            vector_8,
        ] = get_values(
            "insert_1",
            "vector_1",
            "insert_2",
            "vector_2",
            "insert_3",
            "vector_3",
            "insert_4",
            "vector_4",
            "insert_5",
            "vector_5",
            "insert_6",
            "vector_6",
            "insert_7",
            "vector_7",
            "insert_8",
            "vector_8",
        )
    except NameError:
        # get_values is not defined, so proceed with defaults
        pass

    VOL_INSERT = []
    VOL_VECTOR = []
    for i in range(1, NUM_COMBO + 1):
        if int(locals()["insert_" + str(i)]) <= 0:
            raise Exception("Invalid liqud volume")
        else:
            VOL_INSERT.append(int(locals()["insert_" + str(i)]))
            VOL_VECTOR.append(int(locals()["vector_" + str(i)]))
    # at least one insert must be set
    if len(VOL_INSERT) == 0:
        raise Exception("No inserts")

    if VOL_REACTION == 10:
        VOL_MASTERMIX = 2
        num_row = len(VOL_INSERT)
        for i in range(num_row):
            vol_water = VOL_REACTION - VOL_MASTERMIX - VOL_INSERT[i] - VOL_VECTOR[i]
            if vol_water < 0:
                raise Exception("Invalid liqud volume")

    elif VOL_REACTION == 5:
        VOL_MASTERMIX = 1
        num_row = len(VOL_INSERT)
        for i in range(num_row):
            vol_water = VOL_REACTION - VOL_MASTERMIX - VOL_INSERT[i] - VOL_VECTOR[i]
            if vol_water < 0:
                raise Exception("Invalid liqud volume")

    else:
        raise Exception("Invalid liqud volume")

    # load labware and pipette
    temp = ctx.load_module("Temperature Module Gen2", "D3")
    temp_adapter = temp.load_adapter("opentrons_96_well_aluminum_block")
    working_plate = temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "wokring plate")

    tips = [ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", slot, "50uL Tips") for slot in ["C2", "B2"]]
    m50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=tips)
    s50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=tips)

    reagent_stock = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", "D2", "Inserts, Vectors, Master Mix, Water")

    ctx.load_trash_bin("A3")

    # liquid
    for i in range(len(VOL_INSERT)):
        insert_vol_stock = VOL_INSERT[i] * 6 + 10
        insert_def = ctx.define_liquid(
            name="Insert# " + str(i + 1), description="DNA Fragments to be Inserted", display_color="#704848"
        )  ## Brown
        reagent_stock.wells()[i].load_liquid(liquid=insert_def, volume=insert_vol_stock)

        vector_vol_stock = VOL_VECTOR[i] * 6 + 10
        vector_def = ctx.define_liquid(name="Vector# " + str(i + 1), description="Linearized Vectors", display_color="#0EFF00")  ## Green
        reagent_stock.wells()[i + 8].load_liquid(liquid=vector_def, volume=vector_vol_stock)

    mastermix_vol_stock = VOL_MASTERMIX * len(VOL_INSERT) * 6 + 10
    mastermix_def = ctx.define_liquid(name="Mastermix", description="In-Fusion Snap Assembly Master Mix", display_color="#FF0000")  ## Red
    reagent_stock.wells()[16].load_liquid(liquid=mastermix_def, volume=mastermix_vol_stock)

    water_def = ctx.define_liquid(name="Water", description="Molecular biology Grade Water ", display_color="#00FFF2")  ## Light Blue
    reagent_stock.wells()[20].load_liquid(liquid=water_def, volume=500)

    inserts = reagent_stock.wells()[:8]
    vectors = reagent_stock.wells()[8:16]
    mastermix = reagent_stock.wells()[16]
    water = reagent_stock.wells()[20]
    pre_mix = working_plate.wells()[:8]
    reaction = working_plate.rows()[0][:6]

    # perform
    ## transfer water
    s50.pick_up_tip()
    for i in range(len(VOL_INSERT)):
        vol_water = VOL_REACTION - VOL_MASTERMIX - VOL_INSERT[i] - VOL_VECTOR[i]
        if vol_water != 0:
            vol = vol_water * 6
            start = water
            end = pre_mix[i]
            if vol > 50:
                vol = vol / 2
                for _ in range(2):
                    s50.mix(1, vol, start)
                    s50.aspirate(vol, start)
                    s50.dispense(vol, end)
            elif vol < 50:
                s50.mix(1, vol, start)
                s50.aspirate(vol, start)
                s50.dispense(vol, end)
    s50.drop_tip()

    ## transfer master mix
    vol = VOL_MASTERMIX * 6
    s50.pick_up_tip()
    for i in range(len(VOL_INSERT)):
        start = mastermix
        end = pre_mix[i]
        if vol > 50:
            vol = vol / 2
            for _ in range(2):
                s50.mix(3, vol, start)
                ctx.delay(seconds=5)
                s50.aspirate(vol, start)
                ctx.delay(seconds=5)
                s50.dispense(vol, end)
                ctx.delay(seconds=5)
        elif vol < 50 and vol > 0:
            s50.mix(3, vol, start)
            ctx.delay(seconds=5)
            s50.aspirate(vol, start)
            ctx.delay(seconds=5)
            s50.dispense(vol, end)
            ctx.delay(seconds=5)
    s50.drop_tip()

    ## transfer vector
    for i in range(len(VOL_INSERT)):
        if VOL_INSERT[i] > 0:
            vol = VOL_VECTOR[i] * 6
            s50.pick_up_tip()
            start = vectors[i]
            end = pre_mix[i]
            if vol > 50:
                vol = vol / 2
                for _ in range(2):
                    s50.mix(3, vol, start)
                    ctx.delay(seconds=2)
                    s50.aspirate(vol, start)
                    ctx.delay(seconds=2)
                    s50.dispense(vol, end)
                    ctx.delay(seconds=2)
            elif vol < 50:
                s50.mix(3, vol, start)
                ctx.delay(seconds=2)
                s50.aspirate(vol, start)
                ctx.delay(seconds=2)
                s50.dispense(vol, end)
                ctx.delay(seconds=2)
            s50.drop_tip()

    ## transfer insert
    for i in range(len(VOL_INSERT)):
        vol = VOL_INSERT[i] * 6
        s50.pick_up_tip()
        start = inserts[i]
        end = pre_mix[i]
        if vol > 50:
            vol = vol / 2
            for _ in range(2):
                s50.mix(3, vol, start)
                ctx.delay(seconds=2)
                s50.aspirate(vol, start)
                ctx.delay(seconds=2)
                s50.dispense(vol, end)
                ctx.delay(seconds=2)
        elif vol < 50:
            s50.mix(3, vol, start)
            ctx.delay(seconds=2)
            s50.aspirate(vol, start)
            ctx.delay(seconds=2)
            s50.dispense(vol, end)
            ctx.delay(seconds=2)
        s50.drop_tip()

    ## prepare reactions
    m50.pick_up_tip()
    start = reaction[0]
    m50.mix(3, VOL_REACTION * 5, start)
    ctx.delay(seconds=2)
    m50.aspirate(VOL_REACTION * 5, start)
    ctx.delay(seconds=2)
    for j in range(5):
        end = reaction[j + 1]
        m50.dispense(VOL_REACTION, end)
        ctx.delay(seconds=2)
    m50.drop_tip()

    ## incubation
    ctx.pause("Seal the plate")
    temp.set_temperature(50)
    ctx.delay(minutes=15)
    temp.set_temperature(4)
    ctx.pause("Reaction complete")
    temp.deactivate()
