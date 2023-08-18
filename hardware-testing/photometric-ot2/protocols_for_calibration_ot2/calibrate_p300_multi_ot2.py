from opentrons import protocol_api

metadata = {'apiLevel': '2.12'}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', location='2')
    trough = protocol.load_labware('nest_12_reservoir_15ml', location='5')

    # P300 Multi
    tiprack_m300 = protocol.load_labware(f'opentrons_96_tiprack_300ul', location='7')
    m300 = protocol.load_instrument(f'p300_multi_gen2', 'left', tip_racks=[tiprack_m300])

    m300.transfer(m300.min_volume, trough['A11'].bottom(3), plate['A1'].top())
