.. _getting_started:

===============
Writing a Protocol
===============

Welcome to the API (Application Program Interface).  These tutorials assume no base knowledge of python. We recommend installing the Jupyter notebook to run Opentrons API before attempting these examples. Please refer to :ref:`setup` for detailed instructions.

.. tip::

	Separate your installs, imports, containers and commands into separate cells for easy testing!


Import Opentrons API
--------------------

Before running any code, you need to install the Opentrons API in your jupyter notebook by running the cell below.  This only needs to be done the first time you use jupyter, so feel free to comment it out after it successfully installs.

.. code-block:: bash
	
	!pip install --upgrade opentrons

.. note::

	You can update your API by repeating the !pip install, but remember to restart your notebook afterwards for the changes to take effect

Now that you've installed Opentrons API on your computer, you have access to a variety of robot container and instrument commands. You need to import them to each project (protocol) in order to access these commands.  Unlike the install, this set of imports needs to be done at the start of each protocol.

.. testsetup:: main

  from opentrons import robot, instruments, containers
  robot.reset()
  robot.connect()
  i = 0

  tiprack = containers.load(
      'tiprack-200ul',
      'A2',
      'tiprack-for-test')

  plate = containers.load(
		'96-PCR-flat',
		'B3',
		'plate-for-test'
  )

  trash = containers.load(
		'point',
		'C1',
		'trash-for-test'
  )
  p200 = instruments.Pipette(
      name="p200",
      trash_container=trash,
      tip_racks=[tiprack],
      min_volume=20,
      max_volume=200,
      axis="a",
      channels=1
  )

  p200.reset()

.. testcode:: main
	
	from opentrons import robot, containers, instruments


Deck Set Up
-----------

Now that you have a robot to run commands on, you need to tell it what containers and pipettes to use.

.. note:: 
	
	This section replaces the deck and head sections of JSON files 

Containers
^^^^^^^^^^

.. code-block:: python
	
	plate = containers.load('96-flat', 'B2', 'optional-unique-name')

Each container on the deck is loaded using the container's name and assign it to a slot. The API comes packaged with a set of containers, and users can create and add their own custom containers.

**containers.load** (*container, slot, name*)

	* **container -** type of container (aka "trough-12row")
	* **slot -** the slot location on the deck ("A1" through "E3")
	* **name -** (optional) custom name, used inside API when saving calibration data

The robot will save calibrated container coordinates from old runs based on the ``container`` and ``slot`` combination. Therefore, if you repeatedly place the same container type in the same slot, the robot will assume your old calibrated coordinates for that container.

However, if you include the optional third argument ``name``, the robot will assume coordinates based off the ``name`` and ``slot`` combination. This allows a container to differentiate it's saved coordinates from previous protocols.

The example below declares 3 different containers and assigns them to the appropriate slots on the deck. The trash uses a custom name, so that it doesn not inherit the coordinates of previous "point" containers at slot "C3".

.. testcode:: main
	
	tiprack = containers.load('tiprack-200ul', 'A1')
	plate = containers.load('96-PCR-flat', 'B2')
	trash = containers.load('point', 'C3', 'my-weird-trash-container')


Pipettes
^^^^^^^^

.. code-block:: python
	
	mypipette = instruments.Pipette(
		axis="b",
		max_volume=200,
		min_volume=20,
		tip_racks=[tiprack],
		trash_container=trash,
		channels=1,
		name="mypipette"
	)

**instruments.Pipette** (*name, trash_container, tip_racks, min_volume, max_volume, axis, channels*)

	* **axis -** axis the pipette is on (a or b)
	* **max_volume -** maximum volume of pipette
	* **min_volume -** (optional) minimum volume of pipette
	* **tip_racks -** (optional) array (list) of container(s) where you want to pick up tips
	* **trash_container -** (optional) given name of container where you want to deposit tips
	* **channels -** (optional) number of channels (1 or 8)
	* **name -** (optional) name you give pipette

To use the tip-tracking features, create your pipette with tip racks and a trash container like the following example:

.. code-block:: python
	
	mypipette = instruments.Pipette(
		axis="b",	
		max_volume=200,
		tip_racks=[tiprack],
		trash_container=trash	
	)

	mypipette.pick_up_tip()     # picks up tip at A1
	mypipette.drop_tip()   		# drops tip in the trash container
	mypipette.pick_up_tip()     # picks up tip at B1
	mypipette.return_tip()      # drops tip back at B1

.. testcode:: main

	

Commands 
-----------------------------

There are a few basic commands that you can string together in order to transfer liquid from place to place.  Each command is linked to the pipette doing the action.


Pick Up and Drop Tip
^^^^^^^^^^^^^^^^^^^^

Before you can start moving liquid around, you need to pick up a tip!  You can pick up any tip in a tip rack.

**pipette.pick_up_tip** (*location*)
	
	* **location -** container[position] the tip's current position

.. testcode:: main

	p200.pick_up_tip(tiprack['A2'])

In addition to picking up a tip, there is a command to drop tip.

**pipette.drop_tip** (*location*)

	* **location -** container[position] the position to drop the tip

.. testcode:: main

	p200.drop_tip(tiprack['A2'])

The behavior or tip commands changes depending on whether you have attached tip racks and/or trash containers to your pipette. 
This happens when a pipette is created through using it's ``tip_racks`` and ``trash`` properties.

.. code-block:: python

	p200 = instruments.Pipette(
	    axis='a',
	    max_volume=200,
	    tip_racks=[tiprack],
	    trash=trash)

With a list of one or more tip racks, a pipette can automatically iterate through it's tips without passing any arguments, and automatically drop tips in the trash.

.. code-block:: python

	p200.pick_up_tip()  	# automatically goes to tiprack['A1']
	p200.drop_tip()		# automatically goes to trash

**pipette.return_tip** ()

With one or more tip racks attached, a pipette can also return a tip to it's original position

.. code-block:: python

	p200.pick_up_tip()  	# automatically goes to tiprack['A1']
	p200.return_tip()	# automatically goes back to tiprack['A1']


Aspirate
^^^^^^^^

**pipette.aspirate** (*volume, location*)

	* **volume -** volume in uL to pick up
	* **location -** container[position] location to pick up liquid from

.. testcode:: main
	
	p200.aspirate(200, plate['A1'])
	p200.dispense()

You can link multiple aspirates together in order to pick up liquid from multiple locations

.. testcode:: main
	
	p200.aspirate(50, plate['A1']).aspirate(100, plate['B1'])

If no volume is passed, the pipette will automatically aspirate to it's ``max_volume``

.. testcode:: main
	
	p200.aspirate(plate['A1'])		# 200ul

In addition, if no location is passed, the pipette will aspirate from it's current position

.. testcode:: main
	
	p200.aspirate()				# 200ul from this position


Dispense
^^^^^^^^

Once you pick up liquid, you need to tell the robot where to dispense it.  

**pipette.dispense** (*volume, location*)
	
	* **volume -** volume in uL to dispense
	* **location -** container[position] location to deposit liquid

.. testcode:: main
	
	p200.dispense(50, plate['A1'])

If you want to deposit all of the liquid you just aspirated, there is no need to specify volume in the dispense command.  It will default to the entire volume in the pipette.

.. testcode:: main

	p200.dispense(plate['B1'])


Mix
^^^

While you can call multiple aspirate and dispense commands to the same location, the mix command makes it easier to do.

**pipette.mix** (*volume, repetitions, location*)

	* **volume -** volume to mix
	* **repetitions -** number of times to mix
	* **location -** container[position] location to mix

.. testcode:: main

	p200.mix(3, 100, plate['A1'])

Call ``mix()`` without a location, and the pipette will mix at the previously referenced well

.. testcode:: main

	p200.dispense(plate['B2']).mix(3, 100)


Chaining Commands
^^^^^^^^^^^^^^^^^

Now that you know the basic commands, you can start transferring liquids!  However, your code can get lengthy quickly if you write it like this.

.. testcode:: main

	p200.pick_up_tip()
	p200.aspirate(200, plate['A1'])
	p200.dispense(50, plate['A2'])
	p200.dispense(50, plate['A3'])
	p200.dispense(100, plate[4])
	p200.drop_tip()

Instead of giving each command it's own line, you can chain them together using a period (as long as all commands are being called by the same pipette).

.. testcode:: main

	p200.pick_up_tip().aspirate(200, plate['A1']).dispense(plate['B1'])
 

Touch Tip
^^^^^^^^^

Sometimes you want to touch the tip of the pipette to the sides of the well.  You can link this to one of the commands you just learned.

**touch_tip** ()

.. testcode:: main

	p200.dispense(10, plate['A1']).touch_tip()

Blow Out
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can blow out liquid immediately after a dispense command in the same location, or you can choose to blow out somewhere else (like over your trash container) if you want.

**.blow_out** (*location*)

	* **location -** container[position] location to blow out

.. testcode:: main

	p200.dispense(10, plate['A1']).blow_out()
	p200.dispense(10, plate['A1']).blow_out(trash)

.. note:: 

	Since the trash container is given a "point" labware name, it has no wells inside it. Therefore there is no need to call a position within the container.

Delay
^^^^^

Delay commands can be called between any movement commands, so you have complete control of exactly where you want the robot to pause.

**delay** (*time*)

	* **time -** duration of delay (seconds)

.. testcode:: main

	p200.aspirate(120, plate['A1']).delay(1).dispense(10)
	p200.dispense(plate['B2']).delay(60)
	p200.aspirate(100, plate['B2'])

Position Within a Well
^^^^^^^^^^^^^^^^^^^^^^

Want to deposit at the top of a tube?  Pull liquid from the bottom of the well?  It's easy with a Well's ``top()`` and ``bottom()`` methods.

**container.top** (*distance*)

	* **distance -** (optional) distance above/below top of Well (mm)

**container.bottom** (*distance*)

	* **distance -** (optional) distance above bottom of Well (mm)

.. testcode:: main

	well = plate['A1']
	p200.dispense(well.top())         # at the top of well
	p200.mix(3, 100, well.bottom(5))  # 5mm above bottom of well
	p200.aspirate(well.top(-3))       # 3mm below top of well

Homing
------

You can instruct the robot to home at any point in the protocol, or just home one axis.

**robot.home** (*axes, enqueue*)

	* **axes -** the axes you want to home
	* **enqueue -** True or False

Normally, home commands are run immediately when called, and therefore should not be included in a protocol. However, if you need to home during a protocol run, include the argument ``enqueue=True``.

.. testcode:: main

  robot.home()                     # causes robot to home immediately
  robot.home(enqueue=True)         # adds "home" command to protocol queue     
  robot.home('ab', enqueue=True)   # adds "home ab" command to protocol queue
  robot.home('xyz', enqueue=True)  # adds "home xyz" command to protocol queue

Head Speed
----------

The speed of the robot's X and Y movements can be sped up or slowed down.

**robot.head_speed** (*rate*)

	* **rate -** the speed at which the X and Y axis will move (millimeters per minute)

This method will immediately set the speed of the robot, and all following movements will use that speed.

.. note::
	Speeds too fast (around 6000 and higher) will cause the robot to skip step, be careful when using this method

.. testcode:: main

  robot.head_speed(4500)
  p200.pick_up_tip()

Move To
-------

If you don't want to aspirate, dispense or mix, you can still send your robot to a container using the move_to() command.

**pipette.move_to** (*distance, strategy*)

	* **distance -** distance from calibration position (mm)
	* **strategy -** the type of path you want to use, either 'direct' (straight line) or 'arc' (move up Z, over XY, then down Z)

.. testcode:: main

	p200.move_to(plate[95].top(), 'arc')
	p200.move_to(plate[3].top(10), 'direct')

Be careful using the 'direct' strategy as the robot could crash into anything between your start and end locations.


Debugging Your Protocol
-----------------------------

There are a couple tricks that make it easy to test your protocol, without having to run it on the robot.

Print()
^^^^^^^

First, you can use the print command (a basic python command) to print well locations, or test to see if loops are being called.

.. testcode:: main

	print("hello")
	print(plate['A1'])
	print(plate[i])

.. testoutput:: main

  hello
  <Well A1>
  <Well A1>

This is useful when trying to determine if the location you're calling is actually the location you want, or if something is iterating properly (more on iteration later)

Getting Robot Commands
^^^^^^^^^^^^^^^^^^^^^^

Another useful tool is robot.commands(), which will print out the list of actions the virtual robot just performed.
