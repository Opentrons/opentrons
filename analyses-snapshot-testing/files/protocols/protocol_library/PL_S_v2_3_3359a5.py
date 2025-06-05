def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "pipette_type", "type": "dropDown", "label": "pipette type", "options": [{"label": "P20 Single (GEN 2)", "value": "p20_single_gen2"}, {"label": "P10 Single (GEN 1)", "value": "p10_single"}, {"label": "P50 Single (GEN 1)", "value": "p50_single"}, {"label": "P300 Single (GEN 1)", "value": "p300_single_gen1"}, {"label": "P1000 Single (GEN 1)", "value": "p1000_single_gen1"}, {"label": "P300 Single (GEN 2)", "value": "p300_single_gen2"}, {"label": "P1000 Single (GEN 2)", "value": "p1000_single_gen2"}]}, {"name": "pipette_mount", "type": "dropDown", "label": "pipette mount", "options": [{"label": "right", "value": "right"}, {"label": "left", "value": "left"}]}, {"name": "transfer_csv", "type": "textFile", "label": "transfer .csv file", "default": "Source Labware,Source Slot,Source Well,Source Aspiration Height Above Bottom (in mm),Dest Labware,Dest Slot,Dest Well,Volume (in ul)\\nagilent_1_reservoir_290ml,1,A1,1,nest_96_wellplate_100ul_pcr_full_skirt,4,A11,1\\nnest_12_reservoir_15ml,2,A1,1,nest_96_wellplate_2ml_deep,5,A5,3\\nnest_1_reservoir_195ml,3,A1,1,nest_96_wellplate_2ml_deep,5,H12,7"}]""")
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "Cherrypicking",
    "author": "Nick <protocols@opentrons.com>",
    "source": "Custom Protocol Request",
    "apiLevel": "2.3",
}


def run(ctx):
    pipette_type, pipette_mount, transfer_csv = get_values("pipette_type", "pipette_mount", "transfer_csv")
    tiprack_map = {
        "p10_single": "opentrons_96_tiprack_10ul",
        "p50_single": "opentrons_96_tiprack_300ul",
        "p300_single_gen1": "opentrons_96_tiprack_300ul",
        "p1000_single_gen1": "opentrons_96_tiprack_1000ul",
        "p20_single_gen2": "opentrons_96_tiprack_20ul",
        "p300_single_gen2": "opentrons_96_tiprack_300ul",
        "p1000_single_gen2": "opentrons_96_tiprack_1000ul",
    }
    transfer_info = [
        [val.strip().lower() for val in line.split(",")]
        for line in transfer_csv.splitlines()
        if line.split(",")[0].strip()
    ][1:]
    for line in transfer_info:
        s_lw, s_slot, d_lw, d_slot = line[:2] + line[4:6]
        for slot, lw in zip([s_slot, d_slot], [s_lw, d_lw]):
            if int(slot) not in ctx.loaded_labwares:
                ctx.load_labware(lw.lower(), slot)
    tiprack_type = tiprack_map[pipette_type]
    tipracks = []
    for slot in range(1, 13):
        if slot not in ctx.loaded_labwares:
            tipracks.append(ctx.load_labware(tiprack_type, str(slot)))
    pip = ctx.load_instrument(pipette_type, pipette_mount, tip_racks=tipracks)
    tip_count = 0
    tip_max = len(tipracks * 96)

    def pick_up():
        nonlocal tip_count
        if tip_count == tip_max:
            ctx.pause("Please refill tipracks before resuming.")
            pip.reset_tipracks()
            tip_count = 0
        pip.pick_up_tip()
        tip_count += 1

    def parse_well(well):
        letter = well[0]
        number = well[1:]
        return letter.upper() + str(int(number))

    for line in transfer_info:
        _, s_slot, s_well, h, _, d_slot, d_well, vol = line[:8]
        source = ctx.loaded_labwares[int(s_slot)].wells_by_name()[parse_well(s_well)].bottom(float(h))
        dest = ctx.loaded_labwares[int(d_slot)].wells_by_name()[parse_well(d_well)]
        pick_up()
        pip.transfer(float(vol), source, dest, new_tip="never")
        pip.drop_tip()
