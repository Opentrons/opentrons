import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "P50_Single_Import_T_Liquid",
    "author": "Opentrons QA ",
    "created": "2025-05-14T20:32:26.283Z",
    "lastModified": "2025-06-24T20:51:24.790Z",
    "protocolDesigner": "8.5.0-alpha.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="C2",
        namespace="opentrons",
    )
    well_plate_1 = protocol.load_labware(
        "biorad_96_wellplate_200ul_pcr",
        location="C1",
        namespace="opentrons",
    )
    well_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        location="C3",
        namespace="opentrons",
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_50", "left", tip_racks=[tip_rack_1])

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "My liquid! ",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 150)
    well_plate_1["B1"].load_liquid(liquid_1, 150)
    well_plate_1["C1"].load_liquid(liquid_1, 150)
    well_plate_1["D1"].load_liquid(liquid_1, 150)
    well_plate_1["E1"].load_liquid(liquid_1, 150)
    well_plate_1["F1"].load_liquid(liquid_1, 150)
    well_plate_1["G1"].load_liquid(liquid_1, 150)
    well_plate_1["H1"].load_liquid(liquid_1, 150)
    well_plate_1["A2"].load_liquid(liquid_1, 150)
    well_plate_1["B2"].load_liquid(liquid_1, 150)
    well_plate_1["C2"].load_liquid(liquid_1, 150)
    well_plate_1["D2"].load_liquid(liquid_1, 150)
    well_plate_1["E2"].load_liquid(liquid_1, 150)
    well_plate_1["F2"].load_liquid(liquid_1, 150)
    well_plate_1["G2"].load_liquid(liquid_1, 150)
    well_plate_1["H2"].load_liquid(liquid_1, 150)
    well_plate_1["A3"].load_liquid(liquid_1, 150)
    well_plate_1["B3"].load_liquid(liquid_1, 150)
    well_plate_1["C3"].load_liquid(liquid_1, 150)
    well_plate_1["D3"].load_liquid(liquid_1, 150)
    well_plate_1["E3"].load_liquid(liquid_1, 150)
    well_plate_1["F3"].load_liquid(liquid_1, 150)
    well_plate_1["G3"].load_liquid(liquid_1, 150)
    well_plate_1["H3"].load_liquid(liquid_1, 150)
    well_plate_1["A4"].load_liquid(liquid_1, 150)
    well_plate_1["B4"].load_liquid(liquid_1, 150)
    well_plate_1["C4"].load_liquid(liquid_1, 150)
    well_plate_1["D4"].load_liquid(liquid_1, 150)
    well_plate_1["E4"].load_liquid(liquid_1, 150)
    well_plate_1["F4"].load_liquid(liquid_1, 150)
    well_plate_1["G4"].load_liquid(liquid_1, 150)
    well_plate_1["H4"].load_liquid(liquid_1, 150)
    well_plate_1["A5"].load_liquid(liquid_1, 150)
    well_plate_1["B5"].load_liquid(liquid_1, 150)
    well_plate_1["C5"].load_liquid(liquid_1, 150)
    well_plate_1["D5"].load_liquid(liquid_1, 150)
    well_plate_1["E5"].load_liquid(liquid_1, 150)
    well_plate_1["F5"].load_liquid(liquid_1, 150)
    well_plate_1["G5"].load_liquid(liquid_1, 150)
    well_plate_1["H5"].load_liquid(liquid_1, 150)
    well_plate_1["A6"].load_liquid(liquid_1, 150)
    well_plate_1["B6"].load_liquid(liquid_1, 150)
    well_plate_1["C6"].load_liquid(liquid_1, 150)
    well_plate_1["D6"].load_liquid(liquid_1, 150)
    well_plate_1["E6"].load_liquid(liquid_1, 150)
    well_plate_1["F6"].load_liquid(liquid_1, 150)
    well_plate_1["G6"].load_liquid(liquid_1, 150)
    well_plate_1["H6"].load_liquid(liquid_1, 150)
    well_plate_1["A7"].load_liquid(liquid_1, 150)
    well_plate_1["B7"].load_liquid(liquid_1, 150)
    well_plate_1["C7"].load_liquid(liquid_1, 150)
    well_plate_1["D7"].load_liquid(liquid_1, 150)
    well_plate_1["E7"].load_liquid(liquid_1, 150)
    well_plate_1["F7"].load_liquid(liquid_1, 150)
    well_plate_1["G7"].load_liquid(liquid_1, 150)
    well_plate_1["H7"].load_liquid(liquid_1, 150)
    well_plate_1["A8"].load_liquid(liquid_1, 150)
    well_plate_1["B8"].load_liquid(liquid_1, 150)
    well_plate_1["C8"].load_liquid(liquid_1, 150)
    well_plate_1["D8"].load_liquid(liquid_1, 150)
    well_plate_1["E8"].load_liquid(liquid_1, 150)
    well_plate_1["F8"].load_liquid(liquid_1, 150)
    well_plate_1["G8"].load_liquid(liquid_1, 150)
    well_plate_1["H8"].load_liquid(liquid_1, 150)
    well_plate_1["A9"].load_liquid(liquid_1, 150)
    well_plate_1["B9"].load_liquid(liquid_1, 150)
    well_plate_1["C9"].load_liquid(liquid_1, 150)
    well_plate_1["D9"].load_liquid(liquid_1, 150)
    well_plate_1["E9"].load_liquid(liquid_1, 150)
    well_plate_1["F9"].load_liquid(liquid_1, 150)
    well_plate_1["G9"].load_liquid(liquid_1, 150)
    well_plate_1["H9"].load_liquid(liquid_1, 150)
    well_plate_1["A10"].load_liquid(liquid_1, 150)
    well_plate_1["B10"].load_liquid(liquid_1, 150)
    well_plate_1["C10"].load_liquid(liquid_1, 150)
    well_plate_1["D10"].load_liquid(liquid_1, 150)
    well_plate_1["E10"].load_liquid(liquid_1, 150)
    well_plate_1["F10"].load_liquid(liquid_1, 150)
    well_plate_1["G10"].load_liquid(liquid_1, 150)
    well_plate_1["H10"].load_liquid(liquid_1, 150)
    well_plate_1["A11"].load_liquid(liquid_1, 150)
    well_plate_1["B11"].load_liquid(liquid_1, 150)
    well_plate_1["C11"].load_liquid(liquid_1, 150)
    well_plate_1["D11"].load_liquid(liquid_1, 150)
    well_plate_1["E11"].load_liquid(liquid_1, 150)
    well_plate_1["F11"].load_liquid(liquid_1, 150)
    well_plate_1["G11"].load_liquid(liquid_1, 150)
    well_plate_1["H11"].load_liquid(liquid_1, 150)
    well_plate_1["A12"].load_liquid(liquid_1, 150)
    well_plate_1["B12"].load_liquid(liquid_1, 150)
    well_plate_1["C12"].load_liquid(liquid_1, 150)
    well_plate_1["D12"].load_liquid(liquid_1, 150)
    well_plate_1["E12"].load_liquid(liquid_1, 150)
    well_plate_1["F12"].load_liquid(liquid_1, 150)
    well_plate_1["G12"].load_liquid(liquid_1, 150)
    well_plate_1["H12"].load_liquid(liquid_1, 150)

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"ffe3b5ed-5a3a-4e13-a95a-c68b2a0c4354":["opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"My liquid! ","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null}},"ingredLocations":{"fe9cce79-fd99-497d-b040-95d9e5bb46af:opentrons/biorad_96_wellplate_200ul_pcr/2":{"A1":{"0":{"volume":150}},"B1":{"0":{"volume":150}},"C1":{"0":{"volume":150}},"D1":{"0":{"volume":150}},"E1":{"0":{"volume":150}},"F1":{"0":{"volume":150}},"G1":{"0":{"volume":150}},"H1":{"0":{"volume":150}},"A2":{"0":{"volume":150}},"B2":{"0":{"volume":150}},"C2":{"0":{"volume":150}},"D2":{"0":{"volume":150}},"E2":{"0":{"volume":150}},"F2":{"0":{"volume":150}},"G2":{"0":{"volume":150}},"H2":{"0":{"volume":150}},"A3":{"0":{"volume":150}},"B3":{"0":{"volume":150}},"C3":{"0":{"volume":150}},"D3":{"0":{"volume":150}},"E3":{"0":{"volume":150}},"F3":{"0":{"volume":150}},"G3":{"0":{"volume":150}},"H3":{"0":{"volume":150}},"A4":{"0":{"volume":150}},"B4":{"0":{"volume":150}},"C4":{"0":{"volume":150}},"D4":{"0":{"volume":150}},"E4":{"0":{"volume":150}},"F4":{"0":{"volume":150}},"G4":{"0":{"volume":150}},"H4":{"0":{"volume":150}},"A5":{"0":{"volume":150}},"B5":{"0":{"volume":150}},"C5":{"0":{"volume":150}},"D5":{"0":{"volume":150}},"E5":{"0":{"volume":150}},"F5":{"0":{"volume":150}},"G5":{"0":{"volume":150}},"H5":{"0":{"volume":150}},"A6":{"0":{"volume":150}},"B6":{"0":{"volume":150}},"C6":{"0":{"volume":150}},"D6":{"0":{"volume":150}},"E6":{"0":{"volume":150}},"F6":{"0":{"volume":150}},"G6":{"0":{"volume":150}},"H6":{"0":{"volume":150}},"A7":{"0":{"volume":150}},"B7":{"0":{"volume":150}},"C7":{"0":{"volume":150}},"D7":{"0":{"volume":150}},"E7":{"0":{"volume":150}},"F7":{"0":{"volume":150}},"G7":{"0":{"volume":150}},"H7":{"0":{"volume":150}},"A8":{"0":{"volume":150}},"B8":{"0":{"volume":150}},"C8":{"0":{"volume":150}},"D8":{"0":{"volume":150}},"E8":{"0":{"volume":150}},"F8":{"0":{"volume":150}},"G8":{"0":{"volume":150}},"H8":{"0":{"volume":150}},"A9":{"0":{"volume":150}},"B9":{"0":{"volume":150}},"C9":{"0":{"volume":150}},"D9":{"0":{"volume":150}},"E9":{"0":{"volume":150}},"F9":{"0":{"volume":150}},"G9":{"0":{"volume":150}},"H9":{"0":{"volume":150}},"A10":{"0":{"volume":150}},"B10":{"0":{"volume":150}},"C10":{"0":{"volume":150}},"D10":{"0":{"volume":150}},"E10":{"0":{"volume":150}},"F10":{"0":{"volume":150}},"G10":{"0":{"volume":150}},"H10":{"0":{"volume":150}},"A11":{"0":{"volume":150}},"B11":{"0":{"volume":150}},"C11":{"0":{"volume":150}},"D11":{"0":{"volume":150}},"E11":{"0":{"volume":150}},"F11":{"0":{"volume":150}},"G11":{"0":{"volume":150}},"H11":{"0":{"volume":150}},"A12":{"0":{"volume":150}},"B12":{"0":{"volume":150}},"C12":{"0":{"volume":150}},"D12":{"0":{"volume":150}},"E12":{"0":{"volume":150}},"F12":{"0":{"volume":150}},"G12":{"0":{"volume":150}},"H12":{"0":{"volume":150}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"966cab49-9611-47ac-9351-9c49dbfb9b97:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"C2","fe9cce79-fd99-497d-b040-95d9e5bb46af:opentrons/biorad_96_wellplate_200ul_pcr/2":"C1","a94d7816-39b5-4b98-ab2b-2ceea0890880:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2":"C3"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"ffe3b5ed-5a3a-4e13-a95a-c68b2a0c4354":"left"},"trashBinLocationUpdate":{"54f50343-6cdc-4b0e-bd45-b28c4b86696f:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"}},"orderedStepIds":[],"pipettes":{"ffe3b5ed-5a3a-4e13-a95a-c68b2a0c4354":{"pipetteName":"p50_single_flex"}},"modules":{},"labware":{"966cab49-9611-47ac-9351-9c49dbfb9b97:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"fe9cce79-fd99-497d-b040-95d9e5bb46af:opentrons/biorad_96_wellplate_200ul_pcr/2":{"displayName":"Bio-Rad 96 Well Plate 200 µL PCR","labwareDefURI":"opentrons/biorad_96_wellplate_200ul_pcr/2"},"a94d7816-39b5-4b98-ab2b-2ceea0890880:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2":{"displayName":"Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt","labwareDefURI":"opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2"}}}},"metadata":{"protocolName":"P50_Single_Import_T_Liquid","author":"Opentrons QA ","description":"","created":1747254746283,"lastModified":1750798284790,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
