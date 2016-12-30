.. _well_access:

=====================
Container Well Access
=====================

There are many ways to do the same thing in python, so we're going to show you several ways to call container locations, as well as how to access and loop through wells.

Rows vs. Columns
-------------------------------

The OT-One deck and containers are all set up with the same coordinate system - numbered rows and lettered columns.

.. image:: img/well_iteration/Well_Iteration.png

Accessing Wells
-------------------------------

Coordinates
^^^^^^^^^^^

Wells can be called via their string ['A1'], or their well number [0].  List indices in Python start with 0, so for a 96 well plate, the first well is at index 0 and last is at index 95. 

.. code-block:: python

  plate[0] # A1
  plate[1] # B1
  plate[94] # G12
  plate[95] # H12

You can also split the coordinates for the rows and columns and use either ``.rows`` or ``.cols``.

.. testsetup:: main

  from opentrons.robot import Robot
  from opentrons import containers, instruments
  robot = Robot()
  robot.reset()
  robot.connect('Virtual Smoothie')

  p1000rack = containers.load('tiprack-1000ul', 'A1')
  p200rack = containers.load('tiprack-200ul', 'A2', 'p200rack')
  plate = containers.load('96-flat', 'B1')
  plate1 = containers.load('96-flat', 'B2', 'plate1')
  trough = containers.load('trough-12row', 'C1')
  trash = containers.load('point', 'C2')
      
  p200 = instruments.Pipette(axis="a", max_volume=1000, tip_racks=[p200rack])
  p1000 = instruments.Pipette(axis="b", max_volume=1000, tip_racks=[p1000rack])

.. testcode:: main

  plate.rows[0][0] # A1
  plate.cols[0][0] # A1

  plate.rows[0][1] # A2
  plate.cols[1][0] # B1


Rows
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can also call entire rows at once, which is especially useful when you are using an 8-channel pipette.  Simply use the .rows attribute after your container.  You can use an integer or a character.

.. testcode:: main

  plate.rows[0] # row 1
  plate.rows['1']

  plate.rows[1] # row 2
  plate.rows['2']

  plate.rows[11] # row 12
  plate.rows['12']

Columns
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Similar to .rows, except .cols.

.. testcode:: main

  plate.cols[0] # column A
  plate.cols['A']

  plate.cols[1] # column B
  plate.cols['B']

  plate.cols[7] # column H
  plate.cols['H'] 


Iterating Wells
-------------------------------

There are many ways to iterate through a plate, well by well, row by row, col by col, or skipping around.  We will show you examples of how to do all of these.

.. tip::

  **range** (*start, stop, step*)
  
  * **start -** starting number of the sequence
  * **stop -** generate numbers up to, but not including this number
  * **step -** difference between all numbers in the sequence

Entire Plate
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Each of these examples shows how to mix every well in a plate, either by specifying a range, or a list of wells.

.. testcode:: main

  for i in range(96):
    p200.mix(3, 100, plate[i])
  
  for well in plate:
    p200.mix(3, 100, well)

Each of these loops accesses each well in the plate in order, and mixes at each location.

Entire Row
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
This loop iterates through all wells in the first row (A1, B1, C1 etc.). 

.. testcode:: main

  for well in plate.rows[0]:
    p200.mix(3, 100, well)

Entire Column
^^^^^^^^^^^^^

This loop iterates through all wells in the first column.

.. testcode:: main

  for well in plate.cols['A']:
    p200.mix(3, 100, well)

Other Examples
--------------

Odds & Evens
^^^^^^^^^^^^

In order to access every other row, you can utilize the third parameter in ``range()`` and add a step-count to your loop.  A step-count of ``2`` will skip every other number, so calling ``range(0, 12, 2)`` will create ``[0, 2, 4, 6, 8, 10]``.

.. testcode:: main

  for i in range(0, 12, 2):
      well = plate1.rows[i]
      p200.pick_up_tip().aspirate(200, trough['A1']).dispense(well).return_tip()

  # Or a bit more Pythonic
  for well in plate1.rows[0:12:2]:
      p200.pick_up_tip().aspirate(200, trough['A1']).dispense(well).return_tip()

You can alter this step to be any integer and get access to every n wells.

Chaining
^^^^^^^^

Skipping around multiple chains is easy, once you have the right tools.  There are some python functions that are not inherent to the API, but that can be imported to make your life easier.  You can import the chain function when you import the opentrons API at the start of your python notebook.

.. testcode:: main

  from itertools import chain

The chain function allows you to link two sets of locations together, in this case, two different columns.  The loop will iterate through all wells in column A and column E, while skipping columns BCDFGH.

.. testcode:: main

  dest_iter = chain(plate1.cols['A'], plate1.cols['E'])

  for well in trough[:12]:
      p1000.aspirate(600, well)
      p1000.dispense(300, next(dest_iter))
      p1000.dispense(300, next(dest_iter))
