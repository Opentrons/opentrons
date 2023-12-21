.. _new-create-pipette:
.. _loading-pipettes:

****************
Loading Pipettes
****************

When writing a protocol, you must inform the Protocol API about the pipettes you will be using on your robot. The :py:meth:`.ProtocolContext.load_instrument` function provides this information and returns an :py:class:`.InstrumentContext` object.

As noted above, you call the :py:meth:`~.ProtocolContext.load_instrument` method to load a pipette. This method also requires the :ref:`pipette's API load name <new-pipette-models>`, its left or right mount position, and (optionally) a list of associated tip racks. Even if you don't use the pipette anywhere else in your protocol, the Opentrons App and the robot won't let you start the protocol run until all pipettes loaded by ``load_instrument()`` are attached properly.

.. _new-pipette-models:

API Load Names
==============

The pipette's API load name (``instrument_name``) is the first parameter of the ``load_instrument()`` method. It tells your robot which attached pipette you're going to use in a protocol. The tables below list the API load names for the currently available Flex and OT-2 pipettes.

.. tabs::

    .. tab:: Flex Pipettes
        
        +-------------------------+---------------+-------------------------+
        | Pipette Model           | Volume (µL)   | API Load Name           |
        +=========================+===============+===+=====================+
        | Flex 1-Channel Pipette  | 1–50          | ``flex_1channel_50``    |
        +                         +---------------+-------------------------+
        |                         | 5–1000        | ``flex_1channel_1000``  |
        +-------------------------+---------------+-------------------------+
        | Flex 8-Channel Pipette  | 1–50          | ``flex_8channel_50``    |
        +                         +---------------+-------------------------+
        |                         | 5–1000        | ``flex_8channel_1000``  |
        +-------------------------+---------------+-------------------------+
        | Flex 96-Channel Pipette | 5–1000        | ``flex_96channel_1000`` |
        +-------------------------+---------------+-------------------------+

    .. tab:: OT-2 Pipettes

        +-----------------------------+--------------------+-----------------------+
        | Pipette Model               | Volume (µL)        | API Load Name         |
        +=============================+====================+=======================+
        | P20 Single-Channel GEN2     | 1-20               | ``p20_single_gen2``   |
        +-----------------------------+                    +-----------------------+
        | P20 Multi-Channel GEN2      |                    | ``p20_multi_gen2``    |
        +-----------------------------+--------------------+-----------------------+
        | P300 Single-Channel GEN2    | 20-300             | ``p300_single_gen2``  |
        +-----------------------------+                    +-----------------------+
        | P300 Multi-Channel GEN2     |                    | ``p300_multi_gen2``   |
        +-----------------------------+--------------------+-----------------------+
        | P1000 Single-Channel GEN2   | 100-1000           | ``p1000_single_gen2`` |
        +-----------------------------+--------------------+-----------------------+

        See the :ref:`OT-2 Pipette Generations <ot2-pipette-generations>` section if you're using GEN1 pipettes on an OT-2. The GEN1 family includes the P10, P50, and P300 single- and multi-channel pipettes, along with the P1000 single-channel model.

Loading Flex 1- and 8-Channel Pipettes
======================================

This code sample loads a Flex 1-Channel Pipette in the left mount and a Flex 8-Channel Pipette in the right mount. Both pipettes are 1000 µL. Each pipette uses its own 1000 µL tip rack.  

.. code-block:: Python
    :substitutions:

    from opentrons import protocol_api
    
    requirements = {'robotType': 'Flex', 'apiLevel':'|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='D1')
        tiprack2 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='C1')       
        left = protocol.load_instrument(
            instrument_name='flex_1channel_1000',
            mount='left',
            tip_racks=[tiprack1])                
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack2]) 

If you're writing a protocol that uses the Flex Gripper, you might think that this would be the place in your protocol to declare that. However, the gripper doesn't require ``load_instrument``! Whether your gripper requires a protocol is determined by the presence of :py:meth:`.ProtocolContext.move_labware` commands. See :ref:`moving-labware` for more details.

Loading a Flex 96-Channel Pipette
=================================

This code sample loads the Flex 96-Channel Pipette. Because of its size, the Flex 96-Channel Pipette requires the left *and* right pipette mounts. You cannot use this pipette with 1- or 8-Channel Pipette in the same protocol or when these instruments are attached to the robot. Load the 96-channel pipette as follows:

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        pipette = protocol.load_instrument(
            instrument_name='flex_96channel_1000'
        )

In protocols specifying API version 2.15, also include ``mount='left'`` as a parameter of ``load_instrument()``.

.. versionadded:: 2.15
.. versionchanged:: 2.16
    The ``mount`` parameter is optional.

Loading OT-2 Pipettes
=====================

This code sample loads a P1000 Single-Channel GEN2 pipette in the left mount and a P300 Single-Channel GEN2 pipette in the right mount. Each pipette uses its own 1000 µL tip rack. 

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.14'}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol.load_labware(
            load_name='opentrons_96_tiprack_1000ul', location=1)
        tiprack2 = protocol.load_labware(
            load_name='opentrons_96_tiprack_1000ul', location=2)
        left = protocol.load_instrument(
            instrument_name='p1000_single_gen2',
            mount='left',
            tip_racks=[tiprack1])
        right = protocol.load_instrument(
            instrument_name='p300_multi_gen2',
            mount='right',
            tip_racks=[tiprack1])

.. versionadded:: 2.0

.. _pipette-tip-racks:

Adding Tip Racks
================

The ``load_instrument()`` method includes the optional argument ``tip_racks``. This parameter accepts a list of tip rack labware objects, which lets you to specify as many tip racks as you want. You can also edit a pipette's tip racks after loading it by setting its :py:obj:`.InstrumentContext.tip_racks` property.

.. note::
    Some methods, like :py:meth:`.configure_nozzle_layout`, reset a pipette's tip racks. See :ref:`partial-tip-pickup` for more information.

The advantage of using ``tip_racks`` is twofold. First, associating tip racks with your pipette allows for automatic tip tracking throughout your protocol. Second, it removes the need to specify tip locations in the :py:meth:`.InstrumentContext.pick_up_tip` method. For example, let's start by loading loading some labware and instruments like this::
        
    def run(protocol: protocol_api.ProtocolContext):
        tiprack_left = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_200ul', location='D1')
        tiprack_right = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_200ul', location='D2')
        left_pipette = protocol.load_instrument(
            instrument_name='flex_8channel_1000', mount='left')
        right_pipette = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack_right])

Let's pick up a tip with the left pipette. We need to specify the location as an argument of ``pick_up_tip()``, since we loaded the left pipette without a ``tip_racks`` argument.

.. code-block:: python

    left_pipette.pick_up_tip(tiprack_left['A1'])
    left_pipette.drop_tip()

But now you have to specify ``tiprack_left`` every time you call ``pick_up_tip``, which means you're doing all your own tip tracking::

    left_pipette.pick_up_tip(tiprack_left['A2'])
    left_pipette.drop_tip()
    left_pipette.pick_up_tip(tiprack_left['A3'])
    left_pipette.drop_tip()

However, because you specified a tip rack location for the right pipette, the robot will automatically pick up from location ``A1`` of its associated tiprack::
    
    right_pipette.pick_up_tip()
    right_pipette.drop_tip()

Additional calls to ``pick_up_tip`` will automatically progress through the tips in the right rack::

    right_pipette.pick_up_tip()  # picks up from A2
    right_pipette.drop_tip()
    right_pipette.pick_up_tip()  # picks up from A3
    right_pipette.drop_tip()
       
.. versionadded:: 2.0

See also :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`.
