:og:description: The Opentrons Python Protocol API is a Python framework that makes it easy to write automated biology lab protocols that use Opentrons robots and hardware modules.

=======
Welcome
=======

.. toctree::

    self
    tutorial
    versioning
    new_labware
    new_modules
    deck_slots
    new_pipette
    new_atomic_commands
    new_complex_commands
    robot_position
    new_advanced_running
    new_examples
    new_protocol_api

The OT-2 Python Protocol API is a Python framework designed to make it easy to write automated biology lab protocols that use the OT-2 robot and optional hardware modules. We’ve designed the API to be accessible to anyone with basic Python and wet-lab skills. 

As a bench scientist, you should be able to code your protocols in a way that reads like a lab notebook. You can :ref:`write a fully functional protocol <writing>` just by listing the equipment you'll use (modules, labware, and pipettes) and the exact sequence of movements the robot should make.

As a programmer, you can leverage the full power of Python for advanced automation in your protocols. Perform calculations, manage external data, use built-in and imported Python modules, and more to implement your custom lab workflow.


Getting Started
---------------

**New to Python protocols?** Check out the :ref:`tutorial` to learn about the different parts of a protocol file and build a working protocol from scratch. 

If you want to **dive right into code**, take a look at our :ref:`new-examples` page and the comprehensive :ref:`protocol-api-reference`.

When you're ready to **try out a protocol**, you can :ref:`simulate it on your computer <simulate-block>` — regardless of whether you're connected to an OT-2 robot. To run your protocol on a robot, download and use our latest `desktop app <https://www.opentrons.com/ot-app>`_.


.. _overview-section-v2:

How the API Works
-----------------

The design goal of this API is to make code readable and easy to understand. A protocol, in its most basic form:

1. Provides some information about who made the protocol and what it is for.
2. Tells the robot where to find labware, pipettes, and (optionally) hardware modules.
3. Commands the robot to manipulate its attached hardware.

For example, if we wanted to have the OT-2 transfer liquid from well A1 to well B1 on a plate, our protocol would look like:
	
.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    # metadata
    metadata = {
        'protocolName': 'My Protocol',
        'author': 'Name <opentrons@example.com>',
        'description': 'Simple protocol to get started using the OT-2',
        'apiLevel': '|apiLevel|'
    }

    # protocol run function
    def run(protocol: protocol_api.ProtocolContext):

        # labware
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', location='1')
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', location='2')

        # pipettes
        left_pipette = protocol.load_instrument(
             'p300_single', mount='left', tip_racks=[tiprack])

        # commands
        left_pipette.pick_up_tip()
        left_pipette.aspirate(100, plate['A1'])
        left_pipette.dispense(100, plate['B2'])
        left_pipette.drop_tip()

This example proceeds completely linearly. Following it line-by-line, you can see that it has the following effects:

1. Gives the name, contact information, and a brief description for the protocol. Also indicates the minimum version of the API that the protocol can run on.
2. Tells the robot that there is:
	a. A 96-well flat plate in slot 1.
	b. A rack of 300 µL tips in slot 2.
	c. A single-channel 300 µL pipette attached to the left mount, which should pick up tips from the aforementioned rack.
3. Tells the robot to act by:
	a. Picking up the first tip from the tip rack.
	b. Aspirating 100 µL of liquid from well A1 of the plate.
	c. Dispensing 100 µL of liquid into well B1 of the plate.
	d. Dropping the tip in the trash.
	
There is much more that the OT-2 robot and the API can do! The :ref:`v2-atomic-commands`, :ref:`v2-complex-commands`, and :ref:`new_modules` pages cover many of these functions.


More Resources
--------------

Opentrons App
+++++++++++++

The `Opentrons App <https://opentrons.com/ot-app/>`_ is the easiest way to run your Python protocols. The app `supports <https://support.opentrons.com/en/articles/2687536-get-started-supported-operating-systems-for-the-opentrons-app>`_ the latest versions of macOS, Windows, and Ubuntu.

Support
+++++++

Questions about `setting up your OT-2 <https://support.opentrons.com/s/ot2-get-started>`_, `using Opentrons software <https://support.opentrons.com/s/ot2-software>`_, or `troubleshooting <https://support.opentrons.com/s/ot2-troubleshooting>`_? Check out our `support articles <https://support.opentrons.com/s/>`_ or `get in touch directly <https://support.opentrons.com/s/article/Getting-help-from-Opentrons-Support>`_ with Opentrons Support.

Custom Protocol Service
+++++++++++++++++++++++

Don't have the time or resources to write your own protocols? The `Opentrons Custom Protocols <https://shop.opentrons.com/opentrons-custom-protocol-1-expedite-workflow/>`_ service can get you set up in as little as a week. 

Contributing
++++++++++++

Opentrons software, including the Python API and this documentation, is open source. If you have an improvement or an interesting idea, you can create an issue on GitHub by following our `guidelines`__.

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#opening-issues


That guide also includes more information on how to `directly contribute code`__.

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md

