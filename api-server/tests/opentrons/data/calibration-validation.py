# validate labware calibration instrument selection
from opentrons import containers, instruments

metadata = {
    'protocolName': 'Calibration Validation',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'For validating the accuracy of a pipette',
    'source': 'Opentrons Repository'
}

tiprack_s1 = containers.load('opentrons_96_tiprack_300ul', '10', label='s1')
tiprack_s2 = containers.load('opentrons_96_tiprack_300ul', '3', label='s2')

tiprack_m1 = containers.load('opentrons_96_tiprack_300ul', '4', label='m1')
tiprack_m2 = containers.load('opentrons_96_tiprack_300ul', '1', label='m2')

trough = containers.load('usascientific_12_reservoir_22ml', '11')
plate = containers.load('biorad_96_wellplate_200ul_pcr', '5')

multi = instruments.P300_Multi(
    tip_racks=[tiprack_m2, tiprack_m1], mount='left')

single = instruments.P300_Single(
    tip_racks=[tiprack_s2, tiprack_s1], mount='right')

single.pick_up_tip(tiprack_s1[0])
single.aspirate(25, trough[0])
single.dispense(25, plate[0])
single.return_tip()

single.pick_up_tip(tiprack_s2[0])
single.aspirate(25, trough[0])
single.dispense(25, plate[0])
single.return_tip()

multi.pick_up_tip(tiprack_m1[0])
multi.aspirate(25, trough[0])
multi.dispense(25, plate[0])
multi.return_tip()

multi.pick_up_tip(tiprack_m2[0])
multi.aspirate(25, trough[0])
multi.dispense(25, plate[0])
multi.return_tip()
