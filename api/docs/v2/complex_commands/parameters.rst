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
     - Pick up and drop a tip for each set of aspirate and dispense steps.
   * - ``"never"``
     - Do not pick up or drop tips at all.

.. versionadded:: 2.0
     
Tip Handling Requirements
-------------------------
     
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

Avoiding Cross-Contamination
----------------------------

One reason to set ``new_tip="always"`` is to avoid cross-contamination between wells. However, you should always do a dry run of your protocol to test that the pipette is picking up and dropping tips in the way that your application requires.

:py:meth:`~.InstrumentContext.transfer` will pick up a new tip before *every* aspirate when ``new_tip="always"``. This includes when :ref:`complex-tip-refilling` requires multiple aspirations from a single source well.

:py:meth:`~.InstrumentContext.distribute` and :py:meth:`~.InstrumentContext.consolidate` only pick up one tip, even when ``new_tip="always"``. For example, this distribute command returns to the source well a second time, because the amount to be distributed (400 µL total plus disposal volume) exceeds the pipette capacity (300 μL)::

    pipette.distribute(
        volume=200,
        source=plate["A1"],
        dest=[plate["B1"], plate["B2"]],
        new_tip="always",
    )
    
But it *does not* pick up a new tip after dispensing into B1:

.. code-block:: text

    Picking up tip from A1 of tip rack on 3
    Aspirating 220.0 uL from A1 of well plate on 2 at 92.86 uL/sec
    Dispensing 200.0 uL into B1 of well plate on 2 at 92.86 uL/sec
    Blowing out at A1 of Opentrons Fixed Trash on 12
    Aspirating 220.0 uL from A1 of well plate on 2 at 92.86 uL/sec
    Dispensing 200.0 uL into B2 of well plate on 2 at 92.86 uL/sec
    Blowing out at A1 of Opentrons Fixed Trash on 12
    Dropping tip into A1 of Opentrons Fixed Trash on 12

If this poses a contamination risk, you can work around it in a few ways:

    * Use ``transfer()`` with ``new_tip="always"`` instead.
    * Set :py:obj:`.well_bottom_clearance` before your complex command.
    * Use :ref:`v2-atomic-commands` instead of complex commands.



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