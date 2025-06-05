def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "pipette_type", "type": "dropDown", "label": "pipette type", "options": [{"label": "GEN2 P1000 Single", "value": "p1000_single_gen2"}, {"label": "GEN2 P300 Single", "value": "p300_single_gen2"}, {"label": "GEN2 P20 Single", "value": "p10_single_gen2"}, {"label": "GEN2 P300 Multi", "value": "p300_multi_gen2"}, {"label": "GEN2 P20 Multi", "value": "p20_multi_gen2"}, {"label": "GEN1 P1000 Single", "value": "p1000_single"}, {"label": "GEN1 P300 Single", "value": "p300_single"}, {"label": "GEN1 P50 Single", "value": "p50_single"}, {"label": "GEN1 P10 Single", "value": "p10_single"}, {"label": "GEN1 P300 Multi", "value": "p300_multi"}, {"label": "GEN1 P50 Multi", "value": "p50_multi"}, {"label": "GEN1 P10 Multi", "value": "p10_multi"}]}, {"name": "pipette_mount", "type": "dropDown", "label": "pipette mount", "options": [{"label": "left", "value": "left"}, {"label": "right", "value": "right"}]}, {"name": "sample_number", "type": "int", "label": "number of samples", "default": 24}, {"name": "PCR_volume", "type": "float", "label": "PCR volume (in uL)", "default": 20}, {"name": "bead_ratio", "type": "float", "label": "bead ratio", "default": 1.8}, {"name": "elution_buffer_volume", "type": "float", "label": "elution buffer volume (in uL)", "default": 20}, {"name": "incubation_time", "type": "float", "label": "incubation time (in minutes)", "default": 1}, {"name": "settling_time", "type": "float", "label": "settling time (in minutes)", "default": 1}, {"name": "drying_time", "type": "float", "label": "drying time (in minutes)", "default": 5}]""")
    return [_all_values[n] for n in names]


import math

metadata = {
    "protocolName": "Omega Bio-tek Mag-Bind TotalPure NGS",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.2",
}


def run(protocol_context):
    [
        pipette_type,
        pipette_mount,
        sample_number,
        PCR_volume,
        bead_ratio,
        elution_buffer_volume,
        incubation_time,
        settling_time,
        drying_time,
    ] = get_values(
        "pipette_type",
        "pipette_mount",
        "sample_number",
        "PCR_volume",
        "bead_ratio",
        "elution_buffer_volume",
        "incubation_time",
        "settling_time",
        "drying_time",
    )
    mag_deck = protocol_context.load_module("magdeck", "1")
    mag_plate = mag_deck.load_labware("biorad_96_wellplate_200ul_pcr")
    output_plate = protocol_context.load_labware("biorad_96_wellplate_200ul_pcr", "2", "output plate")
    total_tips = sample_number * 8
    tiprack_num = math.ceil(total_tips / 96)
    slots = ["3", "5", "6", "8", "9", "10", "11"][:tiprack_num]
    pip_range = pipette_type.split("_")[0]
    if pip_range == "p1000":
        tip_name = "opentrons_96_tiprack_1000ul"
    elif pip_range == "p300" or range == "p50":
        tip_name = "opentrons_96_tiprack_300ul"
    elif pip_range == "p20":
        tip_name = "opentrons_96_tiprack_20ul"
    else:
        tip_name = "opentrons_96_tiprack_10ul"
    tipracks = [protocol_context.load_labware(tip_name, slot, pip_range + " tiprack") for slot in slots]
    pipette = protocol_context.load_instrument(pipette_type, pipette_mount, tip_racks=tipracks)
    mode = pipette_type.split("_")[1]
    if mode == "single":
        if sample_number <= 5:
            reagent_container = protocol_context.load_labware(
                "opentrons_24_tuberack_generic_2ml_screwcap", "7", "reagent rack"
            )
            liquid_waste = protocol_context.load_labware(
                "usascientific_12_reservoir_22ml", "5", "reservoir for waste"
            ).wells()[-1]
        else:
            reagent_container = protocol_context.load_labware(
                "usascientific_12_reservoir_22ml", "7", "reagent reservoir"
            )
            liquid_waste = reagent_container.wells()[-1]
        samples = list(mag_plate.wells()[:sample_number])
        samples_top = [well.top() for well in samples]
        output = list(output_plate.wells()[:sample_number])
    else:
        reagent_container = protocol_context.load_labware("usascientific_12_reservoir_22ml", "7", "reagent reservoir")
        liquid_waste = reagent_container.wells()[-1]
        col_num = math.ceil(sample_number / 8)
        samples = list(mag_plate.rows()[0][:col_num])
        samples_top = [well.top() for well in mag_plate.rows()[0][:col_num]]
        output = list(output_plate.rows()[0][:col_num])
    beads = reagent_container.wells()[0]
    ethanol = reagent_container.wells()[1]
    elution_buffer = reagent_container.wells()[2]
    bead_volume = PCR_volume * bead_ratio
    if mode == "single":
        if bead_volume * sample_number > pipette.max_volume:
            mix_vol = pipette.max_volume
        else:
            mix_vol = bead_volume * sample_number
    elif bead_volume * col_num > pipette.max_volume:
        mix_vol = pipette.max_volume
    else:
        mix_vol = bead_volume * col_num
    total_vol = bead_volume + PCR_volume + 15
    mix_voltarget = PCR_volume + 10
    mag_deck.disengage()
    for target in samples:
        pipette.flow_rate.aspirate = 180
        pipette.flow_rate.dispense = 180
        pipette.pick_up_tip()
        pipette.mix(25, mix_vol, beads)
        protocol_context.default_speed = 200
        pipette.flow_rate.aspirate = 10
        pipette.flow_rate.dispense = 10
        pipette.transfer(bead_volume, beads, target, new_tip="never")
        pipette.flow_rate.aspirate = 50
        pipette.flow_rate.dispense = 50
        pipette.mix(40, mix_voltarget, target)
        pipette.blow_out()
        protocol_context.default_speed = 400
        pipette.drop_tip()
    protocol_context.comment(
        "Incubating the beads and PCR products at room temperature for 5 minutes. Protocol will resume automatically."
    )
    protocol_context.delay(seconds=incubation_time)
    mag_deck.engage()
    protocol_context.comment("Delaying for " + str(settling_time) + " seconds for beads to settle.")
    protocol_context.delay(seconds=settling_time)
    pipette.flow_rate.aspirate = 25
    pipette.flow_rate.dispense = 120
    for target in samples:
        pipette.transfer(total_vol, target, liquid_waste.top(), blow_out=True)
    air_vol = pipette.max_volume * 0.1
    for _ in range(2):
        pipette.pick_up_tip()
        for target in samples_top:
            pipette.transfer(185, ethanol, target, air_gap=air_vol, new_tip="never")
        msg = "Delaying for 17 seconds."
        protocol_context.delay(seconds=17, msg=msg)
        for target in samples:
            if not pipette.hw_pipette["has_tip"]:
                pipette.pick_up_tip()
            pipette.transfer(195, target.bottom(z=0.7), liquid_waste.top(), air_gap=air_vol, new_tip="never")
            pipette.drop_tip()
    msg = "Drying the beads for " + str(drying_time) + " minutes. Protocol will resume automatically."
    protocol_context.delay(minutes=drying_time, msg=msg)
    mag_deck.disengage()
    if elution_buffer_volume / 2 > pipette.max_volume:
        mix_vol = pipette.max_volume
    else:
        mix_vol = elution_buffer_volume / 2
    for target in samples:
        pipette.transfer(elution_buffer_volume, elution_buffer, target, mix_after=(45, mix_vol))
    protocol_context.comment("Incubating at room temperature for 3 minutes. Protocol will resume automatically.")
    protocol_context.delay(minutes=3)
    mag_deck.engage()
    protocol_context.comment("Delaying for " + str(settling_time) + " seconds for beads to settle.")
    protocol_context.delay(seconds=settling_time)
    for target, dest in zip(samples, output):
        pipette.transfer(elution_buffer_volume, target.bottom(z=1), dest.top(), blow_out=True)
    mag_deck.disengage()
