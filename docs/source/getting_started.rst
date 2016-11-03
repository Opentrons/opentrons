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

Containers
-----------------------------

Pipettes
-----------------------------





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




