def get_values(*names):
    import json

    _all_values = json.loads(
        """{"NUM_SAMPLES":96,"LABWARE_SAMPLE":24,"PIPET_LOCATION":1,"DIGESTION_TIME_PRESET":1,"DIGESTION_TIME":24,"protocol_filename":"SamplePrep_MS_Digest_Flex_upto96"}"""
    )
    return [_all_values[n] for n in names]


metadata = {"protocolName": "Trypsin Digestion for LC/MS - Flex w/ Thermal Cycler", "author": "Boren Lin, Opentrons", "source": ""}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

########################

NUM_SAMPLES = 96
# max. 96

LABWARE_SAMPLE = 96
# 24 for 24 tube rack or 96 for 96 well plate

SAMPLE_VOL = 50
ABC_VOL = 50
DTT_VOL = 10
IAA_VOL = 10
TRYPSIN_VOL = 10

DTT_TEMP = 55
DTT_TIME = 30
IAA_TEMP = 22
IAA_TIME = 30
TRYPSIN_TEMP = 37

PIPET_LOCATION = 1
# P1000 8-ch at Left: 1; Right :2

DIGESTION_TIME_PRESET = 0
# Yes:1; No:0
# if Yes,
DIGESTION_TIME = 4
# hours

#########################

try:
    [NUM_SAMPLES, LABWARE_SAMPLE, PIPET_LOCATION, DIGESTION_TIME_PRESET, DIGESTION_TIME] = get_values(
        "NUM_SAMPLES", "LABWARE_SAMPLE", "PIPET_LOCATION", "DIGESTION_TIME_PRESET", "DIGESTION_TIME"
    )

except NameError:
    # get_values is not defined, so proceed with defaults
    pass

global num_col
global m1000_loc
global s1000_loc

num_col = int(NUM_SAMPLES // 8)
if NUM_SAMPLES % 8 != 0:
    num_col = num_col + 1

if PIPET_LOCATION == 1:
    m1000_loc = "Left"
    s1000_loc = "Right"
else:
    m1000_loc = "Right"
    s1000_loc = "Left"


def run(ctx):

    # desk setup
    tc = ctx.load_module("thermocycler module gen2")
    sample_digested_plate = tc.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "WORKING PLATE - DIGESTION")
    reagent_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "D3", "REAGENTS")
    # ABC, DTT, IAA, Trypsin

    tips_200_reused = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "B3", "200uL TIPS, REUSED")
    tip_loc_reused = tips_200_reused.wells()[:96]
    tips_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "C3", "200uL TIPS")
    tip_loc = tips_200.wells()[:96]
    m1000 = ctx.load_instrument("flex_8channel_1000", m1000_loc)
    if LABWARE_SAMPLE == 24:
        s1000 = ctx.load_instrument("flex_1channel_1000", s1000_loc)

    # assign locations
    abc = reagent_res.rows()[0][0]
    dtt = reagent_res.rows()[0][1]
    iaa = reagent_res.rows()[0][2]
    trypsin = reagent_res.rows()[0][3]
    sample_digested_in_col = sample_digested_plate.rows()[0][:num_col]
    sample_digested_in_well = sample_digested_plate.wells()[:NUM_SAMPLES]

    # liquid info and deck payout
    vol_abc = (ABC_VOL * num_col) + 20
    vol_dtt = (DTT_VOL * num_col) + 20
    vol_iaa = (IAA_VOL * num_col) + 20
    vol_trypsin = (TRYPSIN_VOL * num_col) + 20

    def_abc = ctx.define_liquid(name="ABC", description="100 mM ABC in MS grade water, volume per well", display_color="#704848")  ## Brown
    def_dtt = ctx.define_liquid(
        name="DTT", description="60 mM DTT in MS grade water, volume per well", display_color="#00FFF2"
    )  ## Light Blue
    def_iaa = ctx.define_liquid(name="IAA", description="187.5 mM IAA in 100 mM ABC, volume per well", display_color="#FFA500")  ## Orange
    def_trypsin = ctx.define_liquid(
        name="TRYPSIN", description="0.2 ug/uL Trypsin in MS grade water, volume per well", display_color="#0EFF00"
    )  ## Green

    for p in range(8):
        reagent_res.rows()[p][0].load_liquid(liquid=def_abc, volume=vol_abc / 8)
        reagent_res.rows()[p][1].load_liquid(liquid=def_dtt, volume=vol_dtt / 8)
        reagent_res.rows()[p][2].load_liquid(liquid=def_iaa, volume=vol_iaa / 8)
        reagent_res.rows()[p][3].load_liquid(liquid=def_trypsin, volume=vol_trypsin / 8)

    def transfer(vol1, start, end, tip, mix_skip=0):
        m1000.pick_up_tip(tip)
        for i in range(num_col):
            start_loc = start
            end_loc = end[i]
            m1000.aspirate(10, start_loc.top(z=0))
            m1000.aspirate(vol1, start_loc.bottom(z=0.2))
            ctx.delay(seconds=3)
            m1000.air_gap(10)
            m1000.dispense(10, end_loc.top(z=0))
            m1000.dispense(vol1 + 10, end_loc.top(z=0))
            m1000.blow_out()
        m1000.return_tip()
        if mix_skip == 0:
            for i in range(num_col):
                m1000.pick_up_tip(tip_loc_reused[i * 8])
                end_loc = end[i]
                m1000.mix(5, 75, end_loc.bottom(z=0.2))
                m1000.blow_out(end_loc.top(z=0))
                m1000.touch_tip()
                m1000.return_tip()

    # protocol

    tc.open_lid()
    ctx.pause("Load Reagent Plate on Slot D3")

    ## add sample
    if LABWARE_SAMPLE == 24:
        num_rack_full = int(NUM_SAMPLES // 24)
        num_tube_last_rack = int(NUM_SAMPLES % 24)

        slot = ["A2", "B2", "C2", "D2"]

        if num_rack_full == 0:
            rack_loc = slot[0]
            sample_rack = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", rack_loc, "SAMPLES")
            sample = sample_rack.wells()[:24]
            vol_sample = SAMPLE_VOL + 20
            def_sample = ctx.define_liquid(
                name="SAMPLES (Slot " + slot[0] + ")", description="Protein samples, volume per tube", display_color="#FF0000"
            )  ## Red

            for i in range(NUM_SAMPLES):
                start = sample[i]
                end = sample_digested_in_well[i]
                s1000.pick_up_tip(tip_loc_reused[i])
                s1000.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                ctx.delay(seconds=3)
                s1000.air_gap(10)
                s1000.dispense(10, end.top(z=0))
                s1000.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                s1000.touch_tip()
                s1000.return_tip()

                sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample / NUM_SAMPLES)

        else:
            for n in range(num_rack_full):
                sample_rack = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", slot[n], "SAMPLES")
                sample = sample_rack.wells()[:24]
                vol_sample = SAMPLE_VOL + 20
                def_sample = ctx.define_liquid(
                    name="SAMPLES (Slot " + slot[n] + ")", description="Protein samples, volume per tube", display_color="#FF0000"
                )  ## Red

                for i in range(24):
                    start = sample[i]
                    end = sample_digested_in_well[n * 24 + i]
                    s1000.pick_up_tip(tip_loc_reused[n * 24 + i])
                    s1000.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                    ctx.delay(seconds=3)
                    s1000.air_gap(10)
                    s1000.dispense(10, end.top(z=0))
                    s1000.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                    s1000.touch_tip()
                    s1000.return_tip()

                    sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample / 24)

            if num_tube_last_rack != 0:
                last_rack_loc = slot[num_rack_full]
                sample_rack = ctx.load_labware("opentrons_24_tuberack_nest_1.5ml_snapcap", last_rack_loc, "SAMPLES")
                sample = sample_rack.wells()[:24]
                vol_sample = SAMPLE_VOL + 20
                def_sample = ctx.define_liquid(
                    name="SAMPLES (Slot " + slot[num_rack_full] + ")",
                    description="Protein samples, volume per tube",
                    display_color="#FF0000",
                )  ## Red

                for i in range(num_tube_last_rack):
                    start = sample[i]
                    end = sample_digested_in_well[num_rack_full * 24 + i]
                    s1000.pick_up_tip(tip_loc_reused[num_rack_full * 24 + i])
                    s1000.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
                    ctx.delay(seconds=3)
                    s1000.air_gap(10)
                    s1000.dispense(10, end.top(z=0))
                    s1000.dispense(SAMPLE_VOL, end.bottom(z=0.5))
                    s1000.touch_tip()
                    s1000.return_tip()

                    sample_rack.wells()[i].load_liquid(liquid=def_sample, volume=vol_sample / num_tube_last_rack)

    elif LABWARE_SAMPLE == 96:
        sample_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A2", "SAMPLES")
        sample = sample_plate.rows()[0][:num_col]
        vol_sample = SAMPLE_VOL + 20
        def_sample = ctx.define_liquid(name="SAMPLES", description="Protein samples, volume per well", display_color="#FF0000")  ## Red
        for well in range(NUM_SAMPLES):
            sample_plate.wells()[well].load_liquid(liquid=def_sample, volume=vol_sample / NUM_SAMPLES)

        for i in range(num_col):
            start = sample[i]
            end = sample_digested_in_col[i]
            m1000.pick_up_tip(tip_loc_reused[i * 8])
            m1000.aspirate(SAMPLE_VOL, start.bottom(z=0.2))
            ctx.delay(seconds=3)
            m1000.air_gap(10)
            m1000.dispense(10, end.top(z=0))
            m1000.dispense(SAMPLE_VOL, end.bottom(z=0.5))
            m1000.touch_tip()
            m1000.return_tip()

    ## add ABC
    transfer(ABC_VOL, abc, sample_digested_in_col, tip_loc[0], 1)

    ## add DTT and incubate
    transfer(DTT_VOL, dtt, sample_digested_in_col, tip_loc[8])

    tc.set_lid_temperature(temperature=70)
    tc.close_lid()
    tc.set_block_temperature(temperature=DTT_TEMP, block_max_volume=100)
    ctx.delay(minutes=DTT_TIME)

    ## add IAA and incubate
    tc.set_block_temperature(temperature=IAA_TEMP, block_max_volume=100)
    ctx.delay(minutes=5)
    tc.open_lid()
    transfer(IAA_VOL, iaa, sample_digested_in_col, tip_loc[16])

    ctx.delay(minutes=IAA_TIME)

    ## add Trypsin and incubate
    transfer(TRYPSIN_VOL, trypsin, sample_digested_in_col, tip_loc[24])
    tc.close_lid()
    tc.set_block_temperature(temperature=TRYPSIN_TEMP, block_max_volume=100)
    if DIGESTION_TIME_PRESET == 1:
        ctx.delay(minutes=DIGESTION_TIME * 60)
    else:
        ctx.pause("Incubation for 1-24 hours")
    tc.deactivate_block()
    ctx.delay(minutes=10)

    tc.deactivate_lid()
    tc.open_lid()

    ## Digestion Complete
