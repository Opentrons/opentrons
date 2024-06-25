def get_values(*names):
    import json

    _all_values = json.loads(
        """{"volumes_csv":"Destination Well,Water Transfer Volume (ul),DNA Transfer Volume (ul),Mastermix Volume (ul),Mastermix Source Tube\\nA1,3,7,40,A1\\nB1,3,7,40,A1\\nC1,3,7,40,A1\\n","pip_model":"flex_1channel_50","filter_tip":"yes","tip_racks":"opentrons_flex_96_tiprack_50ul","pip_mount":"right","plate_type":"nest_96_wellplate_200ul_flat","res_type":"nest_1_reservoir_195ml","tip_reuse":"always","protocol_filename":"upload_Uni of Montana_Normalization_Flex_Final_052324"}"""
    )
    return [_all_values[n] for n in names]


from opentrons import protocol_api

metadata = {
    "ctx.Name": "Normalization_Flex",
    "author": "Krishna Soma <krishna.soma@opentrons.com>",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.15"}

tiprack_slots = ["A1", "A2", "B1", "B2"]


def transpose_matrix(m):
    return [[r[i] for r in reversed(m)] for i in range(len(m[0]))]


def flatten_matrix(m):
    return [cell for row in m for cell in row]


def well_csv_to_list(csv_string):
    """
    Takes a csv string and flattens it to a list, re-ordering to match
    Opentrons well order convention (A1, B1, C1, ..., A2, B2, B2, ...)
    """
    data = [line.split(",") for line in reversed(csv_string.split("\n")) if line.strip() if line]
    if len(data[0]) > len(data):
        return flatten_matrix(transpose_matrix(data))
    return flatten_matrix(data)


def run(protocol):
    [volumes_csv, pip_model, pip_mount, plate_type, res_type, filter_tip, tip_reuse] = get_values(
        "volumes_csv", "pip_model", "pip_mount", "plate_type", "res_type", "filter_tip", "tip_reuse"
    )

    # create labware
    plate = protocol.load_labware(plate_type, "C1")
    reservoir = protocol.load_labware(res_type, "C2")
    source = reservoir.wells()[0]
    pip_size = pip_model.split("_")[2]
    print("-----------")
    print(pip_model)
    print("-----------")
    pip_size = "1000" if pip_size == "50" else pip_size
    tip_name = "opentrons_flex_96_tiprack_" + pip_size + "ul"
    if filter_tip == "yes":
        pip_size = "200" if pip_size == "1000" else pip_size
        tip_name = "opentrons_flex_96_filtertiprack_" + pip_size + "ul"

    tipracks = [protocol.load_labware(tip_name, slot) for slot in tiprack_slots]

    pipette = protocol.load_instrument(pip_model, pip_mount, tip_racks=tipracks)

    # create volumes list
    volumes = [float(cell) for cell in well_csv_to_list(volumes_csv)]

    for vol in volumes:
        if vol < pipette.min_volume:
            protocol.comment("WARNING: volume {} is below pipette's minimum volume.".format(vol))

    if tip_reuse == "never":
        pipette.pick_up_tip()

    for vol, dest in zip(volumes, plate.wells()):
        if vol > 0:
            pipette.transfer(vol, source, dest, new_tip=tip_reuse)

    if pipette.has_tip:
        pipette.drop_tip()
