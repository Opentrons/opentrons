def get_values(*names):
    import json

    _all_values = json.loads(
        """{"csv_samp":"Date,6/6/2013,,Experiment,,,,,,,,\\nTotal Number of Samples,,,37,,,10,Final concentration (ng/µL),,,\\"Source deck locations A2, A3, B4, C4\\",\\nNumber of Columns,,,5,Do not change this value.,,40,Final volume (µL),,,,\\n,,,,,,,,,,,\\nSource Location,Source Well,Source Volume ,Buffer Volume,Destination Location,Destination Well,Start Concentration,Sample,,Source Plates,Location,\\nA2,,0.0,40.0,A4,A1,0,NTC,,,A2,Q20230905B\\nA2,F02,7.1,32.9,A4,B1,55.99,2692,,,A3,Q20230831A\\nA2,H02,8.2,31.8,A4,C1,48.52,2694,,,B4,\\nA2,F03,6.5,33.5,A4,D1,61.95,2700,,,C4,\\nA2,H03,6.3,33.7,A4,E1,63.95,2702,,,,\\nA2,,0.0,40.0,A4,F1,,NTC,,Destination Plate,,\\nA2,D04,7.5,32.5,A4,G1,53.64,2705,,,,\\nA2,E04,6.0,34.0,A4,H1,66.67,2706,,,,\\nA2,H04,6.9,33.1,A4,A2,57.57,2709,,,,\\nA2,A05,5.6,34.4,A4,B2,71.92,2710,,,,\\nA2,C05,6.0,34.0,A4,C2,66.29,2712,,,,\\nA2,D05,7.7,32.3,A4,D2,51.91,2713,,,,\\nA2,E05,5.2,34.8,A4,E2,77.09,2714,,,,\\nA2,F05,6.1,33.9,A4,F2,65.5,2715,,,,\\nA2,G05,7.7,32.3,A4,G2,51.68,2716,,,,\\nA2,G06,5.3,34.7,A4,H2,75.08,2724,,,,\\nA2,B07,8.0,32.0,A4,A3,49.97,2725,,,,\\nA2,C07,8.5,31.5,A4,B3,46.98,2726,,,,\\nA2,E07,8.0,32.0,A4,C3,49.81,2728,,,,\\nA2,C08,8.2,31.8,A4,D3,48.63,2734,,,,\\nA2,F08,8.6,31.4,A4,E3,46.49,2737,,,,\\n,,,,A4,F3,,,,,,\\n,,,,A4,G3,,,,,,\\n,,,,A4,H3,,,,,,\\nB2,,0.0,40.0,A4,A4,0,NTC,,,,\\nB2,B01,6.1,33.9,A4,B4,65.12,2635,,,,\\nB2,C01,7.7,32.3,A4,C4,51.9,2636,,,,\\nB2,D01,7.8,32.2,A4,D4,51.04,2637,,,,\\nB2,E01,6.9,33.1,A4,E4,58,2638,,,,\\nB2,F01,7.5,32.5,A4,F4,53.14,2639,,,,\\nB2,H01,5.4,34.6,A4,G4,74.64,2641,,,,\\nB2,A02,5.8,34.2,A4,H4,68.6,2642,,,,\\nB2,B02,6.1,33.9,A4,A5,65.82,2643,,,,\\nB2,C02,8.0,32.0,A4,B5,49.69,2644,,,,\\nB2,D02,6.7,33.3,A4,C5,59.35,2645,,,,\\nB2,E02,8.2,31.8,A4,D5,48.86,2646,,,,\\nB2,F02,5.0,35.0,A4,E5,79.33,2647,,,,\\nB2,G02,6.6,33.4,A4,F5,60.8,2648,,,,\\nB2,,,,A4,G5,,,,,,\\nB2,,,,A4,H5,,,,,,\\n,,,,A4,A6,,,,,,\\n,,,,A4,B6,,,,,,\\n,,,,A4,C6,,,,,,\\n,,,,A4,D6,,,,,,\\n,,,,A4,E6,,,,,,\\n,,,,A4,F6,,,,,,\\n,,,,A4,G6,,,,,,\\n,,,,A4,H6,,,,,,\\n,,,,A4,A7,,,,,,\\n,,,,A4,B7,,,,,,\\n,,,,A4,C7,,,,,,\\n,,,,A4,D7,,,,,,\\n,,,,A4,E7,,,,,,\\n,,,,A4,F7,,,,,,\\n,,,,A4,G7,,,,,,\\n,,,,A4,H7,,,,,,\\n,,,,A4,A8,,,,,,\\n,,,,A4,B8,,,,,,\\n,,,,A4,C8,,,,,,\\n,,,,A4,D8,,,,,,\\n,,,,A4,E8,,,,,,\\n,,,,A4,F8,,,,,,\\n,,,,A4,G8,,,,,,\\n,,,,A4,H8,,,,,,\\n,,,,A4,A9,,,,,,\\n,,,,A4,B9,,,,,,\\n,,,,A4,C9,,,,,,\\n,,,,A4,D9,,,,,,\\n,,,,A4,E9,,,,,,\\n,,,,A4,F9,,,,,,\\n,,,,A4,G9,,,,,,\\n,,,,A4,H9,,,,,,\\n,,,,A4,A10,,,,,,\\n,,,,A4,B10,,,,,,\\n,,,,A4,C10,,,,,,\\n,,,,A4,D10,,,,,,\\n,,,,A4,E10,,,,,,\\n,,,,A4,F10,,,,,,\\n,,,,A4,G10,,,,,,\\n,,,,A4,H10,,,,,,\\n,,,,A4,A11,,,,,,\\n,,,,A4,B11,,,,,,\\n,,,,A4,C11,,,,,,\\n,,,,A4,D11,,,,,,\\n,,,,A4,E11,,,,,,\\n,,,,A4,F11,,,,,,\\n,,,,A4,G11,,,,,,\\n,,,,A4,H11,,,,,,\\n,,,,A4,A12,,,,,,\\n,,,,A4,B12,,,,,,\\n,,,,A4,C12,,,,,,\\n,,,,A4,D12,,,,,,\\n,,,,A4,E12,,,,,,\\n,,,,A4,F12,,,,,,\\n,,,,A4,G12,,,,,,\\n,,,,A4,H12,,,,,,\\n","asp_rate":1,"disp_rate":1,"p50_mount":"right","protocol_filename":"cherrypicking-csv-airgap"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa
from collections import defaultdict

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "Cherrypicking Protocol",
    "author": "Rami Farawi <rami.farawi@opentrons.com",
}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}


def run(ctx: protocol_api.ProtocolContext):

    [csv_samp, asp_rate, disp_rate, p50_mount] = get_values("csv_samp", "asp_rate", "disp_rate", "p50_mount")  # noqa: F821

    # test_mode = False
    # use_temp_mod = False
    # temp_mod_temp = 24
    #     p50_mount = 'left'
    #     asp_rate = 1
    #     disp_rate = 1
    #
    #
    #     csv_samp = '''
    # Date,6/6/2013,,Experiment,,,,,,,,
    # Total Number of Samples,,,37,,,10,Final concentration (ng/µL),,,"Source deck locations A2, A3, B4, C4",
    # Number of Columns,,,5,Do not change this value.,,40,Final volume (µL),,,,
    # ,,,,,,,,,,,
    # Source Location,Source Well,Source Volume ,Buffer Volume,Destination Location,Destination Well,Start Concentration,Sample,,Source Plates,Location,
    # A2,,0.0,40.0,A4,A1,0,NTC,,,A2,Q20230905B
    # A2,F02,7.1,32.9,A4,B1,55.99,2692,,,A3,Q20230831A
    # A2,H02,8.2,31.8,A4,C1,48.52,2694,,,B4,
    # A2,F03,6.5,33.5,A4,D1,61.95,2700,,,C4,
    # A2,H03,6.3,33.7,A4,E1,63.95,2702,,,,
    # A2,,0.0,40.0,A4,F1,,NTC,,Destination Plate,,
    # A2,D04,7.5,32.5,A4,G1,53.64,2705,,,,
    # A2,E04,6.0,34.0,A4,H1,66.67,2706,,,,
    # A2,H04,6.9,33.1,A4,A2,57.57,2709,,,,
    # A2,A05,5.6,34.4,A4,B2,71.92,2710,,,,
    # A2,C05,6.0,34.0,A4,C2,66.29,2712,,,,
    # A2,D05,7.7,32.3,A4,D2,51.91,2713,,,,
    # A2,E05,5.2,34.8,A4,E2,77.09,2714,,,,
    # A2,F05,6.1,33.9,A4,F2,65.5,2715,,,,
    # A2,G05,7.7,32.3,A4,G2,51.68,2716,,,,
    # A2,G06,5.3,34.7,A4,H2,75.08,2724,,,,
    # A2,B07,8.0,32.0,A4,A3,49.97,2725,,,,
    # A2,C07,8.5,31.5,A4,B3,46.98,2726,,,,
    # A2,E07,8.0,32.0,A4,C3,49.81,2728,,,,
    # A2,C08,8.2,31.8,A4,D3,48.63,2734,,,,
    # A2,F08,8.6,31.4,A4,E3,46.49,2737,,,,
    # ,,,,A4,F3,,,,,,
    # ,,,,A4,G3,,,,,,
    # ,,,,A4,H3,,,,,,
    # B2,,0.0,40.0,A4,A4,0,NTC,,,,
    # B2,B01,6.1,33.9,A4,B4,65.12,2635,,,,
    # B2,C01,7.7,32.3,A4,C4,51.9,2636,,,,
    # B2,D01,7.8,32.2,A4,D4,51.04,2637,,,,
    # B2,E01,6.9,33.1,A4,E4,58,2638,,,,
    # B2,F01,7.5,32.5,A4,F4,53.14,2639,,,,
    # B2,H01,5.4,34.6,A4,G4,74.64,2641,,,,
    # B2,A02,5.8,34.2,A4,H4,68.6,2642,,,,
    # B2,B02,6.1,33.9,A4,A5,65.82,2643,,,,
    # B2,C02,8.0,32.0,A4,B5,49.69,2644,,,,
    # B2,D02,6.7,33.3,A4,C5,59.35,2645,,,,
    # B2,E02,8.2,31.8,A4,D5,48.86,2646,,,,
    # B2,F02,5.0,35.0,A4,E5,79.33,2647,,,,
    # B2,G02,6.6,33.4,A4,F5,60.8,2648,,,,
    # B2,,,,A4,G5,,,,,,
    # B2,,,,A4,H5,,,,,,
    # ,,,,A4,A6,,,,,,
    # ,,,,A4,B6,,,,,,
    # ,,,,A4,C6,,,,,,
    # ,,,,A4,D6,,,,,,
    # ,,,,A4,E6,,,,,,
    # ,,,,A4,F6,,,,,,
    # ,,,,A4,G6,,,,,,
    # ,,,,A4,H6,,,,,,
    # ,,,,A4,A7,,,,,,
    # ,,,,A4,B7,,,,,,
    # ,,,,A4,C7,,,,,,
    # ,,,,A4,D7,,,,,,
    # ,,,,A4,E7,,,,,,
    # ,,,,A4,F7,,,,,,
    # ,,,,A4,G7,,,,,,
    # ,,,,A4,H7,,,,,,
    # ,,,,A4,A8,,,,,,
    # ,,,,A4,B8,,,,,,
    # ,,,,A4,C8,,,,,,
    # ,,,,A4,D8,,,,,,
    # ,,,,A4,E8,,,,,,
    # ,,,,A4,F8,,,,,,
    # ,,,,A4,G8,,,,,,
    # ,,,,A4,H8,,,,,,
    # ,,,,A4,A9,,,,,,
    # ,,,,A4,B9,,,,,,
    # ,,,,A4,C9,,,,,,
    # ,,,,A4,D9,,,,,,
    # ,,,,A4,E9,,,,,,
    # ,,,,A4,F9,,,,,,
    # ,,,,A4,G9,,,,,,
    # ,,,,A4,H9,,,,,,
    # ,,,,A4,A10,,,,,,
    # ,,,,A4,B10,,,,,,
    # ,,,,A4,C10,,,,,,
    # ,,,,A4,D10,,,,,,
    # ,,,,A4,E10,,,,,,
    # ,,,,A4,F10,,,,,,
    # ,,,,A4,G10,,,,,,
    # ,,,,A4,H10,,,,,,
    # ,,,,A4,A11,,,,,,
    # ,,,,A4,B11,,,,,,
    # ,,,,A4,C11,,,,,,
    # ,,,,A4,D11,,,,,,
    # ,,,,A4,E11,,,,,,
    # ,,,,A4,F11,,,,,,
    # ,,,,A4,G11,,,,,,
    # ,,,,A4,H11,,,,,,
    # ,,,,A4,A12,,,,,,
    # ,,,,A4,B12,,,,,,
    # ,,,,A4,C12,,,,,,
    # ,,,,A4,D12,,,,,,
    # ,,,,A4,E12,,,,,,
    # ,,,,A4,F12,,,,,,
    # ,,,,A4,G12,,,,,,
    # ,,,,A4,H12,,,,,,
    #     '''

    # DECK SETUP AND LABWARE
    source_plate = [ctx.load_labware("biorad_96_wellplate_200ul_pcr", slot) for slot in [2, 5, 8, 11]]

    temp_mod = ctx.load_module("temperature module gen2", "D1")
    dest_plate = temp_mod.load_labware("biorad_96_wellplate_200ul_pcr")
    default_trash = ctx.load_trash_bin(location="A3")
    res = ctx.load_labware("agilent_1_reservoir_290ml", "C3")
    water = res["A1"]

    tiprack_single = [ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", slot) for slot in ["C1"]]
    # LOAD PIPETTES
    p50 = ctx.load_instrument("flex_1channel_50", p50_mount, tip_racks=tiprack_single)

    csv_lines = [[val.strip() for val in line.split(",")] for line in csv_samp.splitlines() if line.split(",")[0].strip()][4:]

    airgap = 5

    for line in csv_lines:
        source_slot_string = line[0]
        source_well_string = line[1]
        source_vol_string = line[2]
        dil_vol_string = line[3]
        dest_slot_string = line[4]
        dest_well_string = line[5]

        if source_slot_string is None or source_slot_string == "":
            continue
        if dest_slot_string is None or dest_slot_string == "":
            continue
        if source_well_string is None or source_well_string == "":
            continue
        if dest_well_string is None or dest_well_string == "":
            continue
        if source_vol_string == "0.0" or source_vol_string == "0" or source_vol_string == "":
            continue
        if source_vol_string is None or source_vol_string == "":
            continue
        if dil_vol_string == "0.0" or dil_vol_string == "0" or dil_vol_string == "":
            continue

        if dil_vol_string is None:
            continue

        print(source_vol_string)
        # print(dil_vol_string)
        source_vol = float(source_vol_string)
        dil_vol = float(dil_vol_string)

        # if len(source_vol) == 0:
        #     continue
        # if source_well_string and source_vol > 0 and source_slot_string and dest_well_string:
        if source_well_string[1] == "0":
            new_source_string = source_well_string[0] + source_well_string[2]
        # print(new_source_string, dest_well_string, source_slot_string, dest_slot_string)
        # print(ctx.deck[source_slot_string])
        p50.pick_up_tip()
        p50.aspirate(dil_vol, water)
        p50.air_gap(airgap)
        p50.aspirate(source_vol, ctx.deck[source_slot_string][new_source_string], rate=asp_rate)
        p50.dispense(source_vol + airgap + dil_vol, dest_plate[dest_well_string], rate=disp_rate)
        p50.mix(4, (source_vol + airgap + dil_vol) * 0.4, dest_plate[dest_well_string])
        p50.blow_out(dest_plate[dest_well_string].top(z=-3))
        p50.drop_tip()

    samples_liq = ctx.define_liquid(
        name="Samples",
        description="Samples",
        display_color="#7EFF42",
    )

    for plate in source_plate:
        for well in plate.wells()[::2]:
            well.load_liquid(liquid=samples_liq, volume=200)

    dil_liq = ctx.define_liquid(
        name="Diluent",
        description="Diluent",
        display_color="#50D5FF",
    )

    res["A1"].load_liquid(liquid=dil_liq, volume=200)
