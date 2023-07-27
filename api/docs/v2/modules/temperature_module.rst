.. _temperature-module:

******************
Temperature Module
******************

The Temperature Module acts as both a cooling and heating device. It can control the temperature of its deck between 4 °C and 95 °C with a resolution of 1 °C.

The Temperature Module is represented in code by a :py:class:`.TemperatureModuleContext` object, which has methods for setting target temperatures and reading the module's status. This example demonstrates loading a Temperature Module GEN2 and loading a well plate on top of it.

.. code-block:: python
    :substitutions:

    def run(protocol: protocol_api.ProtocolContext):
        temp_mod = protocol.load_module(
          module_name='temperature module gen2',
          location='D3')
        plate = temp_mod.load_labware(
          name='corning_96_wellplate_360ul_flat')

.. versionadded:: 2.3

Temperature Control
===================

The primary function of the module is to control the temperature of its deck, using :py:meth:`~.TemperatureModuleContext.set_temperature`, which takes one parameter: ``celsius``. For example, to set the Temperature Module to 4 °C:

.. code-block:: python

    temp_mod.set_temperature(celsius=4)

When using ``set_temperature()``, your protocol will wait until the target temperature is reached before proceeding to further commands. In other words, you can pipette to or from the Temperature Module when it is holding at a temperature or idle, but not while it is actively changing temperature. Whenever the module reaches its target temperature, it will hold the temperature until you set a different target or call :py:meth:`~.TemperatureModuleContext.deactivate`, which will stop heating or cooling and will turn off the fan.

.. note::

    Your robot will not automatically deactivate the Temperature Module at the end of a protocol. If you need to deactivate the module after a protocol is completed or canceled, use the Temperature Module controls on the device detail page in the Opentrons App or run ``deactivate()`` in Jupyter notebook.

.. versionadded:: 2.0

Temperature Status
==================

If you need to confirm in software whether the Temperature Module is holding at a temperature or is idle, use the :py:obj:`~.TemperatureModuleContext.status` property:

.. code-block:: python

    temp_mod.set_temperature(celsius=90)
    temp_mod.status  # 'holding at target'
    temp_mod.deactivate()
    temp_mod.status  # 'idle'
    
If you don't need to use the status value in your code, and you have physical access to the module, you can read its status and temperature from the LED and display on the module.
    
.. versionadded:: 2.0

Changes with the GEN2 Temperature Module
========================================

All methods of :py:class:`.TemperatureModuleContext` work with both the GEN1 and GEN2 Temperature Module. Physically, the GEN2 module has a plastic insulating rim around the plate, and plastic insulating shrouds designed to fit over Opentrons aluminum blocks. This mitigates an issue where the GEN1 module would have trouble cooling to very low temperatures, especially if it shared the deck with a running Thermocycler.
