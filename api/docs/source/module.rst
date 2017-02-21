.. _module:

================================
Modules
================================

Magnetic Bead
--------------------------------

Setting up Hardware
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Use your included DIY Mag Bead kit to configure the motor control board (see kit instructions).


Initializing Module in API
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Just like a pipette, you need to set up and name your module.

**instruments.Magbead** (*mofset, name*)

	* **mosfet -** integer 0-5 (defaults to 0)
	* **name -** the name you want to call your module

.. testsetup:: main

  from opentrons import instruments
  from opentrons.instruments import Pipette
  p200 = instruments.Pipette(axis="b", max_volume=200)

.. testcode:: main

	mag_deck = instruments.Magbead(name='mag_deck')

Activate and Deactivate Magnets 
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To activate the magnets and raise the module's platform, run ``.engage()``:

**module.engage** ()

.. testcode:: main

	mag_deck.engage()

To deactivate the magnets and lower the module's platform, run ``.disengage()``:

**module.disengage** ()

.. testcode:: main

	mag_deck.disengage()

Chain Other Commands
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Just like ``aspirate()`` and ``dispense()`` can be chained, you can chain ``engage()`` and ``disengage()``, as well as the ``delay()`` if you don't want to do anything between engaging and disengaging the magnets.

.. testcode:: main

	mag_deck.engage()
	mag_deck.delay(60)
	mag_deck.disengage()

	mag_deck.engage().delay(60).disengage()

You can call ``delay()`` with a ``Pipette`` or a ``Magbead`` module.

.. testcode:: main

	p200.delay(10)
	mag_deck.delay(10)
