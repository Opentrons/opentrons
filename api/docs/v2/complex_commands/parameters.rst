:og:description: Parameters for fine-tuning complex liquid handling behavior in the Python API.

.. _complex_params:

**********************************
Complex Liquid Handling Parameters
**********************************

Complex commands accept a number of optional parameters that give you greater control over the exact steps they perform.  

This page describes the accepted values and behavior of each parameter. The parameters are organized in the order that they first add a step. Some parameters, such as ``touch_tip``, add multiple steps. See :ref:`complex-command-order` for more details on the sequence of steps performed by complex commands.

The API reference entry for :py:meth:`~.InstrumentContext.transfer` also lists the parameters and has more information on their implementation as keyword arguments.

Tip Handling
============

The ``new_tip`` parameter controls if and when complex commands pick up new tips from the pipette's tip racks. It has three possible values:

.. list-table::
   :header-rows: 1

   * - Value
     - Behavior
   * - ``"once"``
     - This is the default behavior for all complex commands.
        - Pick up a tip at the start of the command.
        - Use the tip for all liquid handling.
        - Drop the tip at the end of the command.
   * - ``"always"``
     - Pick up and drop a tip for each set of aspirate–dispense steps.
   * - ``"never"``
     - Do not pick up or drop tips at all.
     
``"once"`` and ``"always"`` require that the pipette has an :ref:`associated tip rack <pipette-tip-racks>`, or the API will raise an error (because it doesn't know where to pick up a tip from). If the pipette already has a tip attached, the API will also raise an error when it tries to pick up a tip. 

.. code-block:: python

    pipette.pick_up_tip()
    pipette.transfer(
        volume=100,
        source=plate["A1"],
        dest=[plate["B1"], plate["B2"], plate["B3"]],
        new_tip="never",  # "once", "always", or unset will error
    )

Conversely, ``"never"`` requires that the pipette has picked up a tip, or the API will raise an error (because it will attempt to aspirate without a tip attached).

.. versionadded:: 2.0


Mix Before
==========

Touch Tip
=========

Air Gap
=======

Mix After
=========

Disposal Volume
===============

Blow Out
========

Trash Tips
==========