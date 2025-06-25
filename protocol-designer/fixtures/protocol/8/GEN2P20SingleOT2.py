import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "GEN2P20SingleOT2",
    "created": "2025-06-06T19:45:48.344Z",
    "lastModified": "2025-06-24T20:57:44.459Z",
    "protocolDesigner": "8.5.0-alpha.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.24"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    well_plate_1 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_2000ul",
        location="8",
        namespace="opentrons",
    )
    well_plate_2 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_1300ul",
        location="9",
        namespace="opentrons",
    )
    well_plate_3 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="5",
        namespace="opentrons",
    )
    well_plate_4 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="6",
        namespace="opentrons",
    )
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_filtertiprack_20ul",
        location="1",
        namespace="opentrons",
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_96_filtertiprack_20ul",
        location="2",
        label="Opentrons OT-2 96 Filter Tip Rack 20 µL (1)",
        namespace="opentrons",
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_96_tiprack_300ul",
        location="3",
        namespace="opentrons",
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p20_single_gen2", "left", tip_racks=[tip_rack_1, tip_rack_2])
    pipette_right = protocol.load_instrument("p300_single_gen2", "right", tip_racks=[tip_rack_3])

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Purple",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 1900)
    well_plate_1["B1"].load_liquid(liquid_1, 1900)
    well_plate_1["C1"].load_liquid(liquid_1, 1900)
    well_plate_1["D1"].load_liquid(liquid_1, 1900)
    well_plate_1["E1"].load_liquid(liquid_1, 1900)
    well_plate_1["F1"].load_liquid(liquid_1, 1900)
    well_plate_1["G1"].load_liquid(liquid_1, 1900)
    well_plate_1["H1"].load_liquid(liquid_1, 1900)
    well_plate_1["A2"].load_liquid(liquid_1, 1900)
    well_plate_1["B2"].load_liquid(liquid_1, 1900)
    well_plate_1["C2"].load_liquid(liquid_1, 1900)
    well_plate_1["D2"].load_liquid(liquid_1, 1900)
    well_plate_1["E2"].load_liquid(liquid_1, 1900)
    well_plate_1["F2"].load_liquid(liquid_1, 1900)
    well_plate_1["G2"].load_liquid(liquid_1, 1900)
    well_plate_1["H2"].load_liquid(liquid_1, 1900)
    well_plate_1["A3"].load_liquid(liquid_1, 1900)
    well_plate_1["B3"].load_liquid(liquid_1, 1900)
    well_plate_1["C3"].load_liquid(liquid_1, 1900)
    well_plate_1["D3"].load_liquid(liquid_1, 1900)
    well_plate_1["E3"].load_liquid(liquid_1, 1900)
    well_plate_1["F3"].load_liquid(liquid_1, 1900)
    well_plate_1["G3"].load_liquid(liquid_1, 1900)
    well_plate_1["H3"].load_liquid(liquid_1, 1900)
    well_plate_1["A4"].load_liquid(liquid_1, 1900)
    well_plate_1["B4"].load_liquid(liquid_1, 1900)
    well_plate_1["C4"].load_liquid(liquid_1, 1900)
    well_plate_1["D4"].load_liquid(liquid_1, 1900)
    well_plate_1["E4"].load_liquid(liquid_1, 1900)
    well_plate_1["F4"].load_liquid(liquid_1, 1900)
    well_plate_1["G4"].load_liquid(liquid_1, 1900)
    well_plate_1["H4"].load_liquid(liquid_1, 1900)
    well_plate_1["A5"].load_liquid(liquid_1, 1900)
    well_plate_1["B5"].load_liquid(liquid_1, 1900)
    well_plate_1["C5"].load_liquid(liquid_1, 1900)
    well_plate_1["D5"].load_liquid(liquid_1, 1900)
    well_plate_1["E5"].load_liquid(liquid_1, 1900)
    well_plate_1["F5"].load_liquid(liquid_1, 1900)
    well_plate_1["G5"].load_liquid(liquid_1, 1900)
    well_plate_1["H5"].load_liquid(liquid_1, 1900)
    well_plate_1["A6"].load_liquid(liquid_1, 1900)
    well_plate_1["B6"].load_liquid(liquid_1, 1900)
    well_plate_1["C6"].load_liquid(liquid_1, 1900)
    well_plate_1["D6"].load_liquid(liquid_1, 1900)
    well_plate_1["E6"].load_liquid(liquid_1, 1900)
    well_plate_1["F6"].load_liquid(liquid_1, 1900)
    well_plate_1["G6"].load_liquid(liquid_1, 1900)
    well_plate_1["H6"].load_liquid(liquid_1, 1900)
    well_plate_1["A7"].load_liquid(liquid_1, 1900)
    well_plate_1["B7"].load_liquid(liquid_1, 1900)
    well_plate_1["C7"].load_liquid(liquid_1, 1900)
    well_plate_1["D7"].load_liquid(liquid_1, 1900)
    well_plate_1["E7"].load_liquid(liquid_1, 1900)
    well_plate_1["F7"].load_liquid(liquid_1, 1900)
    well_plate_1["G7"].load_liquid(liquid_1, 1900)
    well_plate_1["H7"].load_liquid(liquid_1, 1900)
    well_plate_1["A8"].load_liquid(liquid_1, 1900)
    well_plate_1["B8"].load_liquid(liquid_1, 1900)
    well_plate_1["C8"].load_liquid(liquid_1, 1900)
    well_plate_1["D8"].load_liquid(liquid_1, 1900)
    well_plate_1["E8"].load_liquid(liquid_1, 1900)
    well_plate_1["F8"].load_liquid(liquid_1, 1900)
    well_plate_1["G8"].load_liquid(liquid_1, 1900)
    well_plate_1["H8"].load_liquid(liquid_1, 1900)
    well_plate_1["A9"].load_liquid(liquid_1, 1900)
    well_plate_1["B9"].load_liquid(liquid_1, 1900)
    well_plate_1["C9"].load_liquid(liquid_1, 1900)
    well_plate_1["D9"].load_liquid(liquid_1, 1900)
    well_plate_1["E9"].load_liquid(liquid_1, 1900)
    well_plate_1["F9"].load_liquid(liquid_1, 1900)
    well_plate_1["G9"].load_liquid(liquid_1, 1900)
    well_plate_1["H9"].load_liquid(liquid_1, 1900)
    well_plate_1["A10"].load_liquid(liquid_1, 1900)
    well_plate_1["B10"].load_liquid(liquid_1, 1900)
    well_plate_1["C10"].load_liquid(liquid_1, 1900)
    well_plate_1["D10"].load_liquid(liquid_1, 1900)
    well_plate_1["E10"].load_liquid(liquid_1, 1900)
    well_plate_1["F10"].load_liquid(liquid_1, 1900)
    well_plate_1["G10"].load_liquid(liquid_1, 1900)
    well_plate_1["H10"].load_liquid(liquid_1, 1900)
    well_plate_1["A11"].load_liquid(liquid_1, 1900)
    well_plate_1["B11"].load_liquid(liquid_1, 1900)
    well_plate_1["C11"].load_liquid(liquid_1, 1900)
    well_plate_1["D11"].load_liquid(liquid_1, 1900)
    well_plate_1["E11"].load_liquid(liquid_1, 1900)
    well_plate_1["F11"].load_liquid(liquid_1, 1900)
    well_plate_1["G11"].load_liquid(liquid_1, 1900)
    well_plate_1["H11"].load_liquid(liquid_1, 1900)
    well_plate_1["A12"].load_liquid(liquid_1, 1900)
    well_plate_1["B12"].load_liquid(liquid_1, 1900)
    well_plate_1["C12"].load_liquid(liquid_1, 1900)
    well_plate_1["D12"].load_liquid(liquid_1, 1900)
    well_plate_1["E12"].load_liquid(liquid_1, 1900)
    well_plate_1["F12"].load_liquid(liquid_1, 1900)
    well_plate_1["G12"].load_liquid(liquid_1, 1900)
    well_plate_1["H12"].load_liquid(liquid_1, 1900)
    well_plate_2["A1"].load_liquid(liquid_1, 1290)
    well_plate_2["B1"].load_liquid(liquid_1, 1290)
    well_plate_2["C1"].load_liquid(liquid_1, 1290)
    well_plate_2["D1"].load_liquid(liquid_1, 1290)
    well_plate_2["E1"].load_liquid(liquid_1, 1290)
    well_plate_2["F1"].load_liquid(liquid_1, 1290)
    well_plate_2["G1"].load_liquid(liquid_1, 1290)
    well_plate_2["H1"].load_liquid(liquid_1, 1290)
    well_plate_2["A2"].load_liquid(liquid_1, 1290)
    well_plate_2["B2"].load_liquid(liquid_1, 1290)
    well_plate_2["C2"].load_liquid(liquid_1, 1290)
    well_plate_2["D2"].load_liquid(liquid_1, 1290)
    well_plate_2["E2"].load_liquid(liquid_1, 1290)
    well_plate_2["F2"].load_liquid(liquid_1, 1290)
    well_plate_2["G2"].load_liquid(liquid_1, 1290)
    well_plate_2["H2"].load_liquid(liquid_1, 1290)
    well_plate_2["A3"].load_liquid(liquid_1, 1290)
    well_plate_2["B3"].load_liquid(liquid_1, 1290)
    well_plate_2["C3"].load_liquid(liquid_1, 1290)
    well_plate_2["D3"].load_liquid(liquid_1, 1290)
    well_plate_2["E3"].load_liquid(liquid_1, 1290)
    well_plate_2["F3"].load_liquid(liquid_1, 1290)
    well_plate_2["G3"].load_liquid(liquid_1, 1290)
    well_plate_2["H3"].load_liquid(liquid_1, 1290)
    well_plate_2["A4"].load_liquid(liquid_1, 1290)
    well_plate_2["B4"].load_liquid(liquid_1, 1290)
    well_plate_2["C4"].load_liquid(liquid_1, 1290)
    well_plate_2["D4"].load_liquid(liquid_1, 1290)
    well_plate_2["E4"].load_liquid(liquid_1, 1290)
    well_plate_2["F4"].load_liquid(liquid_1, 1290)
    well_plate_2["G4"].load_liquid(liquid_1, 1290)
    well_plate_2["H4"].load_liquid(liquid_1, 1290)
    well_plate_2["A5"].load_liquid(liquid_1, 1290)
    well_plate_2["B5"].load_liquid(liquid_1, 1290)
    well_plate_2["C5"].load_liquid(liquid_1, 1290)
    well_plate_2["D5"].load_liquid(liquid_1, 1290)
    well_plate_2["E5"].load_liquid(liquid_1, 1290)
    well_plate_2["F5"].load_liquid(liquid_1, 1290)
    well_plate_2["G5"].load_liquid(liquid_1, 1290)
    well_plate_2["H5"].load_liquid(liquid_1, 1290)
    well_plate_2["A6"].load_liquid(liquid_1, 1290)
    well_plate_2["B6"].load_liquid(liquid_1, 1290)
    well_plate_2["C6"].load_liquid(liquid_1, 1290)
    well_plate_2["D6"].load_liquid(liquid_1, 1290)
    well_plate_2["E6"].load_liquid(liquid_1, 1290)
    well_plate_2["F6"].load_liquid(liquid_1, 1290)
    well_plate_2["G6"].load_liquid(liquid_1, 1290)
    well_plate_2["H6"].load_liquid(liquid_1, 1290)
    well_plate_2["A7"].load_liquid(liquid_1, 1290)
    well_plate_2["B7"].load_liquid(liquid_1, 1290)
    well_plate_2["C7"].load_liquid(liquid_1, 1290)
    well_plate_2["D7"].load_liquid(liquid_1, 1290)
    well_plate_2["E7"].load_liquid(liquid_1, 1290)
    well_plate_2["F7"].load_liquid(liquid_1, 1290)
    well_plate_2["G7"].load_liquid(liquid_1, 1290)
    well_plate_2["H7"].load_liquid(liquid_1, 1290)
    well_plate_2["A8"].load_liquid(liquid_1, 1290)
    well_plate_2["B8"].load_liquid(liquid_1, 1290)
    well_plate_2["C8"].load_liquid(liquid_1, 1290)
    well_plate_2["D8"].load_liquid(liquid_1, 1290)
    well_plate_2["E8"].load_liquid(liquid_1, 1290)
    well_plate_2["F8"].load_liquid(liquid_1, 1290)
    well_plate_2["G8"].load_liquid(liquid_1, 1290)
    well_plate_2["H8"].load_liquid(liquid_1, 1290)
    well_plate_2["A9"].load_liquid(liquid_1, 1290)
    well_plate_2["B9"].load_liquid(liquid_1, 1290)
    well_plate_2["C9"].load_liquid(liquid_1, 1290)
    well_plate_2["D9"].load_liquid(liquid_1, 1290)
    well_plate_2["E9"].load_liquid(liquid_1, 1290)
    well_plate_2["F9"].load_liquid(liquid_1, 1290)
    well_plate_2["G9"].load_liquid(liquid_1, 1290)
    well_plate_2["H9"].load_liquid(liquid_1, 1290)
    well_plate_2["A10"].load_liquid(liquid_1, 1290)
    well_plate_2["B10"].load_liquid(liquid_1, 1290)
    well_plate_2["C10"].load_liquid(liquid_1, 1290)
    well_plate_2["D10"].load_liquid(liquid_1, 1290)
    well_plate_2["E10"].load_liquid(liquid_1, 1290)
    well_plate_2["F10"].load_liquid(liquid_1, 1290)
    well_plate_2["G10"].load_liquid(liquid_1, 1290)
    well_plate_2["H10"].load_liquid(liquid_1, 1290)
    well_plate_2["A11"].load_liquid(liquid_1, 1290)
    well_plate_2["B11"].load_liquid(liquid_1, 1290)
    well_plate_2["C11"].load_liquid(liquid_1, 1290)
    well_plate_2["D11"].load_liquid(liquid_1, 1290)
    well_plate_2["E11"].load_liquid(liquid_1, 1290)
    well_plate_2["F11"].load_liquid(liquid_1, 1290)
    well_plate_2["G11"].load_liquid(liquid_1, 1290)
    well_plate_2["H11"].load_liquid(liquid_1, 1290)
    well_plate_2["A12"].load_liquid(liquid_1, 1290)
    well_plate_2["B12"].load_liquid(liquid_1, 1290)
    well_plate_2["C12"].load_liquid(liquid_1, 1290)
    well_plate_2["D12"].load_liquid(liquid_1, 1290)
    well_plate_2["E12"].load_liquid(liquid_1, 1290)
    well_plate_2["F12"].load_liquid(liquid_1, 1290)
    well_plate_2["G12"].load_liquid(liquid_1, 1290)
    well_plate_2["H12"].load_liquid(liquid_1, 1290)

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"317e9a3e-928a-4e46-a11a-0d383ca0928c":["opentrons/opentrons_96_filtertiprack_20ul/1"],"7c5e55ef-b3c1-430e-b123-838d4709ed37":["opentrons/opentrons_96_tiprack_300ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Purple","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null}},"ingredLocations":{"82d7e0a9-38d5-4246-ab0e-a9cc0b3b1ff1:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"A1":{"0":{"volume":1900}},"B1":{"0":{"volume":1900}},"C1":{"0":{"volume":1900}},"D1":{"0":{"volume":1900}},"E1":{"0":{"volume":1900}},"F1":{"0":{"volume":1900}},"G1":{"0":{"volume":1900}},"H1":{"0":{"volume":1900}},"A2":{"0":{"volume":1900}},"B2":{"0":{"volume":1900}},"C2":{"0":{"volume":1900}},"D2":{"0":{"volume":1900}},"E2":{"0":{"volume":1900}},"F2":{"0":{"volume":1900}},"G2":{"0":{"volume":1900}},"H2":{"0":{"volume":1900}},"A3":{"0":{"volume":1900}},"B3":{"0":{"volume":1900}},"C3":{"0":{"volume":1900}},"D3":{"0":{"volume":1900}},"E3":{"0":{"volume":1900}},"F3":{"0":{"volume":1900}},"G3":{"0":{"volume":1900}},"H3":{"0":{"volume":1900}},"A4":{"0":{"volume":1900}},"B4":{"0":{"volume":1900}},"C4":{"0":{"volume":1900}},"D4":{"0":{"volume":1900}},"E4":{"0":{"volume":1900}},"F4":{"0":{"volume":1900}},"G4":{"0":{"volume":1900}},"H4":{"0":{"volume":1900}},"A5":{"0":{"volume":1900}},"B5":{"0":{"volume":1900}},"C5":{"0":{"volume":1900}},"D5":{"0":{"volume":1900}},"E5":{"0":{"volume":1900}},"F5":{"0":{"volume":1900}},"G5":{"0":{"volume":1900}},"H5":{"0":{"volume":1900}},"A6":{"0":{"volume":1900}},"B6":{"0":{"volume":1900}},"C6":{"0":{"volume":1900}},"D6":{"0":{"volume":1900}},"E6":{"0":{"volume":1900}},"F6":{"0":{"volume":1900}},"G6":{"0":{"volume":1900}},"H6":{"0":{"volume":1900}},"A7":{"0":{"volume":1900}},"B7":{"0":{"volume":1900}},"C7":{"0":{"volume":1900}},"D7":{"0":{"volume":1900}},"E7":{"0":{"volume":1900}},"F7":{"0":{"volume":1900}},"G7":{"0":{"volume":1900}},"H7":{"0":{"volume":1900}},"A8":{"0":{"volume":1900}},"B8":{"0":{"volume":1900}},"C8":{"0":{"volume":1900}},"D8":{"0":{"volume":1900}},"E8":{"0":{"volume":1900}},"F8":{"0":{"volume":1900}},"G8":{"0":{"volume":1900}},"H8":{"0":{"volume":1900}},"A9":{"0":{"volume":1900}},"B9":{"0":{"volume":1900}},"C9":{"0":{"volume":1900}},"D9":{"0":{"volume":1900}},"E9":{"0":{"volume":1900}},"F9":{"0":{"volume":1900}},"G9":{"0":{"volume":1900}},"H9":{"0":{"volume":1900}},"A10":{"0":{"volume":1900}},"B10":{"0":{"volume":1900}},"C10":{"0":{"volume":1900}},"D10":{"0":{"volume":1900}},"E10":{"0":{"volume":1900}},"F10":{"0":{"volume":1900}},"G10":{"0":{"volume":1900}},"H10":{"0":{"volume":1900}},"A11":{"0":{"volume":1900}},"B11":{"0":{"volume":1900}},"C11":{"0":{"volume":1900}},"D11":{"0":{"volume":1900}},"E11":{"0":{"volume":1900}},"F11":{"0":{"volume":1900}},"G11":{"0":{"volume":1900}},"H11":{"0":{"volume":1900}},"A12":{"0":{"volume":1900}},"B12":{"0":{"volume":1900}},"C12":{"0":{"volume":1900}},"D12":{"0":{"volume":1900}},"E12":{"0":{"volume":1900}},"F12":{"0":{"volume":1900}},"G12":{"0":{"volume":1900}},"H12":{"0":{"volume":1900}}},"ec04d05f-e7b9-41ef-8ec6-40eea7306555:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"A1":{"0":{"volume":1290}},"B1":{"0":{"volume":1290}},"C1":{"0":{"volume":1290}},"D1":{"0":{"volume":1290}},"E1":{"0":{"volume":1290}},"F1":{"0":{"volume":1290}},"G1":{"0":{"volume":1290}},"H1":{"0":{"volume":1290}},"A2":{"0":{"volume":1290}},"B2":{"0":{"volume":1290}},"C2":{"0":{"volume":1290}},"D2":{"0":{"volume":1290}},"E2":{"0":{"volume":1290}},"F2":{"0":{"volume":1290}},"G2":{"0":{"volume":1290}},"H2":{"0":{"volume":1290}},"A3":{"0":{"volume":1290}},"B3":{"0":{"volume":1290}},"C3":{"0":{"volume":1290}},"D3":{"0":{"volume":1290}},"E3":{"0":{"volume":1290}},"F3":{"0":{"volume":1290}},"G3":{"0":{"volume":1290}},"H3":{"0":{"volume":1290}},"A4":{"0":{"volume":1290}},"B4":{"0":{"volume":1290}},"C4":{"0":{"volume":1290}},"D4":{"0":{"volume":1290}},"E4":{"0":{"volume":1290}},"F4":{"0":{"volume":1290}},"G4":{"0":{"volume":1290}},"H4":{"0":{"volume":1290}},"A5":{"0":{"volume":1290}},"B5":{"0":{"volume":1290}},"C5":{"0":{"volume":1290}},"D5":{"0":{"volume":1290}},"E5":{"0":{"volume":1290}},"F5":{"0":{"volume":1290}},"G5":{"0":{"volume":1290}},"H5":{"0":{"volume":1290}},"A6":{"0":{"volume":1290}},"B6":{"0":{"volume":1290}},"C6":{"0":{"volume":1290}},"D6":{"0":{"volume":1290}},"E6":{"0":{"volume":1290}},"F6":{"0":{"volume":1290}},"G6":{"0":{"volume":1290}},"H6":{"0":{"volume":1290}},"A7":{"0":{"volume":1290}},"B7":{"0":{"volume":1290}},"C7":{"0":{"volume":1290}},"D7":{"0":{"volume":1290}},"E7":{"0":{"volume":1290}},"F7":{"0":{"volume":1290}},"G7":{"0":{"volume":1290}},"H7":{"0":{"volume":1290}},"A8":{"0":{"volume":1290}},"B8":{"0":{"volume":1290}},"C8":{"0":{"volume":1290}},"D8":{"0":{"volume":1290}},"E8":{"0":{"volume":1290}},"F8":{"0":{"volume":1290}},"G8":{"0":{"volume":1290}},"H8":{"0":{"volume":1290}},"A9":{"0":{"volume":1290}},"B9":{"0":{"volume":1290}},"C9":{"0":{"volume":1290}},"D9":{"0":{"volume":1290}},"E9":{"0":{"volume":1290}},"F9":{"0":{"volume":1290}},"G9":{"0":{"volume":1290}},"H9":{"0":{"volume":1290}},"A10":{"0":{"volume":1290}},"B10":{"0":{"volume":1290}},"C10":{"0":{"volume":1290}},"D10":{"0":{"volume":1290}},"E10":{"0":{"volume":1290}},"F10":{"0":{"volume":1290}},"G10":{"0":{"volume":1290}},"H10":{"0":{"volume":1290}},"A11":{"0":{"volume":1290}},"B11":{"0":{"volume":1290}},"C11":{"0":{"volume":1290}},"D11":{"0":{"volume":1290}},"E11":{"0":{"volume":1290}},"F11":{"0":{"volume":1290}},"G11":{"0":{"volume":1290}},"H11":{"0":{"volume":1290}},"A12":{"0":{"volume":1290}},"B12":{"0":{"volume":1290}},"C12":{"0":{"volume":1290}},"D12":{"0":{"volume":1290}},"E12":{"0":{"volume":1290}},"F12":{"0":{"volume":1290}},"G12":{"0":{"volume":1290}},"H12":{"0":{"volume":1290}}},"dbd7585a-96b1-456c-96e4-4e3fda9ec2d6:opentrons/opentrons_96_filtertiprack_20ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"82d7e0a9-38d5-4246-ab0e-a9cc0b3b1ff1:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":"8","ec04d05f-e7b9-41ef-8ec6-40eea7306555:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":"9","009f35d4-5006-40e5-83ae-ede94453cbd9:opentrons/usascientific_96_wellplate_2.4ml_deep/2":"5","c7bf9da5-f050-4133-a875-2134d61fb922:opentrons/nest_96_wellplate_2ml_deep/3":"6","5a56466c-a3fe-48f9-814d-b4d762cc10d8:opentrons/opentrons_96_filtertiprack_20ul/1":"1","dbd7585a-96b1-456c-96e4-4e3fda9ec2d6:opentrons/opentrons_96_filtertiprack_20ul/1":"2","9990a03f-e218-44a8-b8f6-7232ac9e50a7:opentrons/opentrons_96_tiprack_300ul/1":"3"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"317e9a3e-928a-4e46-a11a-0d383ca0928c":"left","7c5e55ef-b3c1-430e-b123-838d4709ed37":"right"},"trashBinLocationUpdate":{"12bcd370-eadf-4979-9f33-7ac74fb32eea:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"}},"orderedStepIds":[],"pipettes":{"317e9a3e-928a-4e46-a11a-0d383ca0928c":{"pipetteName":"p20_single_gen2"},"7c5e55ef-b3c1-430e-b123-838d4709ed37":{"pipetteName":"p300_single_gen2"}},"modules":{},"labware":{"82d7e0a9-38d5-4246-ab0e-a9cc0b3b1ff1:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 2000 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_2000ul/2"},"ec04d05f-e7b9-41ef-8ec6-40eea7306555:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 1300 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/2"},"009f35d4-5006-40e5-83ae-ede94453cbd9:opentrons/usascientific_96_wellplate_2.4ml_deep/2":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/2"},"c7bf9da5-f050-4133-a875-2134d61fb922:opentrons/nest_96_wellplate_2ml_deep/3":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/3"},"5a56466c-a3fe-48f9-814d-b4d762cc10d8:opentrons/opentrons_96_filtertiprack_20ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_96_filtertiprack_20ul/1"},"dbd7585a-96b1-456c-96e4-4e3fda9ec2d6:opentrons/opentrons_96_filtertiprack_20ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 20 µL (1)","labwareDefURI":"opentrons/opentrons_96_filtertiprack_20ul/1"},"9990a03f-e218-44a8-b8f6-7232ac9e50a7:opentrons/opentrons_96_tiprack_300ul/1":{"displayName":"Opentrons OT-2 96 Tip Rack 300 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_300ul/1"}}}},"metadata":{"protocolName":"GEN2P20SingleOT2","author":"","description":"","created":1749239148344,"lastModified":1750798664459,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
