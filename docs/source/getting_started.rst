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
      max_volume=2000,
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

For each container you want to use on the deck, you need to load it into your file by telling the robot what it is, where it is, and what to label it. The label you give the container is what will appear in the app when you start calibrating.

.. code-block:: python

	mycontainer = containers.load(
		'container type', 	
		'slot position'		 
		'given name'		   
	)

**containers.load** (*container, slot, name*)

	* **container -** type of container (trough-12-row, etc)
	* **slot -** the slot location on the deck (A1-E3)
	* **name -** custom name

The example below declares 3 different containers and assigns them to the appropriate slots on the deck.

.. testcode:: main
	
	tiprack = containers.load(
  		'tiprack-200ul',  
   		'A1',             
		'tiprack'         
	)

	plate = containers.load(
		'96-PCR-flat',
		'B2',
		'plate'
	)

	trash = containers.load(
		'point',
		'C3',
		'trash'
	)


The robot will save calibration data from old runs based on the container type, slot position and given name.  Thus, if you always give something the same arguments, it will populate the app with old calibration data.  If you do not want it to do this, simply change the given name to unique names.


Pipettes
^^^^^^^^

.. code-block:: python
	
	mypipette = instruments.Pipette(
		name="mypipette",
		axis="b",	
		max_volume=200,
		min_volume=20,		
		trash_container=trash,		
		tip_racks=[tiprack],									
		channels=1					
	)

**instruments.Pipette** (*name, trash_container, tip_racks, min_volume, max_volume, axis, channels*)

	* **name -** name you give pipette
	* **axis -** axis the pipette is on (a or b)
	* **max_volume -** maximum volume of pipette
	* **min_volume -** minimum volume of pipette
	* **trash_container -** given name of container where you want to deposit tips
	* **tip_racks -** array (list) of container(s) where you want to pick up tips
	* **channels -** number of channels (1 or 8)

This example loads a single channel, 20-200 uL pipette on the b axis that pulls tips from tiprack and deposits them in trash

.. testcode:: main

	pipette = instruments.Pipette(
		name="p200",
		trash_container=trash,
		tip_racks=[tiprack],
		min_volume=20,
		max_volume=200,
		axis="b",
		channels=1
	)

Commands 
-----------------------------

There are a few basic commands that you can string together in order to transfer liquid from place to place.  Each command is linked to the pipette doing the action.


Pick Up and Drop Tip
^^^^^^^^^^^^^^^^^^^^

Before you can start moving liquid around, you need to pick up a tip!  You can pick up any tip in a tip rack.

**pipette.pick_up_tip** (*location*)
	
	* **location -** container[position] location to pick up tip

.. testcode:: main

	p200.pick_up_tip(tiprack['A2'])

However, if you just want to go through the tips in a tip rack in order, there is no need to call a location. The example below will pick up the first available tip, and the API will keep track of which tips have been used so far in the protocol.

.. testcode:: main
	
	p200.pick_up_tip()

In addition to picking up a tip, there is a command to drop tip.

**pipette.drop_tip** (*location*)

	* **location -** container[position] location to drop tip

.. testcode:: main

	p200.drop_tip(tiprack['A2'])

While you can only pick up tips from tip racks, you can eject tips back into the tiprack, or send them to the trash.  While you can specify trash as a location, you can also use the default version of drop tip like the example below.

.. testcode:: main

	p200.drop_tip()


Aspirate
^^^^^^^^

**pipette.aspirate** (*volume, location*)

	* **volume -** volume in uL to pick up
	* **location -** container[position] location to pick up liquid from

.. testcode:: main
	
	p200.aspirate(200, plate['A1'])

You can link multiple aspirates together in order to pick up liquid from multiple locations

.. testcode:: main
	
	p200.aspirate(50, plate['A1']).aspirate(100, plate['B1'])


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

	p200.aspirate(200, plate['A1'])
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


Chaining Commands
^^^^^^^^^^^^^^^^^

Now that you know the basic commands, you can start transferring liquids!  However, your code can get lengthy quickly is you write it like this.

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


Command Attributes
-----------------------------

In addition to commands, you can attach attributes to your movements.  

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

	If the trash container is given a "point" labware name, instead of another container (like "trough-12row"), there is no need to call a position within the container.

Delay
^^^^^

Delay commands can be called between any movement commands, so you have complete control of exactly where you want the robot to pause.

**delay** (*time*)

	* **time -** duration of delay (seconds)

.. testcode:: main

	p200.delay(10).aspirate(100, plate['A1'])

Dispensing Positions
^^^^^^^^^^^^^^^^^^^^

Want to deposit at the top of a tube?  Pull liquid from the bottom of the well?  Mix from the middle?  Easy.

**container.top** (*distance*)

**container.bottom** (*distance*)

	* **distance -** distance from calibration position (mm)

Containers are calibrated to the bottom of the well, and each labware definition has an inherent depth, which provides the calculated top position.  You can specify each of these locations anytime you use a container[position], as well as adjust them up (+) or down (-) by adding a distance.

.. testcode:: main

	p200.dispense(plate['A1'].top())
	p200.mix(3, 100, plate['B2'].bottom(5))
	p200.dispense(plate['A1'].top(-3))

Homing
------

You can instruct the robot to home at any point in the protocol, or just home one axis.

**robot.home** (*axes, enqueue*)

	* **axes -** the axes you want to home
	* **enqueue -** True or False

When the python file is loaded into the protocol, it runs through all of the commands.  When enqueue=False, this will cause the robot to home immediately upon loading the protocol, whereas if enqueue=True, it will run when it is called in the protocol.

.. testcode:: main

  robot.home(enqueue=True)          
  robot.home('ab', enqueue=True)
  robot.home('xyz', enqueue=True)

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
