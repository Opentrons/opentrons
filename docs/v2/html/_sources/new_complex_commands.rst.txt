:og:description: Complex liquid-handling commands for Opentrons robots can handle large groups of wells and repetitive actions.

.. _v2-complex-commands:

****************
Complex Commands
****************

.. toctree::
    complex_commands/sources_destinations
    complex_commands/order_operations
    complex_commands/parameters

Complex liquid handling commands combine multiple :ref:`building block commands <v2-atomic-commands>` into a single method call. These commands make it easier to handle larger groups of wells and repeat actions without having to write your own control flow code. They integrate tip-handling behavior and can pick up, use, and drop multiple tips depending on how you want to handle your liquids. 

There are six complex liquid handling commands, each optimized for a different liquid handling scenario: 

.. list-table::
   
    * - Legacy
      - 
        * :py:meth:`.InstrumentContext.transfer`
        * :py:meth:`.InstrumentContext.distribute`
        * :py:meth:`.InstrumentContext.consolidate`
    * - Liquid Class
      - 
        * :py:meth:`.InstrumentContext.transfer_with_liquid_class`
        * :py:meth:`.InstrumentContext.distribute_with_liquid_class`
        * :py:meth:`.InstrumentContext.consolidate_with_liquid_class`
  
The legacy complex commands can optionally perform other actions, like adding air gaps, knocking droplets off the tip, mixing, and blowing out excess liquid from the tip. In a liquid class command, these and other transfer behaviors are determined by the *liquid class definition* to account for liquid properties like viscosity. For more information, see :ref:`liquid-classes`. 

Pages in this section of the documentation cover:

    - :ref:`complex-source-dest`: Which wells complex commands aspirate from and dispense to.
    - :ref:`complex-command-order`: The order of basic commands that are part of a complex commmand.
    - :ref:`complex_params`: Additional keyword arguments that affect complex command behavior.
    
Code samples throughout these pages assume that you've loaded the pipettes and labware from the :ref:`basic protocol template <protocol-template>`.
