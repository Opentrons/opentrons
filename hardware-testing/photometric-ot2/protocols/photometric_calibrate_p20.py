from opentrons import protocol_api

metadata = {'apiLevel': '2.12'}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Labware
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', location='2')
    trough = protocol.load_labware('nest_12_reservoir_15ml', location='5')
    vial = protocol.load_labware('radwag_pipette_calibration_vial', location='6')

    # P300 Single (diluent only)
    tiprack_p300 = protocol.load_labware(f'opentrons_96_tiprack_300ul', location='7')
    p300 = protocol.load_instrument(f'p300_single_gen2', 'left', tip_racks=[tiprack_p300])
    p300.transfer(p300.min_volume, trough['A1'].bottom(3), plate['A1'].top())

    # P20 Single
    tiprack_p20 = protocol.load_labware(f'opentrons_96_tiprack_20ul', location='8')
    p20 = protocol.load_instrument(f'p20_single_gen2', 'right', tip_racks=[tiprack_p300])
    p20.transfer(p20.min_volume, trough['A1'].bottom(3), plate['A1'].top())
    p20.transfer(p20.min_volume, vial['A1'].top(-3), vial['A1'].top())
