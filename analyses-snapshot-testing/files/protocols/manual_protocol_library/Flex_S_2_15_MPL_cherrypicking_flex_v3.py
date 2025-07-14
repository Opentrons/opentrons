def get_values(*names):
    import json

    _all_values = json.loads(
        """{"transfer_csv":"Source Labware,Source Slot,Source Well,Source Aspiration Height Above Bottom (in mm),Dest Labware,Dest Slot,Dest Well,Volume (in ul)\\nagilent_1_reservoir_290ml,1,A1,1,nest_96_wellplate_100ul_pcr_full_skirt,4,A11,1\\nnest_12_reservoir_15ml,2,A1,1,nest_96_wellplate_2ml_deep,5,A5,3\\nnest_1_reservoir_195ml,3,A1,1,nest_96_wellplate_2ml_deep,5,H12,7\\n","pipette_type":"flex_1channel_50","pipette_mount":"right","tip_type":"standard_50","tip_reuse":"always","protocol_filename":"Uni of Montana_Cherrypicking_Flex_for library upload_v13"}"""
    )
    return [_all_values[n] for n in names]


from opentrons import protocol_api

metadata = {
    "ctx.Name": "Uni of Montana Cherrypicking_Flex",
    "author": "Krishna Soma <krishna.soma@opentrons.com>",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(ctx: protocol_api.ProtocolContext):

    [pipette_type, pipette_mount, tip_type, tip_reuse, transfer_csv] = get_values(  # noqa: F821
        "pipette_type", "pipette_mount", "tip_type", "tip_reuse", "transfer_csv"
    )

    tiprack_map = {
        "flex_1channel_50": {
            "standard_50": "opentrons_flex_96_tiprack_50ul",
            "filter_50": "opentrons_flex_96_filtertiprack_50ul",
        },
        "flex_1channel_1000": {
            "standard_1000": "opentrons_flex_96_tiprack_1000ul",
            "filter_1000": "opentrons_flex_96_filtertiprack_1000ul",
            "standard_200": "opentrons_flex_96_tiprack_200ul",
            "filter_200": "opentrons_flex_96_filtertiprack_200ul",
            "standard_50": "opentrons_flex_96_tiprack_50ul",
            "filter_50": "opentrons_flex_96_filtertiprack_50ul",
        },
    }

    # load labware
    transfer_info = [[val.strip().lower() for val in line.split(",")] for line in transfer_csv.splitlines() if line.split(",")[0].strip()][
        1:
    ]
    for line in transfer_info:
        s_lw, s_slot, d_lw, d_slot = line[:2] + line[4:6]
        for slot, lw in zip([s_slot, d_slot], [s_lw, d_lw]):
            if not int(slot) in ctx.loaded_labwares:
                ctx.load_labware(lw.lower(), slot)

    # load tipracks in remaining slots
    tiprack_type = tiprack_map[pipette_type][tip_type]
    tipracks = []
    for slot in range(4, 12):
        if slot not in ctx.loaded_labwares:
            tipracks.append(ctx.load_labware(tiprack_type, str(slot)))

    # load pipette
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

    if tip_reuse == "never":
        pick_up()
    for line in transfer_info:
        _, s_slot, s_well, h, _, d_slot, d_well, vol = line[:8]
        source = ctx.loaded_labwares[int(s_slot)].wells_by_name()[parse_well(s_well)].bottom(float(h))
        dest = ctx.loaded_labwares[int(d_slot)].wells_by_name()[parse_well(d_well)]
        if tip_reuse == "always":
            pick_up()
        pip.transfer(float(vol), source, dest, new_tip="never")
        if tip_reuse == "always":
            pip.drop_tip()
    if pip.has_tip:
        pip.drop_tip()
