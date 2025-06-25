import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "P1000STransferSingle",
    "author": "QA",
    "created": "2025-05-28T21:27:06.797Z",
    "lastModified": "2025-06-24T20:53:08.732Z",
    "protocolDesigner": "8.5.0-alpha.0",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.24"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A2",
        namespace="opentrons",
    )
    well_plate_1 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_1300ul",
        location="C1",
        namespace="opentrons",
    )
    well_plate_2 = protocol.load_labware(
        "thermoscientificnunc_96_wellplate_2000ul",
        location="C3",
        namespace="opentrons",
    )
    well_plate_3 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="D1",
        namespace="opentrons",
    )
    well_plate_4 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="D2",
        namespace="opentrons",
    )
    tip_rack_4 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A3",
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (1)",
        namespace="opentrons",
    )
    tip_rack_5 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B1",
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (1)",
        namespace="opentrons",
    )
    tip_rack_6 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="B3",
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (1)",
        namespace="opentrons",
    )
    tip_rack_7 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 1000 µL (2)",
        namespace="opentrons",
    )
    tip_rack_8 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 200 µL (2)",
        namespace="opentrons",
    )
    tip_rack_9 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location=protocol_api.OFF_DECK,
        label="Opentrons Flex 96 Filter Tip Rack 50 µL (2)",
        namespace="opentrons",
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left", tip_racks=[tip_rack_3, tip_rack_4, tip_rack_9, tip_rack_2, tip_rack_5, tip_rack_8, tip_rack_1, tip_rack_6, tip_rack_7])

    # Load Waste Chute:
    waste_chute = protocol.load_waste_chute()

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Source_1",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Source_2",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1["A1"].load_liquid(liquid_1, 1200)
    well_plate_1["B1"].load_liquid(liquid_1, 1200)
    well_plate_1["C1"].load_liquid(liquid_1, 1200)
    well_plate_1["D1"].load_liquid(liquid_1, 1200)
    well_plate_1["E1"].load_liquid(liquid_1, 1200)
    well_plate_1["F1"].load_liquid(liquid_1, 1200)
    well_plate_1["G1"].load_liquid(liquid_1, 1200)
    well_plate_1["H1"].load_liquid(liquid_1, 1200)
    well_plate_1["A2"].load_liquid(liquid_1, 1200)
    well_plate_1["B2"].load_liquid(liquid_1, 1200)
    well_plate_1["C2"].load_liquid(liquid_1, 1200)
    well_plate_1["D2"].load_liquid(liquid_1, 1200)
    well_plate_1["E2"].load_liquid(liquid_1, 1200)
    well_plate_1["F2"].load_liquid(liquid_1, 1200)
    well_plate_1["G2"].load_liquid(liquid_1, 1200)
    well_plate_1["H2"].load_liquid(liquid_1, 1200)
    well_plate_1["A3"].load_liquid(liquid_1, 1200)
    well_plate_1["B3"].load_liquid(liquid_1, 1200)
    well_plate_1["C3"].load_liquid(liquid_1, 1200)
    well_plate_1["D3"].load_liquid(liquid_1, 1200)
    well_plate_1["E3"].load_liquid(liquid_1, 1200)
    well_plate_1["F3"].load_liquid(liquid_1, 1200)
    well_plate_1["G3"].load_liquid(liquid_1, 1200)
    well_plate_1["H3"].load_liquid(liquid_1, 1200)
    well_plate_1["A4"].load_liquid(liquid_1, 1200)
    well_plate_1["B4"].load_liquid(liquid_1, 1200)
    well_plate_1["C4"].load_liquid(liquid_1, 1200)
    well_plate_1["D4"].load_liquid(liquid_1, 1200)
    well_plate_1["E4"].load_liquid(liquid_1, 1200)
    well_plate_1["F4"].load_liquid(liquid_1, 1200)
    well_plate_1["G4"].load_liquid(liquid_1, 1200)
    well_plate_1["H4"].load_liquid(liquid_1, 1200)
    well_plate_1["A5"].load_liquid(liquid_1, 1200)
    well_plate_1["B5"].load_liquid(liquid_1, 1200)
    well_plate_1["C5"].load_liquid(liquid_1, 1200)
    well_plate_1["D5"].load_liquid(liquid_1, 1200)
    well_plate_1["E5"].load_liquid(liquid_1, 1200)
    well_plate_1["F5"].load_liquid(liquid_1, 1200)
    well_plate_1["G5"].load_liquid(liquid_1, 1200)
    well_plate_1["H5"].load_liquid(liquid_1, 1200)
    well_plate_1["A6"].load_liquid(liquid_1, 1200)
    well_plate_1["B6"].load_liquid(liquid_1, 1200)
    well_plate_1["C6"].load_liquid(liquid_1, 1200)
    well_plate_1["D6"].load_liquid(liquid_1, 1200)
    well_plate_1["E6"].load_liquid(liquid_1, 1200)
    well_plate_1["F6"].load_liquid(liquid_1, 1200)
    well_plate_1["G6"].load_liquid(liquid_1, 1200)
    well_plate_1["H6"].load_liquid(liquid_1, 1200)
    well_plate_1["A7"].load_liquid(liquid_1, 1200)
    well_plate_1["B7"].load_liquid(liquid_1, 1200)
    well_plate_1["C7"].load_liquid(liquid_1, 1200)
    well_plate_1["D7"].load_liquid(liquid_1, 1200)
    well_plate_1["E7"].load_liquid(liquid_1, 1200)
    well_plate_1["F7"].load_liquid(liquid_1, 1200)
    well_plate_1["G7"].load_liquid(liquid_1, 1200)
    well_plate_1["H7"].load_liquid(liquid_1, 1200)
    well_plate_1["A8"].load_liquid(liquid_1, 1200)
    well_plate_1["B8"].load_liquid(liquid_1, 1200)
    well_plate_1["C8"].load_liquid(liquid_1, 1200)
    well_plate_1["D8"].load_liquid(liquid_1, 1200)
    well_plate_1["E8"].load_liquid(liquid_1, 1200)
    well_plate_1["F8"].load_liquid(liquid_1, 1200)
    well_plate_1["G8"].load_liquid(liquid_1, 1200)
    well_plate_1["H8"].load_liquid(liquid_1, 1200)
    well_plate_1["A9"].load_liquid(liquid_1, 1200)
    well_plate_1["B9"].load_liquid(liquid_1, 1200)
    well_plate_1["C9"].load_liquid(liquid_1, 1200)
    well_plate_1["D9"].load_liquid(liquid_1, 1200)
    well_plate_1["E9"].load_liquid(liquid_1, 1200)
    well_plate_1["F9"].load_liquid(liquid_1, 1200)
    well_plate_1["G9"].load_liquid(liquid_1, 1200)
    well_plate_1["H9"].load_liquid(liquid_1, 1200)
    well_plate_1["A10"].load_liquid(liquid_1, 1200)
    well_plate_1["B10"].load_liquid(liquid_1, 1200)
    well_plate_1["C10"].load_liquid(liquid_1, 1200)
    well_plate_1["D10"].load_liquid(liquid_1, 1200)
    well_plate_1["E10"].load_liquid(liquid_1, 1200)
    well_plate_1["F10"].load_liquid(liquid_1, 1200)
    well_plate_1["G10"].load_liquid(liquid_1, 1200)
    well_plate_1["H10"].load_liquid(liquid_1, 1200)
    well_plate_1["A11"].load_liquid(liquid_1, 1200)
    well_plate_1["B11"].load_liquid(liquid_1, 1200)
    well_plate_1["C11"].load_liquid(liquid_1, 1200)
    well_plate_1["D11"].load_liquid(liquid_1, 1200)
    well_plate_1["E11"].load_liquid(liquid_1, 1200)
    well_plate_1["F11"].load_liquid(liquid_1, 1200)
    well_plate_1["G11"].load_liquid(liquid_1, 1200)
    well_plate_1["H11"].load_liquid(liquid_1, 1200)
    well_plate_1["A12"].load_liquid(liquid_1, 1200)
    well_plate_1["B12"].load_liquid(liquid_1, 1200)
    well_plate_1["C12"].load_liquid(liquid_1, 1200)
    well_plate_1["D12"].load_liquid(liquid_1, 1200)
    well_plate_1["E12"].load_liquid(liquid_1, 1200)
    well_plate_1["F12"].load_liquid(liquid_1, 1200)
    well_plate_1["G12"].load_liquid(liquid_1, 1200)
    well_plate_1["H12"].load_liquid(liquid_1, 1200)
    well_plate_2["A1"].load_liquid(liquid_2, 1900)
    well_plate_2["B1"].load_liquid(liquid_2, 1900)
    well_plate_2["C1"].load_liquid(liquid_2, 1900)
    well_plate_2["D1"].load_liquid(liquid_2, 1900)
    well_plate_2["E1"].load_liquid(liquid_2, 1900)
    well_plate_2["F1"].load_liquid(liquid_2, 1900)
    well_plate_2["G1"].load_liquid(liquid_2, 1900)
    well_plate_2["H1"].load_liquid(liquid_2, 1900)
    well_plate_2["A2"].load_liquid(liquid_2, 1900)
    well_plate_2["B2"].load_liquid(liquid_2, 1900)
    well_plate_2["C2"].load_liquid(liquid_2, 1900)
    well_plate_2["D2"].load_liquid(liquid_2, 1900)
    well_plate_2["E2"].load_liquid(liquid_2, 1900)
    well_plate_2["F2"].load_liquid(liquid_2, 1900)
    well_plate_2["G2"].load_liquid(liquid_2, 1900)
    well_plate_2["H2"].load_liquid(liquid_2, 1900)
    well_plate_2["A3"].load_liquid(liquid_2, 1900)
    well_plate_2["B3"].load_liquid(liquid_2, 1900)
    well_plate_2["C3"].load_liquid(liquid_2, 1900)
    well_plate_2["D3"].load_liquid(liquid_2, 1900)
    well_plate_2["E3"].load_liquid(liquid_2, 1900)
    well_plate_2["F3"].load_liquid(liquid_2, 1900)
    well_plate_2["G3"].load_liquid(liquid_2, 1900)
    well_plate_2["H3"].load_liquid(liquid_2, 1900)
    well_plate_2["A4"].load_liquid(liquid_2, 1900)
    well_plate_2["B4"].load_liquid(liquid_2, 1900)
    well_plate_2["C4"].load_liquid(liquid_2, 1900)
    well_plate_2["D4"].load_liquid(liquid_2, 1900)
    well_plate_2["E4"].load_liquid(liquid_2, 1900)
    well_plate_2["F4"].load_liquid(liquid_2, 1900)
    well_plate_2["G4"].load_liquid(liquid_2, 1900)
    well_plate_2["H4"].load_liquid(liquid_2, 1900)
    well_plate_2["A5"].load_liquid(liquid_2, 1900)
    well_plate_2["B5"].load_liquid(liquid_2, 1900)
    well_plate_2["C5"].load_liquid(liquid_2, 1900)
    well_plate_2["D5"].load_liquid(liquid_2, 1900)
    well_plate_2["E5"].load_liquid(liquid_2, 1900)
    well_plate_2["F5"].load_liquid(liquid_2, 1900)
    well_plate_2["G5"].load_liquid(liquid_2, 1900)
    well_plate_2["H5"].load_liquid(liquid_2, 1900)
    well_plate_2["A6"].load_liquid(liquid_2, 1900)
    well_plate_2["B6"].load_liquid(liquid_2, 1900)
    well_plate_2["C6"].load_liquid(liquid_2, 1900)
    well_plate_2["D6"].load_liquid(liquid_2, 1900)
    well_plate_2["E6"].load_liquid(liquid_2, 1900)
    well_plate_2["F6"].load_liquid(liquid_2, 1900)
    well_plate_2["G6"].load_liquid(liquid_2, 1900)
    well_plate_2["H6"].load_liquid(liquid_2, 1900)
    well_plate_2["A7"].load_liquid(liquid_2, 1900)
    well_plate_2["B7"].load_liquid(liquid_2, 1900)
    well_plate_2["C7"].load_liquid(liquid_2, 1900)
    well_plate_2["D7"].load_liquid(liquid_2, 1900)
    well_plate_2["E7"].load_liquid(liquid_2, 1900)
    well_plate_2["F7"].load_liquid(liquid_2, 1900)
    well_plate_2["G7"].load_liquid(liquid_2, 1900)
    well_plate_2["H7"].load_liquid(liquid_2, 1900)
    well_plate_2["A8"].load_liquid(liquid_2, 1900)
    well_plate_2["B8"].load_liquid(liquid_2, 1900)
    well_plate_2["C8"].load_liquid(liquid_2, 1900)
    well_plate_2["D8"].load_liquid(liquid_2, 1900)
    well_plate_2["E8"].load_liquid(liquid_2, 1900)
    well_plate_2["F8"].load_liquid(liquid_2, 1900)
    well_plate_2["G8"].load_liquid(liquid_2, 1900)
    well_plate_2["H8"].load_liquid(liquid_2, 1900)
    well_plate_2["A9"].load_liquid(liquid_2, 1900)
    well_plate_2["B9"].load_liquid(liquid_2, 1900)
    well_plate_2["C9"].load_liquid(liquid_2, 1900)
    well_plate_2["D9"].load_liquid(liquid_2, 1900)
    well_plate_2["E9"].load_liquid(liquid_2, 1900)
    well_plate_2["F9"].load_liquid(liquid_2, 1900)
    well_plate_2["G9"].load_liquid(liquid_2, 1900)
    well_plate_2["H9"].load_liquid(liquid_2, 1900)
    well_plate_2["A10"].load_liquid(liquid_2, 1900)
    well_plate_2["B10"].load_liquid(liquid_2, 1900)
    well_plate_2["C10"].load_liquid(liquid_2, 1900)
    well_plate_2["D10"].load_liquid(liquid_2, 1900)
    well_plate_2["E10"].load_liquid(liquid_2, 1900)
    well_plate_2["F10"].load_liquid(liquid_2, 1900)
    well_plate_2["G10"].load_liquid(liquid_2, 1900)
    well_plate_2["H10"].load_liquid(liquid_2, 1900)
    well_plate_2["A11"].load_liquid(liquid_2, 1900)
    well_plate_2["B11"].load_liquid(liquid_2, 1900)
    well_plate_2["C11"].load_liquid(liquid_2, 1900)
    well_plate_2["D11"].load_liquid(liquid_2, 1900)
    well_plate_2["E11"].load_liquid(liquid_2, 1900)
    well_plate_2["F11"].load_liquid(liquid_2, 1900)
    well_plate_2["G11"].load_liquid(liquid_2, 1900)
    well_plate_2["H11"].load_liquid(liquid_2, 1900)
    well_plate_2["A12"].load_liquid(liquid_2, 1900)
    well_plate_2["B12"].load_liquid(liquid_2, 1900)
    well_plate_2["C12"].load_liquid(liquid_2, 1900)
    well_plate_2["D12"].load_liquid(liquid_2, 1900)
    well_plate_2["E12"].load_liquid(liquid_2, 1900)
    well_plate_2["F12"].load_liquid(liquid_2, 1900)
    well_plate_2["G12"].load_liquid(liquid_2, 1900)
    well_plate_2["H12"].load_liquid(liquid_2, 1900)

    # PROTOCOL STEPS



DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.5.0","data":{"pipetteTiprackAssignments":{"61853486-6910-4d82-9193-0b99bc1ac2c3":["opentrons/opentrons_flex_96_filtertiprack_50ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Source_1","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Source_2","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"A1":{"0":{"volume":1200}},"B1":{"0":{"volume":1200}},"C1":{"0":{"volume":1200}},"D1":{"0":{"volume":1200}},"E1":{"0":{"volume":1200}},"F1":{"0":{"volume":1200}},"G1":{"0":{"volume":1200}},"H1":{"0":{"volume":1200}},"A2":{"0":{"volume":1200}},"B2":{"0":{"volume":1200}},"C2":{"0":{"volume":1200}},"D2":{"0":{"volume":1200}},"E2":{"0":{"volume":1200}},"F2":{"0":{"volume":1200}},"G2":{"0":{"volume":1200}},"H2":{"0":{"volume":1200}},"A3":{"0":{"volume":1200}},"B3":{"0":{"volume":1200}},"C3":{"0":{"volume":1200}},"D3":{"0":{"volume":1200}},"E3":{"0":{"volume":1200}},"F3":{"0":{"volume":1200}},"G3":{"0":{"volume":1200}},"H3":{"0":{"volume":1200}},"A4":{"0":{"volume":1200}},"B4":{"0":{"volume":1200}},"C4":{"0":{"volume":1200}},"D4":{"0":{"volume":1200}},"E4":{"0":{"volume":1200}},"F4":{"0":{"volume":1200}},"G4":{"0":{"volume":1200}},"H4":{"0":{"volume":1200}},"A5":{"0":{"volume":1200}},"B5":{"0":{"volume":1200}},"C5":{"0":{"volume":1200}},"D5":{"0":{"volume":1200}},"E5":{"0":{"volume":1200}},"F5":{"0":{"volume":1200}},"G5":{"0":{"volume":1200}},"H5":{"0":{"volume":1200}},"A6":{"0":{"volume":1200}},"B6":{"0":{"volume":1200}},"C6":{"0":{"volume":1200}},"D6":{"0":{"volume":1200}},"E6":{"0":{"volume":1200}},"F6":{"0":{"volume":1200}},"G6":{"0":{"volume":1200}},"H6":{"0":{"volume":1200}},"A7":{"0":{"volume":1200}},"B7":{"0":{"volume":1200}},"C7":{"0":{"volume":1200}},"D7":{"0":{"volume":1200}},"E7":{"0":{"volume":1200}},"F7":{"0":{"volume":1200}},"G7":{"0":{"volume":1200}},"H7":{"0":{"volume":1200}},"A8":{"0":{"volume":1200}},"B8":{"0":{"volume":1200}},"C8":{"0":{"volume":1200}},"D8":{"0":{"volume":1200}},"E8":{"0":{"volume":1200}},"F8":{"0":{"volume":1200}},"G8":{"0":{"volume":1200}},"H8":{"0":{"volume":1200}},"A9":{"0":{"volume":1200}},"B9":{"0":{"volume":1200}},"C9":{"0":{"volume":1200}},"D9":{"0":{"volume":1200}},"E9":{"0":{"volume":1200}},"F9":{"0":{"volume":1200}},"G9":{"0":{"volume":1200}},"H9":{"0":{"volume":1200}},"A10":{"0":{"volume":1200}},"B10":{"0":{"volume":1200}},"C10":{"0":{"volume":1200}},"D10":{"0":{"volume":1200}},"E10":{"0":{"volume":1200}},"F10":{"0":{"volume":1200}},"G10":{"0":{"volume":1200}},"H10":{"0":{"volume":1200}},"A11":{"0":{"volume":1200}},"B11":{"0":{"volume":1200}},"C11":{"0":{"volume":1200}},"D11":{"0":{"volume":1200}},"E11":{"0":{"volume":1200}},"F11":{"0":{"volume":1200}},"G11":{"0":{"volume":1200}},"H11":{"0":{"volume":1200}},"A12":{"0":{"volume":1200}},"B12":{"0":{"volume":1200}},"C12":{"0":{"volume":1200}},"D12":{"0":{"volume":1200}},"E12":{"0":{"volume":1200}},"F12":{"0":{"volume":1200}},"G12":{"0":{"volume":1200}},"H12":{"0":{"volume":1200}}},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"A1":{"1":{"volume":1900}},"B1":{"1":{"volume":1900}},"C1":{"1":{"volume":1900}},"D1":{"1":{"volume":1900}},"E1":{"1":{"volume":1900}},"F1":{"1":{"volume":1900}},"G1":{"1":{"volume":1900}},"H1":{"1":{"volume":1900}},"A2":{"1":{"volume":1900}},"B2":{"1":{"volume":1900}},"C2":{"1":{"volume":1900}},"D2":{"1":{"volume":1900}},"E2":{"1":{"volume":1900}},"F2":{"1":{"volume":1900}},"G2":{"1":{"volume":1900}},"H2":{"1":{"volume":1900}},"A3":{"1":{"volume":1900}},"B3":{"1":{"volume":1900}},"C3":{"1":{"volume":1900}},"D3":{"1":{"volume":1900}},"E3":{"1":{"volume":1900}},"F3":{"1":{"volume":1900}},"G3":{"1":{"volume":1900}},"H3":{"1":{"volume":1900}},"A4":{"1":{"volume":1900}},"B4":{"1":{"volume":1900}},"C4":{"1":{"volume":1900}},"D4":{"1":{"volume":1900}},"E4":{"1":{"volume":1900}},"F4":{"1":{"volume":1900}},"G4":{"1":{"volume":1900}},"H4":{"1":{"volume":1900}},"A5":{"1":{"volume":1900}},"B5":{"1":{"volume":1900}},"C5":{"1":{"volume":1900}},"D5":{"1":{"volume":1900}},"E5":{"1":{"volume":1900}},"F5":{"1":{"volume":1900}},"G5":{"1":{"volume":1900}},"H5":{"1":{"volume":1900}},"A6":{"1":{"volume":1900}},"B6":{"1":{"volume":1900}},"C6":{"1":{"volume":1900}},"D6":{"1":{"volume":1900}},"E6":{"1":{"volume":1900}},"F6":{"1":{"volume":1900}},"G6":{"1":{"volume":1900}},"H6":{"1":{"volume":1900}},"A7":{"1":{"volume":1900}},"B7":{"1":{"volume":1900}},"C7":{"1":{"volume":1900}},"D7":{"1":{"volume":1900}},"E7":{"1":{"volume":1900}},"F7":{"1":{"volume":1900}},"G7":{"1":{"volume":1900}},"H7":{"1":{"volume":1900}},"A8":{"1":{"volume":1900}},"B8":{"1":{"volume":1900}},"C8":{"1":{"volume":1900}},"D8":{"1":{"volume":1900}},"E8":{"1":{"volume":1900}},"F8":{"1":{"volume":1900}},"G8":{"1":{"volume":1900}},"H8":{"1":{"volume":1900}},"A9":{"1":{"volume":1900}},"B9":{"1":{"volume":1900}},"C9":{"1":{"volume":1900}},"D9":{"1":{"volume":1900}},"E9":{"1":{"volume":1900}},"F9":{"1":{"volume":1900}},"G9":{"1":{"volume":1900}},"H9":{"1":{"volume":1900}},"A10":{"1":{"volume":1900}},"B10":{"1":{"volume":1900}},"C10":{"1":{"volume":1900}},"D10":{"1":{"volume":1900}},"E10":{"1":{"volume":1900}},"F10":{"1":{"volume":1900}},"G10":{"1":{"volume":1900}},"H10":{"1":{"volume":1900}},"A11":{"1":{"volume":1900}},"B11":{"1":{"volume":1900}},"C11":{"1":{"volume":1900}},"D11":{"1":{"volume":1900}},"E11":{"1":{"volume":1900}},"F11":{"1":{"volume":1900}},"G11":{"1":{"volume":1900}},"H11":{"1":{"volume":1900}},"A12":{"1":{"volume":1900}},"B12":{"1":{"volume":1900}},"C12":{"1":{"volume":1900}},"D12":{"1":{"volume":1900}},"E12":{"1":{"volume":1900}},"F12":{"1":{"volume":1900}},"G12":{"1":{"volume":1900}},"H12":{"1":{"volume":1900}}},"a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{},"45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{},"58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":"C1","1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":"C3","860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":"D1","b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":"D2","a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A3","45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B1","58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"B3","2b51e1b5-af62-4d51-96f6-e53f5ac55c20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"offDeck","3da54e81-41a7-40bb-ae7a-21c46b932b73:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"offDeck","d6d34253-6094-432e-bb99-7279bc1b67a7:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"offDeck"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"61853486-6910-4d82-9193-0b99bc1ac2c3":"left"},"trashBinLocationUpdate":{},"wasteChuteLocationUpdate":{"b01e5418-14ca-4846-b141-e33813d60829:wasteChute":"cutoutD3"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{"b4db7cd0-6375-4476-a37a-f3aefc8f30fc:gripper":"mounted"},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"}},"orderedStepIds":[],"pipettes":{"61853486-6910-4d82-9193-0b99bc1ac2c3":{"pipetteName":"p1000_single_flex"}},"modules":{},"labware":{"7a21d246-17da-4616-ae98-f94dff1d2132:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"780d7327-daa0-483a-9a58-49d1f1599430:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"7b798f9b-c3ff-45d1-a811-be2933d93a90:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"663098b8-8aff-44d9-814c-73efa91ee976:opentrons/thermoscientificnunc_96_wellplate_1300ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 1300 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_1300ul/2"},"1f67d792-5c23-46d2-9ccb-8843abdf28fa:opentrons/thermoscientificnunc_96_wellplate_2000ul/2":{"displayName":"Thermo Scientific Nunc 96 Well Plate 2000 µL","labwareDefURI":"opentrons/thermoscientificnunc_96_wellplate_2000ul/2"},"860aba5d-7e4f-4cb1-9f8e-1ee5e13795df:opentrons/usascientific_96_wellplate_2.4ml_deep/2":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/2"},"b59a0fb8-cb94-4941-886e-d7c089b0db89:opentrons/nest_96_wellplate_2ml_deep/3":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/3"},"a3ec9992-9b00-4451-a077-578ef21b975c:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"45987d82-d88e-425e-befd-8114611744f6:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"58cf7241-6587-4c42-9df4-e9f3cb5a6c89:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (1)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"2b51e1b5-af62-4d51-96f6-e53f5ac55c20:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"3da54e81-41a7-40bb-ae7a-21c46b932b73:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"d6d34253-6094-432e-bb99-7279bc1b67a7:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL (2)","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"}}}},"metadata":{"protocolName":"P1000STransferSingle","author":"QA","description":"","created":1748467626797,"lastModified":1750798388732,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
