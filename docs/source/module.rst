.. _module:

================================
Module
================================

Magnetic Bead
--------------------------------



Setting up Hardware
--------------------------------

any hardware changes the user has to make

Writing a Protocol
--------------------------------

Initializing Module
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Just like a pipette, you need to set up and name your module.

**instruments.Magbead** (*mofset, name*)

	* **mofset -** default to =0
	* **name -** the name you want to call your module

.. testsetup:: main

  from opentrons import instruments
  from opentrons.instruments import Pipette
  p200 = instruments.Pipette(axis="b", max_volume=200)

.. testcode:: main

	mag_deck = instruments.Magbead(
		mosfet=0, 
		name='mag_deck'
	)

Activate and Deactivate Magnets 
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To activate the magnets, use the following command

**module.engage** ()

.. testcode:: main

	mag_deck.engage()

To deactive the magnets, use the following command

**module.disengage** ()

.. testcode:: main

	mag_deck.disengage()

Chain Other Commands
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Just like aspirate() and dispense() can be chained, you can chain engage() and disengage(), as well as the delay() if you don't want to do anything between engaging and disengaging the magnets.

.. testcode:: main

	mag_deck.engage()
	mag_deck.delay(60)
	mag_deck.disengage()

	mag_deck.engage().delay(60).disengage()

You can call delay() with a pipette or a mag_deck module.

.. testcode:: main

	p200.delay(10)
	mag_deck.delay(10)


