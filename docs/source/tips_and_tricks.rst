.. _tips_and_tricks:

Opentrons API Tips and Tricks
=============================

The following examples assume the containers and pipettes:

.. testsetup:: main

  from opentrons.robot import Robot
  from opentrons import containers, instruments
  robot = Robot()
  robot.reset()
  robot.connect('Virtual Smoothie')

  tiprack = containers.load('tiprack-200ul', 'A1')
  plate = containers.load('96-flat', 'B1')
  trough = containers.load('trough-12row', 'C1')
  trash = containers.load('point', 'C2')
      
  p200 = instruments.Pipette(axis="b")

.. testcode:: long
  
  from opentrons.robot import Robot
  Robot().reset()

.. testcode:: long

  from opentrons.robot import Robot
  from opentrons import containers, instruments

  robot = Robot()

  tiprack = containers.load('tiprack-200ul', 'A1')
  plate = containers.load('96-flat', 'B1')
  trough = containers.load('trough-12row', 'C1')
  trash = containers.load('point', 'C2')
      
  p200 = instruments.Pipette(axis="b")

Basics
~~~~~~

Simple Transfer
---------------

.. testcode:: main

  robot.clear_commands()        # deletes all previously created commands

  p200.aspirate(plate[0])      # add new commands to queue
  p200.dispense(plate[0])

  robot.simulate()     # simulate all commands
  # robot.run()        # run on physical robot if connected

Running on a Robot
------------------

List your serial ports:

.. testcode:: main

  my_ports = robot.get_serial_ports_list()
  print(my_ports)

.. testoutput:: main
  :hide:

  []

Sample output on OS X / Linux:

.. ::

  ['/dev/tty.usbmodem1421']

On Windows:

.. ::

  ['COM3']

Pass the port name string into :any:`connect` to connect to a physical robot:

::

  robot.connect('/dev/tty.usbmodem1421')

Home
----

.. testcode:: main

  robot.clear_commands()

  # these will be executed immediately
  robot.home()          # by default homes Z first, then all other axis
  robot.home('ab')      # you can also specify the axis

  # this will get enqueued and executed after :meth:``~opentrons.robot.Robot.run`` has been called:

.. testcode:: main

  robot.home('xy', enqueue=True)
  robot.run()

Aspirate then dispense in a single well
---------------------------------------

.. testcode:: main

  p200.aspirate(100, plate['A1']).dispense()


Transfer from one well to another
---------------------------------

.. testcode:: main

  p200.aspirate(100, plate['A1']).dispense(plate['B1'])

Pick up then drop tip at a single location
------------------------------------------

.. testcode:: main

  p200.pick_up_tip(tiprack['A1']).drop_tip()

Pick up then drop tip somewhere else
------------------------------------

.. testcode:: main

  p200.pick_up_tip(tiprack['A1']).drop_tip(tiprack['B1'])
  p200.pick_up_tip(tiprack['B1']).drop_tip(trash)


Mixing at a well
----------------

.. testcode:: main

  p200.mix(100, plate[0], 3)   # arguments are (volume, location, repetitions)

Iterating through wells
-----------------------

.. testcode:: main

  for i in range(96):
      p200.mix(100, plate[i], 3)

.. testcode:: main

  for well in plate:
      p200.mix(100, well, 3)

.. testcode:: main

  for row in plate.rows:
      for well in row:
          p200.mix(100, well, 3)

.. testcode:: main

  for well in plate.cols['A']:
      p200.mix(100, well, 3)

Distribute to multiple wells
----------------------------

.. testcode:: main

  p200.aspirate(100, plate['A1'])
  p200.dispense(30, plate['B1']).dispense(35, plate['B2']).dispense(45, plate['B3'])

Delay
-----

.. testcode:: main

  p200.aspirate(110, plate['A1']).delay(2).dispense(10)
  p200.dispense(plate['B2'])

Advanced Use Cases
~~~~~~~~~~~~~~~~~~

Distribute to entire plate
--------------------------

.. testcode:: main

  robot.clear_commands()

  p200.pick_up_tip(tiprack['A1'])

  dispense_volume = 13
  for i in range(96):
      # refill the tip if it's empty
      if p200.current_volume < dispense_volume:
          p200.aspirate(trough['A1'])
      p200.dispense(dispense_volume, plate[i]).touch_tip()

  p200.drop_tip(trash)
  robot.simulate()

Serial Dilution
---------------

.. testcode:: main

  # Here we assume a 96-well plate with 12 rows and 8 columns
  # A trough has 8 wells, with liquids corresponding to plates columns
  # We are replacing tips for each liquid / column
  for t, col in enumerate(plate.cols):
      p200.pick_up_tip(tiprack[t])  # Use one tip per column

      p200.aspirate(120, trough[t]) # aspirate from a drough
      p200.dispense(col[0])         # dispense everythig into a first well

      # zip(col[:-1], col[1:]) returns pairs of
      # (A1, A2), (A2, A3), (A3, A4), etc
      for well, next_well in zip(col[:-1], col[1:]):
          p200.aspirate(10, well)
          p200.dispense(10, next_well).mix(repetitions=3)

      p200.drop_tip(trash)

Plate Mapping
-------------

.. testcode:: main

  sources = {
      'A1': 'water',
      'A2': 'sugar',
      'A3': 'purple'
  }
  destinations = {
      'A1': {'water': 35, 'sugar': 10, 'purple': 12},
      'B1': {'water': 35, 'sugar': 20, 'purple': 12},
      'C1': {'water': 35, 'sugar': 30, 'purple': 12},
      'D1': {'water': 35, 'sugar': 40, 'purple': 12},
      'E1': {'water': 55, 'sugar': 10, 'purple': 14},
      'F1': {'water': 55, 'sugar': 20, 'purple': 14},
      'G1': {'water': 55, 'sugar': 30, 'purple': 14},
      'H1': {'water': 55, 'sugar': 40, 'purple': 14}
  }

  robot.clear_commands()

  for source_well, ingredient in sources.items():
      # each ingredient has it's own tip
      p200.pick_up_tip(tiprack[source_well])
      # loop through all destination wells
      for destination_well, mapping in destinations.items():
          dispense_volume = mapping[ingredient]
          # refill this tip if it's empty
          if p200.current_volume < dispense_volume:
             p200.aspirate(trough[source_well])
          p200.dispense(dispense_volume, plate[destination_well])
      # blow out the extra liquid, then save the tip
      p200.blow_out(trash).drop_tip(tiprack[source_well])
    
  robot.simulate()

Precision pipetting within a well
---------------------------------

.. testcode:: main

  robot.clear_commands()

  p200.pick_up_tip(tiprack[3])

  # aspirate from 3mm above the bottom of a well
  p200.aspirate(plate[0].bottom(3))

  # dispense from 1mm below the top of a well
  p200.dispense(0, plate[1].top(-1))

  # you can also simple move somewhere using Pipette.move_to()
  # 'arc' will move the head up, then over, then down
  p200.move_to(plate[95].top(10), strategy='arc')
  # 'direct' will move the head in a straight line to the destination
  p200.move_to(plate[95].bottom(), strategy='direct')

  # rotate around the edge of the well
  # dropping 10ul at a time
  theta = 0.0
  while p200.current_volume > 0:
      # we can move around a circle with radius (r) and theta (degrees)
      well_edge = plate[1].from_center(r=1.0, theta=theta, h=0.9)
      
      # combine a Well with a Vector in a tuple
      destination = (plate[1], well_edge)
      p200.move_to(destination, strategy='direct')  # move straight there
      p200.dispense(10)
      
      theta += 0.314

  p200.drop_tip(tiprack[3])

  robot.simulate()
