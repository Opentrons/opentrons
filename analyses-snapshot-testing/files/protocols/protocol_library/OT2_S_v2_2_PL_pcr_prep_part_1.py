def get_values(*names):
    import json
    _all_values = json.loads("""{"right_pipette": "p1000_single_gen2", "left_pipette": "p1000_single_gen2", "is_filtered": true, "tuberack_1_lname": "opentrons_24_tuberack_nest_0.5ml_screwcap", "tuberack_2_lname": "opentrons_24_tuberack_nest_0.5ml_screwcap", "reservoir12_lname": "nest_12_reservoir_15ml", "master_mix_csv": "Reagent,Slot,Well,Volume\\nBuffer,1,A2,3\\nMgCl,1,A3,40\\ndNTPs,2,A2,90\\nWater,2,A3,248\\nprimer 1,1,A4,25\\nprimer 2,1,A5,25\\n"}""")
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "PCR Prep",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.2",
}


def run(protocol_context):
    [
        right_pipette,
        left_pipette,
        is_filtered,
        tuberack_1_lname,
        tuberack_2_lname,
        reservoir12_lname,
        master_mix_csv,
    ] = get_values(
        "right_pipette",
        "left_pipette",
        "is_filtered",
        "tuberack_1_lname",
        "tuberack_2_lname",
        "reservoir12_lname",
        "master_mix_csv",
    )
    if not left_pipette and not right_pipette:
        raise Exception("You have to select at least 1 pipette.")
    pipette_l = None
    pipette_r = None
    tiprack_pip_dict = {
        "p10_single": ("opentrons_96_filtertiprack_20ul", "opentrons_96_tiprack_20ul"),
        "p20_single_gen2": ("opentrons_96_filtertiprack_20ul", "opentrons_96_tiprack_20ul"),
        "p50_single": ("opentrons_96_filtertiprack_200ul", "opentrons_96_tiprack_300ul"),
        "p300_single": ("opentrons_96_filtertiprack_200ul", "opentrons_96_tiprack_300ul"),
        "p300_single_gen2": ("opentrons_96_filtertiprack_200ul", "opentrons_96_tiprack_300ul"),
        "p1000_single": ("opentrons_96_filtertiprack_1000ul", "opentrons_96_tiprack_1000ul"),
        "p1000_single_gen2": ("opentrons_96_filtertiprack_1000ul", "opentrons_96_tiprack_1000ul"),
    }
    for pip, mount, slot in zip([left_pipette, right_pipette], ["left", "right"], ["5", "6"]):
        if pip:
            rack = tiprack_pip_dict[pip][0] if is_filtered else tiprack_pip_dict[pip][1]
            tiprack = protocol_context.load_labware(rack, slot)
            if mount == "left":
                pipette_l = protocol_context.load_instrument(pip, mount, tip_racks=[tiprack])
            else:
                pipette_r = protocol_context.load_instrument(pip, mount, tip_racks=[tiprack])
    tuberack_1 = protocol_context.load_labware(tuberack_1_lname, "1", "tuberack 1")
    tuberack_2 = protocol_context.load_labware(tuberack_2_lname, "2", "tuberack 2")
    res12 = protocol_context.load_labware("usascientific_12_reservoir_22ml", "3", "12-channel reservoir")
    reagents = {"1": tuberack_1, "2": tuberack_2, "3": res12}
    if pipette_l and pipette_r:
        if left_pipette == right_pipette:
            pip_s = pipette_l
            pip_l = pipette_r
        elif pipette_l.max_volume < pipette_r.max_volume:
            pip_s, pip_l = pipette_l, pipette_r
        else:
            pip_s, pip_l = pipette_r, pipette_l
    else:
        pipette = pipette_l if pipette_l else pipette_r
    mastermix_dest = res12.wells()[0]
    info_list = [[cell.strip() for cell in line.split(",")] for line in master_mix_csv.splitlines()[1:] if line]
    for line in info_list[1:]:
        source = reagents[line[1]].wells(line[2].upper())
        vol = float(line[3])
        if pipette_l and pipette_r:
            if vol <= pip_s.max_volume:
                pipette = pip_s
            else:
                pipette = pip_l
        pipette.transfer(vol, source, mastermix_dest)
