.. _getting_started:

Getting Started
================================

Welcome to the API (Application Program Interface).  These tutorials assume no base knowledge of python. We recommend installing the Jupyter notebook to run Opentrons API before attempting these examples. Please refer to :ref:`setup` for detailed instructions.

Import Opentrons API
================================

Before running any code, you need to install the Opentrons API in your jupyter notebook by running the cell below.  This only needs to be done the first time you use jupyter, so feel free to comment it out after it successfully installs.

.. code-block:: bash
	
	!pip install --upgrade git+git://github.com/OpenTrons/opentrons-api.git@master#egg=opentrons

Now that you've installed Opentrons API on your computer, you have access to a variety of robot container and instrument commands. You need to import them to each project (protocol) in order to access these commands.  Unlike the install, this set of imports needs to be done at the start of each protocol.

.. testcode:: main
	
	from opentrons.robot import Robot
	from opentrons import containers
	from opentrons import instruments
 
Now that you have imported the opentrons modules, you need to declare a new robot object (so you can run your protocol commands on it).

.. code-block:: python
	
	robot = Robot()


Deck Set Up
================================

Now that you have a robot to run commands on, you need to tell it what containers and pipettes to use.

.. note:: 
	
	This section replaces the deck and head sections of JSON files 


Containers
-----------------------------

For each container you want to use on the deck, you need to load it into your file by telling the robot what it is, where it is, and what to label it. The label you give the container is what will appear in the app when you start calibrating.

.. code-block:: python

	mycontainer = containers.load(
		'container type', 	# trough-12row, tiprack-200ul, 96-PCR-flat
		'slot position'		# A1, B1, C1
		'given name'		# mycontainer
	)


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

.. tip:: 
	
	For a complete list of container types, go here [link]
	
	

Pipettes
-----------------------------

.. code-block:: python
	
	mypipette = instruments.Pipette(	
		name="mypipette",			
		trash_container=trash,		
		tip_racks=[tiprack],		
		min_volume=20,				
		axis="b",					
		channels=1					
	)


**instruments.Pipette** (*name, trash_container, tip_racks, min_volume, axis, channels*)

	* **name -** name you give pipette
	* **trash_container -** given name of container where you want to deposit tips
	* **tip_racks -** array (list) of container(s) where you want to pick up tips
	* **min_volume=20 -** minimum volume of pipette
	* **axis -** axis the pipette is on (a or b)
	* **channels -** number of channels (1 or 8)


This example loads a single channel, 20-200 uL pipette on the b axis that pulls tips from tiprack and deposits them in trash

.. testcode:: main

	p200 = instruments.Pipette(
		name="p200",
		trash_container=trash,
		tip_racks=[tiprack],
		min_volume=20,
		axis="b",
		channels=1
	)

Once you load your pipette, you should assign the maximum volume.  

.. testcode:: main
	
	p200.set_max_volume(200)  # maximum volume
	


Commands 
================================

Aspirate
-----------------------------

Dispense
-----------------------------

Mix
-----------------------------

Chaining Commands
-----------------------------




Command Attributes
================================

Touch Tip
-----------------------------

Blow Out
-----------------------------

Delay
-----------------------------

Dispensing Positions
-----------------------------




