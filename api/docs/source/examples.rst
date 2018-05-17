.. _examples:

########
Examples
########

All examples on this page assume the following labware and pipette:

.. code-block:: python

  from opentrons import robot, labware, instruments

  plate = labware.load('96-flat', '1')
  trough = labware.load('trough-12row', '2')

  tiprack_1 = labware.load('tiprack-200ul', '3')
  tiprack_2 = labware.load('tiprack-200ul', '4')

  p300 = instruments.P300_Single(
      mount='left',
      tip_racks=[tiprack_2])

******************************

***************
Basic Transfer
***************

Moving 100uL from one well to another:

.. code-block:: python

  p300.transfer(100, plate.wells('A1'), plate.wells('B1'))

If you prefer to not use the ``.transfer()`` command, the following pipette commands will create the some results:

.. code-block:: python

  p300.pick_up_tip()
  p300.aspirate(100, plate.wells('A1'))
  p300.dispense(100, plate.wells('A1'))
  p300.return_tip()

******************************

*****
Loops
*****

Loops in Python allows your protocol to perform many actions, or act upon many wells, all within just a few lines. The below example loops through the numbers ``0`` to ``11``, and uses that loop's current value to transfer from all wells in a trough to each row of a plate:

.. code-block:: python

  # distribute 20uL from trough:A1 -> plate:row:1
  # distribute 20uL from trough:A2 -> plate:row:2
  # etc...

  # ranges() starts at 0 and stops at 12, creating a range of 0-11
  for i in range(12):
    p300.distribute(200, trough.wells(i), plate.rows(i))

******************************

*******************
Multiple Air Gaps
*******************

The Opentrons liquid handler can do some things that a human cannot do with a pipette, like accurately alternate between aspirating and creating air gaps within the same tip. The below example will aspirate from five wells in the trough, while creating a air gap between each sample.

.. code-block:: python

  p300.pick_up_tip()

  for well in trough.wells():
    p300.aspirate(35, well).air_gap(10)

  p300.dispense(plate.wells('A1'))

  p300.return_tip()

******************************

***************
Dilution
***************

This example first spreads a dilutent to all wells of a plate. It then dilutes 8 samples from the trough across the 8 columns of the plate.

.. code-block:: python

  p300.distribute(50, trough.wells('A12'), plate.wells())  # dilutent

  # loop through each row
  for i in range(8):

    # save the source well and destination column to variables
    source = trough.wells(i)
    row = plate.rows(i)

    # transfer 30uL of source to first well in column
    p300.transfer(30, source, column.wells('1'))

    # dilute the sample down the column
    p300.transfer(
      30, row.wells('1', to='11'), row.wells('2', to='12'),
      mix_after=(3, 25))

******************************

***************
Plate Mapping
***************

Deposit various volumes of liquids into the same plate of wells, and automatically refill the tip volume when it runs out.

.. code-block:: python

  # these uL values were created randomly for this example
  water_volumes = [
    1,  2,  3,  4,  5,  6,  7,  8,
    9,  10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 52, 53, 54, 55, 56,
    57, 58, 59, 60, 61, 62, 63, 64,
    65, 66, 67, 68, 69, 70, 71, 72,
    73, 74, 75, 76, 77, 78, 79, 80,
    81, 82, 83, 84, 85, 86, 87, 88,
    89, 90, 91, 92, 93, 94, 95, 96
  ]

  p300.distribute(water_volumes, trough.wells('A12'), plate)

The final volumes can also be read from a CSV, and opened by your protocol.

.. code-block:: python

  '''
    This example uses a CSV file saved on the same computer, formatted as follows,
    where the columns in the file represent the 12 columns of the plate,
    and the rows in the file represent the 8 rows of the plate,
    and the values represent the uL that must end up at that location

    1,  2,  3,  4,  5,  6,  7,  8, 9,  10, 11, 12,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84,
    85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96
  '''

  # open file with absolute path (will be different depending on operating system)
  # file paths on Windows look more like 'C:\\path\\to\\your\\csv_file.csv'
  with open('/path/to/your/csv_file.csv') as my_file:

      # save all volumes from CSV file into a list
      volumes = []

      # loop through each line (the plate's columns)
      for l in my_file.read().splitlines():
          # loop through each comma-separated value (the plate's rows)
          for v in l.split(','):
              volumes.append(float(v))  # save the volume

      # distribute those volumes to the plate
      p300.distribute(volumes, trough.wells('A1'), plate.wells())



******************************

*******************
Precision Pipetting
*******************

This example shows how to deposit liquid around the edge of a well.

.. code-block:: python

  p300.pick_up_tip()
  p300.aspirate(200, trough.wells('A1'))
  # rotate around the edge of the well, dropping 20ul at a time
  theta = 0.0
  while p300.current_volume > 0:
      # we can move around a circle with radius (r) and theta (degrees)
      well_edge = plate.wells('B1').from_center(r=1.0, theta=theta, h=0.9)

      # combine a Well with a Vector in a tuple
      destination = (plate.wells('B1'), well_edge)
      p300.move_to(destination, strategy='direct')  # move straight there
      p300.dispense(20)

      theta += 0.314

  p300.drop_tip()
