def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "p300_mount", "type": "dropDown", "label": "P300 Single Channel GEN2 Mount Position", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}, {"name": "tip_type", "type": "dropDown", "label": "Tip Rack Type", "options": [{"label": "Opentrons 96 Tip Rack 300 uL", "value": "opentrons_96_tiprack_300ul"}, {"label": "Opentrons 96 Filter Tip Rack 200 uL", "value": "opentrons_96_filtertiprack_200ul"}]}, {"name": "plate_type", "type": "dropDown", "label": "Plate Type", "options": [{"label": "Bio-Rad 96 Well Plate 200 uL PCR", "value": "biorad_96_wellplate_200ul_pcr"}, {"label": "NEST 96 Well Plate 100 uL PCR Full Skirt", "value": "nest_96_wellplate_100ul_pcr_full_skirt"}, {"label": "Corning 96 Well Plate 360 \u00b5L Flat", "value": "corning_96_wellplate_360ul_flat"}, {"label": "NEST 96 Well Plate 200 \u00b5L Flat", "value": "nest_96_wellplate_200ul_flat"}]}]""")
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "Dinosaur",
    "author": "Opentrons <protocols@opentrons.com>",
    "description": "Draw a picture of a dinosaur",
    "apiLevel": "2.9",
}


def run(ctx):
    [p300_mount, tip_type, plate_type] = get_values("p300_mount", "tip_type", "plate_type")
    tiprack = ctx.load_labware(tip_type, 6)
    plate = ctx.load_labware(plate_type, 3)
    reservoir = ctx.load_labware("nest_12_reservoir_15ml", 8)
    p300 = ctx.load_instrument("p300_single_gen2", p300_mount, tip_racks=[tiprack])
    green = reservoir["A1"]
    blue = reservoir["A2"]
    green_wells = list(
        plate.wells(
            "E1",
            "D2",
            "E2",
            "D3",
            "E3",
            "F3",
            "G3",
            "H3",
            "C4",
            "D4",
            "E4",
            "F4",
            "G4",
            "H4",
            "C5",
            "D5",
            "E5",
            "F5",
            "G5",
            "C6",
            "D6",
            "E6",
            "F6",
            "G6",
            "C7",
            "D7",
            "E7",
            "F7",
            "G7",
            "D8",
            "E8",
            "F8",
            "G8",
            "H8",
            "E9",
            "F9",
            "G9",
            "H9",
            "F10",
            "G11",
            "H12",
        )
    )
    blue_wells = list(
        plate.wells("C3", "B4", "A5", "B5", "B6", "A7", "B7", "C8", "C9", "D9", "E10", "E11", "F11", "G12")
    )
    p300.distribute(50, green, green_wells, disposal_vol=0, blow_out=True)
    p300.distribute(50, blue, blue_wells, disposal_vol=0, blow_out=True)
