.. _examples:

########
Examples
########

.. testsetup:: examples

  from opentrons import robot, containers, instruments

  plate = containers.load('96-flat', 'B1')
  trough = containers.load('trough-12row', 'C1')

  tiprack_1 = containers.load('tiprack-200ul', 'A1')
  tiprack_2 = containers.load('tiprack-200ul', 'A2')
      
  p200 = instruments.Pipette(
      axis="b",
      max_volume=200,
      tip_racks=[tiprack_2]) 

All examples on this page assume the following containers and pipette:

.. testcode:: examples

  from opentrons import robot, containers, instruments

  plate = containers.load('96-flat', 'B1')
  trough = containers.load('trough-12row', 'C1')

  tiprack_1 = containers.load('tiprack-200ul', 'A1')
  tiprack_2 = containers.load('tiprack-200ul', 'A2') 
      
  p200 = instruments.Pipette(
      axis="b",
      max_volume=200,
      tip_racks=[tiprack_2])  

***************
Serial Dilution
***************

This serial dilution example assumes a standard 96 well plate, using a different tip per column and a different trough row per column.

.. testcode:: examples

  # spread dilutent
  p200.distribute(50, trough.wells('A12'), plate.wells())

  # dilute down each plate column
  for i in range(8):
    col = plate.cols(i)

    # begin the column by transferring 10uL of sample to first well
    p200.pick_up_tip().aspirate(10, trough.wells(i)).dispense(col.wells('1'))

    # dilute the sample down the column
    p200.transfer(
      10, col.wells('1', to='11'), col.wells('2', to='12'),
      mix_after=(3, 25))

******************************

***************
Plate Mapping
***************

Deposit various volumes of liquids into the same plate of wells, and automatically refill the tip volume when it runs out.

.. testcode:: examples

  # these uL values were created randomly for this example
  water_volumes = [
    29, 41, 86, 74, 30, 36, 98, 64,
    54, 42, 36, 10, 52, 10, 75, 41,
    85, 17, 46, 19, 92, 77, 81, 40,
    46, 30, 15, 93, 81, 98, 29, 16,
    68, 41, 60, 62, 73, 45, 78, 78,
    38, 34, 86, 58, 92, 77, 74, 78,
    23, 33, 65, 63, 20, 35, 34, 24,
    99, 12, 99, 96, 52, 75, 70, 82,
    10, 64, 90, 14, 27, 86, 99, 79,
    17, 99, 31, 68, 29, 15, 57, 61,
    79, 58, 94, 79, 17, 29, 78, 54,
    50, 85, 68, 17, 84, 39, 28, 57
  ]

  p200.distribute(water_volumes, trough.wells('A12'), plate)


******************************

*******************
Precision Pipetting
*******************

This example shows how to deposit liquid around the edge of a well.

.. testcode:: examples

  p200.pick_up_tip()

  # rotate around the edge of the well, dropping 10ul at a time
  theta = 0.0
  while p200.current_volume > 0:
      # we can move around a circle with radius (r) and theta (degrees)
      well_edge = plate.wells('B1').from_center(r=1.0, theta=theta, h=0.9)
      
      # combine a Well with a Vector in a tuple
      destination = (plate.wells('B1'), well_edge)
      p200.move_to(destination, strategy='direct')  # move straight there
      p200.dispense(10)
      
      theta += 0.314

  p200.drop_tip()
