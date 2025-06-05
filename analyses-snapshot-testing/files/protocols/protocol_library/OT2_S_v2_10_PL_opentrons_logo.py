def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "_pip_model", "type": "dropDown", "label": "Pipette Model", "options": [{"label": "P300 Single GEN2", "value": "p300_single_gen2"}, {"label": "P300 Single GEN1", "value": "p300_single"}, {"label": "P20 Single GEN2", "value": "p20_single_gen2"}, {"label": "P50 Single GEN1", "value": "p50_single"}, {"label": "P1000 Single GEN2", "value": "p1000_single_gen2"}, {"label": "P1000 Single GEN1", "value": "p1000_single"}]}, {"name": "_pip_mount", "type": "dropDown", "label": "Pipette Mount", "options": [{"label": "Right side", "value": "right"}, {"label": "Left side", "value": "left"}]}, {"name": "_dp_type", "type": "dropDown", "label": "Destination Plate Type", "options": [{"label": "NEST 96-Well, 100\u00b5L PCR", "value": "nest_96_wellplate_100ul_pcr_full_skirt"}, {"label": "NEST 96-Well, 200\u00b5L Flat", "value": "nest_96_wellplate_200ul_flat"}, {"label": "BioRad 96-Well, 200\u00b5L PCR", "value": "biorad_96_wellplate_200ul_pcr"}, {"label": "Corning 96-Well, 360\u00b5L Flat", "value": "corning_96_wellplate_360ul_flat"}, {"label": "NEST 96 Deepwell plate 2 mL", "value": "nest_96_wellplate_2ml_deep"}, {"label": "USA Scientific 96 Deep well Plate 2.4 mL", "value": "usascientific_96_wellplate_2.4ml_deep"}]}, {"name": "_dye_type", "type": "dropDown", "label": "Dye Labware Type", "options": [{"label": "NEST 12-Well, 15mL", "value": "nest_12_reservoir_15ml"}, {"label": "USA Scientific 12-Well Reservoir, 22mL", "value": "usascientific_12_reservoir_22ml"}, {"label": "Opentrons 24 Tube Rack with 2mL NEST Tubes", "value": "opentrons_24_tuberack_nest_2ml_snapcap"}, {"label": "Opentrons 24 Tube Rack with 1.5mL NEST Tubes", "value": "opentrons_24_tuberack_nest_1.5ml_snapcap"}, {"label": "Opentrons 24 Tube Rack with 2mL eppendorf Tubes", "value": "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap"}, {"label": "Opentrons 24 Tube Rack with 1.5mL eppendorf Tubes", "value": "opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap"}, {"label": "Opentrons 24 Tube Rack with NEST 0.5 mL Screwcap", "value": "opentrons_24_tuberack_nest_0.5ml_screwcap"}, {"label": "Opentrons 24 Tube Rack with NEST 1.5 mL Screwcap", "value": "opentrons_24_tuberack_nest_1.5ml_screwcap"}, {"label": "Opentrons 24 Tube Rack with NEST 1.5 mL Snapcap", "value": "opentrons_24_tuberack_nest_1.5ml_snapcap"}, {"label": "Opentrons 24 Tube Rack with NEST 2 mL Screwcap", "value": "opentrons_24_tuberack_nest_2ml_screwcap"}, {"label": "Opentrons 24 Tube Rack with Generic 2 mL Screwcap", "value": "opentrons_24_tuberack_generic_2ml_screwcap"}]}]""")
    return [_all_values[n] for n in names]


import math

from opentrons import protocol_api

metadata = {
    "protocolName": "Opentrons Logo",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.10",
}


def run(ctx: protocol_api.ProtocolContext):
    [_pip_model, _pip_mount, _dp_type, _dye_type] = get_values("_pip_model", "_pip_mount", "_dp_type", "_dye_type")
    pip_model = _pip_model
    pip_mount = _pip_mount
    dp_type = _dp_type
    dye_type = _dye_type
    tip_size = pip_model.split("_")[0][1:]
    tip_size = "300" if tip_size == "50" else tip_size
    tip_name = "opentrons_96_tiprack_" + tip_size + "ul"
    tips = [ctx.load_labware(tip_name, "1", "Opentrons Tips")]
    pipette = ctx.load_instrument(pip_model, pip_mount, tip_racks=tips)
    output = ctx.load_labware(dp_type, "3", "Destination Plate")
    dye_container = ctx.load_labware(dye_type, "2", "Dye Source")
    dye1_wells = [
        "A5",
        "A6",
        "A8",
        "A9",
        "B4",
        "B10",
        "C3",
        "C11",
        "D3",
        "D11",
        "E3",
        "E11",
        "F3",
        "F11",
        "G4",
        "G10",
        "H5",
        "H6",
        "H7",
        "H8",
        "H9",
    ]
    dye1_dest = [output[x] for x in dye1_wells]
    dye2_wells = ["C7", "D6", "D7", "D8", "E5", "E6", "E7", "E8", "E9", "F5", "F6", "F7", "F8", "F9", "G6", "G7", "G8"]
    dye2_dest = [output[x] for x in dye2_wells]
    if "reservoir" in dye_type:
        dye1 = [dye_container.wells()[0]] * 2
        dye2 = [dye_container.wells()[1]] * 2
    else:
        dye1 = dye_container.wells()[:2]
        dye2 = dye_container.wells()[2:4]
    dye_vol = 100 if tip_size == "1000" else 50

    def logo_distribute(srcs, dests):
        """
        This is a function that will perform the pick_up_tip(), transfers(),
        and drop_tip() needed to create the Opentrons logo
        :param srcs: source wells (should be a list)
        :param dests: destination wells (should be a list)
        """
        halfDests = math.ceil(len(dests) / 2)
        pipette.pick_up_tip()
        for src, dest in zip(srcs, [dests[:halfDests], dests[halfDests:]]):
            for d in dest:
                pipette.transfer(dye_vol, src, d, new_tip="never")
        pipette.drop_tip()

    logo_distribute(dye1, dye1_dest)
    logo_distribute(dye2, dye2_dest)
