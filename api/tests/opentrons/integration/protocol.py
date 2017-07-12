from opentrons import containers, instruments, robot

p300_tips = containers.load('tiprack-200ul','E3','p10tiprack')
pcr_plate = containers.load('96-PCR-tall','C3','pcr')
template_plate = containers.load('96-PCR-flat','D3','template')

p200_tips = containers.load('tiprack-200ul', 'A1')

trash = containers.load('point', 'D2')

p300multi = instruments.Pipette(
    name="p300-multi",
    axis="a",
    max_volume=300,
    channels=8,
    tip_racks=[p300_tips]
)

p200 = instruments.Pipette(
    axis='b',
    max_volume=200,
    tip_racks=[p200_tips],
    trash_container=trash)

# add 5 uL template to PCR plate 2 times.

for x in range(2):
    for i in range(2):
        p300multi.pick_up_tip(p300_tips.rows[i][0])
        p300multi.aspirate(5,template_plate.rows[i][0])
        p300multi.dispense(pcr_plate.rows[i][0]).touch_tip()
        p300multi.drop_tip(p300_tips.rows[i][0])
    robot.home()

p200.transfer(700, pcr_plate.wells('A2'), template_plate.wells('B2'))

p200.transfer(700, pcr_plate.wells('A2'), template_plate.wells('B2'))

p200.transfer(100, pcr_plate.wells('A1'), pcr_plate.rows('2'))

p200.consolidate(30, pcr_plate.rows('2'), pcr_plate.wells('A1'))

p200.distribute(55, pcr_plate.wells('A1'), pcr_plate.rows('2'))