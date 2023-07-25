:og:description: How to load and work with Opentrons hardware modules in a Python protocol.

.. _new_modules:

################
Hardware Modules
################

.. toctree::
    modules/heater_shaker
    modules/magnetic_block
    modules/magnetic_module
    modules/temperature_module
    modules/thermocycler

Hardware modules are powered and unpowered deck-mounted peripherals. The Flex and OT-2 are aware of deck-mounted powered modules when they're attached via a USB connection and used in an uploaded protocol. The robots do not know about unpowered modules until you use one in a protocol and upload it to the Opentrons App.

Powered modules include the :ref:`Temperature Module <temperature-module>`, :ref:`Magnetic Module <magnetic-module>`, :ref:`Thermocycler Module <thermocycler-module>`, and :ref:`Heater-Shaker Module <heater-shaker-module>`. The 96-well :ref:`Magnetic Block <magnetic-block>` is an unpowered module.

.. Note::
    
    Most of the following code examples use coordinate deck slot locations (e.g. ``'D1'``, ``'D2'``), like those found on Flex. If you have an OT-2 and are using API version 2.14 or earlier, replace the coordinate with its numeric OT-2 equivalent. For example, slot D1 on Flex corresponds to slot 1 on an OT-2. See :ref:`deck-slots` for more information.

************
Module Setup
************

Loading Modules onto the Deck
=============================

Similar to labware and pipettes, you must inform the API about the modules you want to use in your protocol. Even if you don't use the module anywhere else in your protocol, the Opentrons App and the robot won't let you start the protocol run until all loaded modules that use power are connected via USB and turned on.

Use :py:meth:`.ProtocolContext.load_module` to load a module. 

.. tabs::
    
    .. tab:: Flex

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

            def run(protocol: protocol_api.ProtocolContext): 
                # Load a Heater-Shaker Module GEN1 in deck slot D1.
                heater_shaker = protocol.load_module('heaterShakerModuleV1', "D1")
         
                # Load a Temperature Module GEN2 in deck slot D3.
                temperature_module = protocol.load_module('temperature module', "D3")

        After the ``load_module`` method loads labware into your protocol, it returns the :py:class:`~opentrons.protocol_api.HeaterShakerContext` and :py:class:`~opentrons.protocol_api.TemperatureModuleContext` objects.
        
    .. tab:: OT-2
        
        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api
            
            metadata = {'apiLevel': "2.13"}
            
            def run(protocol: protocol_api.ProtocolContext): 
                # Load a Magnetic Module GEN2 in deck slot 1.
                magnetic_module = protocol.load_module('magnetic module gen2', 1)
         
                # Load a Temperature Module GEN1 in deck slot 3.
                temperature_module = protocol.load_module('temperature module', 3)

        After the ``load_module`` method loads labware into your protocol, it returns the :py:class:`~opentrons.protocol_api.MagneticModuleContext` and :py:class:`~opentrons.protocol_api.TemperatureModuleContext` objects.


.. versionadded:: 2.0

.. _available_modules:

Available Modules
-----------------

The first parameter of :py:meth:`.ProtocolContext.load_module` is the module's  *API load name*. The load name tells your robot which module you're going to use in a protocol. The table below lists the API load names for the currently available modules.

.. table::
   :widths: 4 5 2
   
   +--------------------+-------------------------------+---------------------------+
   | Module             | Load Name                     | Introduced in API Version |
   +====================+===============================+===========================+
   | Temperature Module | ``temperature module``        | 2.0                       |
   | GEN1               | or ``tempdeck``               |                           |
   +--------------------+-------------------------------+---------------------------+
   | Temperature Module | ``temperature module gen2``   | 2.3                       |
   | GEN2               |                               |                           |
   +--------------------+-------------------------------+---------------------------+
   | Magnetic Module    | ``magnetic module``           | 2.0                       |
   | GEN1               | or ``magdeck``                |                           |
   +--------------------+-------------------------------+---------------------------+
   | Magnetic Module    | ``magnetic module gen2``      | 2.3                       |
   | GEN2               |                               |                           |
   +--------------------+-------------------------------+---------------------------+
   | Thermocycler       | ``thermocycler module``       | 2.0                       |
   | Module GEN1        | or ``thermocycler``           |                           |
   +--------------------+-------------------------------+---------------------------+
   | Thermocycler       | ``thermocycler module gen2``  | 2.13                      |
   | Module GEN2        | or ``thermocyclerModuleV2``   |                           |
   +--------------------+-------------------------------+---------------------------+
   | Heater-Shaker      | ``heaterShakerModuleV1``      | 2.13                      |
   | Module             |                               |                           |
   +--------------------+-------------------------------+---------------------------+
   | Magnetic Block     | ``magneticBlockV1``           | 2.15                      |
   | GEN1               |                               |                           |
   +--------------------+-------------------------------+---------------------------+

Some modules were added to our Python API later than others, and others span multiple hardware generations. When writing a protocol that requires a module, make sure your ``requirements`` or ``metadata`` code block specifies a :ref:`Protocol API version <v2-versioning>` high enough to support all the module generations you want to use.

Loading Labware onto a Module
=============================

You'll use the :py:meth:`.ProtocolContext.load_labware` method when loading labware on a module. For example, this code shows how to load the `Opentrons 24 Well Aluminum Block <https://labware.opentrons.com/opentrons_24_aluminumblock_generic_2ml_screwcap?category=aluminumBlock>`_ on top of a Temperature Module::

    def run(protocol: protocol_api.ProtocolContext):
        temp_mod = protocol.load_module(
          module_name:"temperature module gen2",
          location:"D1")
        temp_labware = temp_mod.load_labware(
            load_name:"opentrons_24_aluminumblock_generic_2ml_screwcap",
            label:"Temperature-Controlled Tubes")

.. versionadded:: 2.0

When you load labware on a module, you don’t need to specify the deck slot. In the above example, the ``load_module()`` method already specifies where the module is on the deck: ``location= "D1"``.

Any :ref:`v2-custom-labware` added to your Opentrons App is also accessible when loading labware onto a module. You can find and copy its load name by going to its card on the Labware page.

.. versionadded:: 2.1

.. Should the section below be a warning? 

Module and Labware Compatibility
--------------------------------

It's your responsibility to ensure the labware and module combinations you load together work together. The Protocol API won't raise a warning or error if you load an unusual combination, like placing a tube rack on a Thermocycler. See `What labware can I use with my modules? <https://support.opentrons.com/s/article/What-labware-can-I-use-with-my-modules>`_ for more information about labware/module combinations.


Additional Labware Parameters
-----------------------------

In addition to the mandatory ``load_name`` argument, you can also specify additional parameters. If you specify a ``label``, this name will appear in the Opentrons App and the run log instead of the load name. For labware that has multiple definitions, you can specify ``version`` and ``namespace`` (though most of the time you won't have to). The :py:meth:`~.ProtocolContext.load_labware` methods of all powered modules accept these additional parameters.


***************************************
Using Multiple Modules of the Same Type
***************************************

You can use multiple modules of the same type within a single protocol. The exception is the Thermocycler Module, which has only one :ref:`supported deck location <thermocycler-location>` because of its size. Running protocols with multiple modules of the same type requires version 4.3 or newer of the Opentrons App and robot server. 

When working with multiple modules of the same type, load them in your protocol according to their USB port number. Deck coordinates are required by the :py:meth:`~.ProtocolContext.load_labware` method, but location does not determine which module loads first. Your robot will use the module with the lowest USB port number *before* using a module of the same type that's connected to higher numbered USB port. The USB port number (not deck location) determines module load sequence, starting with the lowest port number first.

.. Recommend being formal-ish with protocol code samples.

.. tabs::
  
  .. tab:: Flex

    In this example, ``temperature_module_1`` loads first because it's connected to USB port 2. ``temperature_module_2`` loads next because it's connected to USB port 6.

    .. code-block:: python
      :substitutions:
      
      from opentrons import protocol_api
      
      requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

      def run(protocol: protocol_api.ProtocolContext):
        # Load Temperature Module 1 in deck slot D1 on USB port 2
        temperature_module_1 = protocol.load_module(
          module_name='temperature module gen2',
          location="D1")

        # Load Temperature Module 2 in deck slot C1 on USB port 6
        temperature_module_2 = protocol.load_module(
          module_name='temperature module gen2',
          location="C1")
        
    Assuming there are no other modules used in this protocol, the Temperature Modules are connected as shown here:

    .. image:: ../img/modules/flex-usb-order.png
       :width: 400

  .. tab:: OT-2

    In this example, ``temperature_module_1`` loads first because it's connected to USB port 1. ``temperature_module_2`` loads next because it's connected to USB port 3.

    .. code-block:: python

      from opentrons import protocol_api

      metadata = { 'apiLevel': '2.14'}

      def run(protocol: protocol_api.ProtocolContext):
        # Load Temperature Module 1 in deck slot C1 on USB port 1
        temperature_module_1 = protocol.load_module(
          load_name='temperature module gen2',
          location="1")

        # Load Temperature Module 2 in deck slot D3 on USB port 2
        temperature_module_2 = protocol.load_module(
          load_name='temperature module gen2',
          location="3")
        
    Assuming there are no other modules used in this protocol, the Temperature Modules are connected as shown here:
    
    .. image:: ../img/modules/multiples_of_a_module.svg


Before running your protocol, it's a good idea to use the module controls in the Opentrons App to check that commands are being sent where you expect.

See the support article, `Using Modules of the Same Type <https://support.opentrons.com/s/article/Using-modules-of-the-same-type-on-the-OT-2>`_ for more information.
