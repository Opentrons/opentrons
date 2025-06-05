def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "mag_mod", "type": "dropDown", "label": "magnetic module", "options": [{"label": "GEN1 Magnetic Module", "value": "magnetic module"}, {"label": "GEN2 Magnetic Module", "value": "magnetic module gen2"}]}, {"name": "pipette_type", "type": "dropDown", "label": "pipette type", "options": [{"label": "GEN2 P1000 Single", "value": "p1000_single_gen2"}, {"label": "GEN2 P300 Single", "value": "p300_single_gen2"}, {"label": "GEN2 P20 Single", "value": "p10_single_gen2"}, {"label": "GEN2 P300 Multi", "value": "p300_multi_gen2"}, {"label": "GEN2 P20 Multi", "value": "p20_multi_gen2"}, {"label": "GEN1 P1000 Single", "value": "p1000_single"}, {"label": "GEN1 P300 Single", "value": "p300_single"}, {"label": "GEN1 P50 Single", "value": "p50_single"}, {"label": "GEN1 P10 Single", "value": "p10_single"}, {"label": "GEN1 P300 Multi", "value": "p300_multi"}, {"label": "GEN1 P50 Multi", "value": "p50_multi"}, {"label": "GEN1 P10 Multi", "value": "p10_multi"}]}, {"name": "pipette_mount", "type": "dropDown", "label": "pipette mount", "options": [{"label": "left", "value": "left"}, {"label": "right", "value": "right"}]}, {"name": "sample_number", "type": "int", "label": "number of samples", "default": 24}, {"name": "sample_volume", "type": "float", "label": "sample volume (in uL)", "default": 20}, {"name": "bead_ratio", "type": "float", "label": "bead ratio", "default": 1.8}, {"name": "elution_buffer_volume", "type": "float", "label": "elution buffer volume (in uL)", "default": 200}, {"name": "incubation_time", "type": "float", "label": "incubation time (in minutes)", "default": 1}, {"name": "settling_time", "type": "float", "label": "settling time (in minutes)", "default": 1}, {"name": "drying_time", "type": "float", "label": "drying time (in minutes)", "default": 5}]""")
    return [_all_values[n] for n in names]


import math

metadata = {
    "protocolName": "DNA Purification",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.4",
}


def run(protocol_context):
    [
        mag_mod,
        pipette_type,
        pipette_mount,
        sample_number,
        sample_volume,
        bead_ratio,
        elution_buffer_volume,
        incubation_time,
        settling_time,
        drying_time,
    ] = get_values(
        "mag_mod",
        "pipette_type",
        "pipette_mount",
        "sample_number",
        "sample_volume",
        "bead_ratio",
        "elution_buffer_volume",
        "incubation_time",
        "settling_time",
        "drying_time",
    )
    mag_deck = protocol_context.load_module(mag_mod, "1")
    mag_plate = mag_deck.load_labware("biorad_96_wellplate_200ul_pcr")
    output_plate = protocol_context.load_labware("biorad_96_wellplate_200ul_pcr", "2", "output plate")
    total_tips = sample_number * 8
    tiprack_num = math.ceil(total_tips / 96)
    slots = ["3", "5", "6", "7", "8", "9", "10", "11"][:tiprack_num]
    pip_range = pipette_type.split("_")[0]
    if pip_range == "p1000":
        tip_name = "opentrons_96_tiprack_1000ul"
    elif pip_range == "p300" or pip_range == "p50":
        tip_name = "opentrons_96_tiprack_300ul"
    elif pip_range == "p20":
        tip_name = "opentrons_96_tiprack_20ul"
    else:
        tip_name = "opentrons_96_tiprack_10ul"
    tipracks = [protocol_context.load_labware(tip_name, slot) for slot in slots]
    pipette = protocol_context.load_instrument(pipette_type, pipette_mount, tip_racks=tipracks)
    mode = pipette_type.split("_")[1]
    if mode == "single":
        if sample_number <= 5:
            reagent_container = protocol_context.load_labware("opentrons_24_tuberack_nest_2ml_snapcap", "4")
            liquid_waste = protocol_context.load_labware("usascientific_12_reservoir_22ml", "5").wells()[-1]
        else:
            reagent_container = protocol_context.load_labware("usascientific_12_reservoir_22ml", "4")
            liquid_waste = reagent_container.wells()[-1]
        samples = list(mag_plate.wells()[:sample_number])
        output = list(output_plate.wells()[:sample_number])
    else:
        reagent_container = protocol_context.load_labware("usascientific_12_reservoir_22ml", "4")
        liquid_waste = reagent_container.wells()[-1]
        col_num = math.ceil(sample_number / 8)
        samples = list(mag_plate.rows()[0][:col_num])
        output = list(output_plate.rows()[0][:col_num])
    beads = reagent_container.wells()[0]
    ethanol = reagent_container.wells()[1]
    elution_buffer = reagent_container.wells()[2]
    bead_volume = sample_volume * bead_ratio
    if bead_volume / 2 > pipette.max_volume:
        mix_vol = pipette.max_volume
    else:
        mix_vol = bead_volume / 2
    total_vol = bead_volume + sample_volume + 5
    for target in samples:
        pipette.pick_up_tip()
        pipette.mix(5, mix_vol, beads)
        pipette.transfer(bead_volume, beads, target, new_tip="never")
        pipette.mix(10, mix_vol, target)
        pipette.blow_out()
        pipette.drop_tip()
    protocol_context.delay(minutes=incubation_time)
    mag_deck.engage()
    protocol_context.delay(minutes=settling_time)
    pipette.flow_rate.aspirate = 25
    pipette.flow_rate.dispense = 150
    for target in samples:
        pipette.transfer(total_vol, target, liquid_waste, blow_out=True)
    air_vol = pipette.max_volume * 0.1
    for _cycle in range(2):
        for target in samples:
            pipette.transfer(200, ethanol, target, air_gap=air_vol, new_tip="once")
        protocol_context.delay(minutes=1)
        for target in samples:
            pipette.transfer(200, target, liquid_waste, air_gap=air_vol)
    protocol_context.delay(minutes=drying_time)
    mag_deck.disengage()
    if elution_buffer_volume / 2 > pipette.max_volume:
        mix_vol = pipette.max_volume
    else:
        mix_vol = elution_buffer_volume / 2
    for target in samples:
        pipette.pick_up_tip()
        pipette.transfer(elution_buffer_volume, elution_buffer, target, new_tip="never")
        pipette.mix(20, mix_vol, target)
        pipette.drop_tip()
    protocol_context.delay(minutes=5)
    mag_deck.engage()
    protocol_context.delay(minutes=settling_time)
    for target, dest in zip(samples, output):
        pipette.transfer(elution_buffer_volume, target, dest, blow_out=True)
