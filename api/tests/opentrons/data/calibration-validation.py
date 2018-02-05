# validate labware calibration instrument selection
from opentrons import containers, instruments

tiprack_s1 = containers.load('tiprack-200ul', '6', label='s1')
tiprack_s2 = containers.load('tiprack-200ul', '3', label='s2')

tiprack_m1 = containers.load('tiprack-200ul', '4', label='m1')
tiprack_m2 = containers.load('tiprack-200ul', '1', label='m2')

trough = containers.load('trough-12row', '8')
plate = containers.load('96-PCR-flat', '5')

multi = instruments.Pipette(
    name="p200",
    tip_racks=[tiprack_m2, tiprack_m1],
    mount="left",
    channels=8
)

single = instruments.Pipette(
    name="p200s",
    tip_racks=[tiprack_s2, tiprack_s1],
    mount="right"
)

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
