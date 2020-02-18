from opentrons import labware, instruments, robot

"""
General Premise of this protocol:
1. This protocol is meant to test anything that
may show up in a users' 'workflow'
2. Utilizes all different functionalities for built-in methods
3. Tests different constructor set-ups
"""

metadata = {
    'protocolName': 'Everything Test',
    'author': 'Opentrons <engineering@opentrons.com>',
    'description': 'A protocol for exercising the API',
    'source': 'Opentrons Repository'
}

# Labware Set-up
# Test whether slot naming conventions hold true
tiprack = labware.load('tiprack-200ul', '1')
tiprack2 = labware.load('tiprack-200ul', '4')
trough = labware.load('trough-12row', 2)

plate = labware.load('96-flat', 'A4')
extra_trash = labware.load('trash-box', '5')
# Test using fixed trash outside of pipette constructor
fixed_trash = robot.fixed_trash

# Pipette constructors
# Set-up pipette constructors using different styles
pipette_single = instruments.P300_Single(
    mount='right',
    tip_racks=[tiprack])

pipette_multi = instruments.Pipette(
    name='P300 Multi',
    axis='b',
    max_volume=300,
    channels=8,
    trash_container=extra_trash,
    tip_racks=[tiprack2])


# Variable initialization
H20 = trough.wells('A1')

# Start of Protocol
# Test return_tip method
pipette_multi.pick_up_tip()
pipette_multi.return_tip()

pipette_single.pick_up_tip()
pipette_single.return_tip()

# Test all functionalities of transfer
pipette_multi.transfer(
    30,
    H20,
    plate.cols('1'),
    mix_before=(5, 30),
    mix_after=(5, 40),
    blow_out=True,
    touch_tip=True)

pipette_single.transfer(
    30,
    H20,
    plate.wells('A2'),
    blow_out=True,
    touch_tip=True,
    air_gap=10)

robot.pause()
# Test the same idea in distribute
pipette_multi.distribute(
    60,
    H20,
    plate.cols('3'),
    touch_tip=True,
    air_gap=10,
    blow_out=True)

pipette_single.distribute(
    60,
    H20,
    plate.cols('4'),
    touch_tip=True,
    air_gap=10,
    blow_out=True)

robot.pause()
# Now for consolidate
pipette_multi.consolidate(
    60,
    plate.cols('3', length=2),
    H20,
    air_gap=10)

pipette_single.consolidate(
    60,
    plate.cols('1'),
    H20,
    air_gap=10,
    blow_out=True)

# Test separate pipetting functionalities such as
# touch_tip, move_to, mix, from_center
robot.pause()

pipette_single.pick_up_tip()

pipette_single.touch_tip(plate.wells('A1'))

pipette_single.touch_tip(plate.wells('B1'), radius=.5)

pipette_single.move_to(
    (plate.wells('C1'), plate.wells('C1').from_center(x=1, y=0, z=-1)),
    strategy='arc')


pipette_single.mix(10, 100, H20)

robot.pause()

# Check normal aspirate/dispense height
pipette_single.aspirate(60, H20)

pipette_single.dispense(60, H20)

robot.pause()

# Check different aspirate/dispense heights
pipette_single.aspirate(60, H20.bottom(4))
pipette_single.dispense(60, H20.top(2))

robot.pause()
# Check different speeds of aspirate/dispense
pipette_single.set_speed(aspirate=10, dispense=20)

pipette_single.aspirate(60, H20)
pipette_single.dispense(60, H20)

robot.pause()

pipette_single.set_speed(aspirate=100, dispense=200)
pipette_single.aspirate(60, H20)
pipette_single.dispense(60, H20)

robot.pause()

pipette_single.move_to(trough.wells('A12'))

pipette_single.drop_tip()

robot.pause()
robot.home()

# Do the same for the multichannel
pipette_multi.pick_up_tip()

pipette_multi.touch_tip(plate.wells('A1'))

pipette_multi.move_to(
    (plate.wells('A3'), plate.wells('A3').from_center(x=1, y=0, z=-1)),
    strategy='arc')

pipette_multi.mix(10, 100, H20)

robot.pause()

pipette_multi.aspirate(60, H20)

pipette_multi.dispense(60, H20)

robot.pause()

# Check different speeds of aspirate/dispense
pipette_multi.set_speed(aspirate=10, dispense=20)

pipette_multi.aspirate(60, H20)
pipette_multi.dispense(60, H20)

robot.pause()

pipette_multi.set_speed(aspirate=100, dispense=200)

pipette_multi.aspirate(60, H20)
pipette_multi.dispense(60, H20)

pipette_multi.move_to(trough.wells('A12'))

# Testing that fixed trash works as a separate variable
pipette_multi.drop_tip(fixed_trash)

robot.home()
robot.pause()

pipette_single.pick_up_tip()

# Testing different methods of list comprehension

# Single Well Series
well_series = plate.wells()
# List of Well Series
list_WS = [plate.wells(), plate.wells()]
# List of lists
list_list = [[plate.wells('A1'), plate.wells('B1')],
             [plate.wells('C1'), plate.wells('D1')]]

list_tuples = [(plate.wells('A1'),
                plate.wells('A1').from_center(x=1, y=0, z=-1)),
               (plate.wells('B1'),
                plate.wells('B1').from_center(x=1, y=0, z=-1))]

pipette_single.transfer(60, H20, well_series)
pipette_single.transfer(60, H20, list_WS)
pipette_single.transfer(60, H20, list_tuples)
