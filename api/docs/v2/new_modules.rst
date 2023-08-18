:og:description: How to load and work with Opentrons hardware modules in a Python protocol.

.. _new_modules:

****************
Hardware Modules
****************

.. toctree::
    modules/setup
    modules/heater_shaker
    modules/magnetic_block
    modules/magnetic_module
    modules/temperature_module
    modules/thermocycler
    modules/multiple_same_type

Hardware modules are powered and unpowered deck-mounted peripherals. The Flex and OT-2 are aware of deck-mounted powered modules when they're attached via a USB connection and used in an uploaded protocol. The robots do not know about unpowered modules until you use one in a protocol and upload it to the Opentrons App.

Powered modules include the Heater-Shaker Module, Magnetic Module, Temperature Module, and Thermocycler Module. The 96-well Magnetic Block is an unpowered module.

Pages in this section of the documentation cover:

    - :ref:`Setting up modules and their labware <module-setup>`. 
    - Working with the module contexts for each type of module.
    
        - :ref:`Heater-Shaker Module <heater-shaker-module>`
        - :ref:`Magnetic Block <magnetic-block>`
        - :ref:`Magnetic Module <magnetic-module>`
        - :ref:`Temperature Module <temperature-module>`
        - :ref:`Thermocycler Module <thermocycler-module>`
    - Working with :ref:`multiple modules of the same type <moam>` in a single protocol. 

.. note::

    Throughout these pages, most code examples use coordinate deck slot locations (e.g. ``'D1'``, ``'D2'``), like those found on Flex. If you have an OT-2 and are using API version 2.14 or earlier, replace the coordinate with its numeric OT-2 equivalent. For example, slot D1 on Flex corresponds to slot 1 on an OT-2. See :ref:`deck-slots` for more information.

