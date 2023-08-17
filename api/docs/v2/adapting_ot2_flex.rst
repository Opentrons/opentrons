:og:description: How to adapt an OT-2 Python protocol to run on Opentrons Flex.

.. _adapting-ot2-protocols:

********************************
Adapting OT-2 Protocols for Flex
********************************

Python protocols designed to run on the OT-2 can't be directly run on Flex without some modifications. This page describes the minimal steps that you need to take to get OT-2 protocols analyzing and running on Flex.

Adapting a protocol for Flex lets you have parity across different Opentrons robots in your lab, or you can extend older protocols to take advantage of new features only available on Flex. Depending on your application, you may need to do additional verification of your adapted protocol.

Examples on this page are in tabs so you can quickly move back and forth to see the differences between OT-2 and Flex code.

Metadata and Requirements
=========================

Flex requires you to specify an ``apiLevel`` of 2.15 or higher. If your OT-2 protocol specified ``apiLevel`` in the ``metadata`` dictionary, it's best to move it to the ``requirements`` dictionary. You can't specify it in both places, or the API will raise an error.

.. note::
    Consult the list of :ref:`version-notes` to see what effect raising the ``apiLevel`` will have. If you increased it by multiple minor versions to get your protocol running on Flex, make sure that your protocol isn't using removed commands or commands whose behavior has changed in a way that may affect your scientific results.

You also need to specify ``'robotType': 'Flex'``. If you omit ``robotType`` in the ``requirements`` dictionary, the API will assume the protocol is designed for the OT-2.

.. TK code tabs here

Pipettes and Tip-rack Load Names
================================

Flex uses different types of pipettes and tip racks than OT-2, which have their own load names in the API. Choose pipettes of the same capacity or larger (or whatever you’ve outfitted your Flex with). See the :ref:`list of pipette API load names <new-pipette-models>` for the valid values of ``instrument_name`` in Flex protocols. And check `Labware Library <https://labware.opentrons.com>`_ or the Opentrons App for the list of Flex tip racks.

This example converts OT-2 code that uses a P300 Single-Channel GEN2 pipette and 300 µL tips to Flex code that uses a Flex 1-Channel 1000 µL pipette and 1000 µL tips.

.. TK code tabs here


Deck Slot Names
===============

It's good practice to update numeric labels for :ref:`deck-slots` (which match the labels on an OT-2) to coordinate ones (which match the labels on Flex). This is an optional step, since the two formats are interchangeable.

.. TK code?


Module Load Names
=================

If your OT-2 protocol uses older generations of the Temperature Module or Thermocycler Module, update the load names you pass to :py:meth:`.load_module` to ones compatible with Flex:

    * ``temperature module gen2``
    * ``thermocycler module gen2`` or ``thermocyclerModuleV2``
    
The Heater-Shaker Module only has one generation, which is compatible with Flex and OT-2.

The Magnetic Module is not compatible with Flex. For protocols that load ``magnetic module``, ``magdeck``, or ``magnetic module gen2``, you will need to make further modifications to use the :ref:`magnetic-block` and Flex Gripper instead. This will require reworking some of your protocol steps, and you should verify that your new protocol design achieves similar results.

.. TK some code from the science team?