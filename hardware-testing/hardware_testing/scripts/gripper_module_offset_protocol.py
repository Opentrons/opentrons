from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gripper-module-offset-test"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

def run(protocol: ProtocolContext) -> None:
    temp_deck = protocol.load_module("temperatureModuleV2", "D3")
    mag_deck = protocol.load_module("magneticBlockV1", "B3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    thermocycler = protocol.load_module("thermocyclerModuleV2", "B1")
    heater_shaker.open_labware_latch()
    thermocycler.open_lid()
    labware = "opentrons_96_wellplate_200ul_pcr_full_skirt"
    plates = []
    plates.append(temp_deck.load_labware(
        labware,
        adapter="opentrons_96_well_aluminum_block"
    ))
    plates.append(mag_deck.load_labware(
        labware
    ))
    plates.append(heater_shaker.load_labware(
        labware,
        adapter="opentrons_96_pcr_adapter"
    ))
    plates.append(thermocycler.load_labware(
        labware
    ))
    for plate in plates:
        module_location = plate.parent
        protocol.move_labware(plate, "C2", use_gripper=True)
        protocol.move_labware(plate, module_location, use_gripper=True)
