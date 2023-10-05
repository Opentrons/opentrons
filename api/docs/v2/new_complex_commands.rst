:og:description: Complex liquid-handling commands for Opentrons robots can handle large groups of wells and repetitive actions.

.. _v2-complex-commands:

****************
Complex Commands
****************

.. toctree::
    complex_commands/sources_destinations
    complex_commands/order_operations
    complex_commands/parameters

Complex liquid handling commands combine multiple :ref:`building block commands <v2-atomic-commands>` into a single method call. These commands make it easier to handle larger groups of wells and repeat actions without having to write your own control flow code. They integrate tip-handling behavior and can pick up, use, and drop multiple tips depending on how you want to handle your liquids. They can optionally perform other actions, like adding air gaps, knocking droplets off the tip, mixing, and blowing out excess liquid from the tip.

There are three complex liquid handling commands, each optimized for a different liquid handling scenario: 

    - :py:meth:`.InstrumentContext.transfer`
    - :py:meth:`.InstrumentContext.distribute`
    - :py:meth:`.InstrumentContext.consolidate`

Pages in this section of the documentation cover:

    - :ref:`complex-source-dest`: Which wells complex commands aspirate from and dispense to.
    - :ref:`complex-command-order`: The order of basic commands that are part of a complex commmand.
    - :ref:`complex_params`: Additional keyword arguments that affect complex command behavior.
    
Code samples throughout these pages assume that you've loaded the pipettes and labware from the :ref:`basic protocol template <protocol-template>`.
