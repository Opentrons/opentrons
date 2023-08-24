from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gripper-module-force-test"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

TEMP = "RT" # HOT / COLD / RT
if TEMP == "COLD":
    set_temp = 4
elif TEMP == "HOT":
    set_temp = 95

hold_time = 10 # 10 minutes

def run(protocol: ProtocolContext) -> None:
    mag_deck = protocol.load_module("magneticBlockV1", "B3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    temp_deck = protocol.load_module("temperatureModuleV2", "D3")
    thermocycler = protocol.load_module("thermocyclerModuleV2", "B1")
    heater_shaker.open_labware_latch()
    thermocycler.open_lid()
    labware = "opentrons_96_wellplate_200ul_pcr_full_skirt"
    plates = []
    if TEMP == "RT" or TEMP == "HOT" or TEMP == "COLD":
        plate_td = temp_deck.load_labware(labware, adapter="opentrons_96_well_aluminum_block")
        plate_tc = thermocycler.load_labware(labware)
        plates.append(plate_td)
        plates.append(plate_tc)
    if TEMP == "RT" or TEMP == "HOT":
        plate_hs = heater_shaker.load_labware(labware, adapter="opentrons_96_pcr_adapter")
        plates.append(plate_hs)
    if TEMP == "RT":
        plate_md = mag_deck.load_labware(labware)
        plates.append(plate_md)
    if TEMP == "HOT" or TEMP == "COLD":
        if TEMP == "HOT":
            heater_shaker.set_and_wait_for_temperature(set_temp)
        temp_deck.set_temperature(set_temp)
        thermocycler.close_lid()
        thermocycler.set_block_temperature(set_temp)
        protocol.delay(minutes=hold_time)
        thermocycler.open_lid()
    for plate in plates:
        origin = plate.parent
        for i in range(20):
            protocol.move_labware(plate, "C2", use_gripper=True)
            protocol.move_labware(plate, origin, use_gripper=True)
