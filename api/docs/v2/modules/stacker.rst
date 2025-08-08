:og:description: How to use the Flex Stacker Module in a Python protocol. 

.. _stacker:

*******************
Flex Stacker Module
*******************

The Flex Stacker is an external module that provides automated labware storage. Each Flex supports up to four attached Stackers containing well plates, Flex tip racks, or reservoirs. The Stacker's shuttle moves labware from the stack to the deck for use during a protocol. 

The Stacker is represented in code by a ``StackerContext`` object that includes methods for storing and retrieving labware. You can also use helper commands in your protocol to calculate how many labware the Stacker can store. 

