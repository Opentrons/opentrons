.. _pipettes:

The ``instruments`` module gives your protocol access to the ``Pipette``, which is what you will be primarily using to create protocol commands.

************************

******************
Creating a Pipette
******************

.. testcode:: pipettes

    '''
    Examples in this section require the following:
    '''
    from opentrons import instruments, robot


Pipette Model(s)
===================
Currently in our API there are 7 pipette models to correspond with the offered pipette models on our website.

They are as follows:
``P10_Single`` (1 - 10 ul)
``P10_Multi`` (1 - 10ul)
``P50_Single`` (5 - 50ul)
``P50_Multi`` (5 - 50ul)
``P300_Single`` (30 - 300ul)
``P300_Mutli`` (30 - 300ul)
``P1000_Single`` (100 - 1000ul)

For every pipette type you are using in a protocol, you must use one of the
model names specified above and call it out as ``instruments``.(Model Name)

Mount
===================

To create a ``Pipette``, you must give it a mount. The mount can be either ``'left'`` or ``'right'``.
In this example, we are using a Single-Channel 300uL pipette.

.. testcode:: pipettes

    pipette = instruments.P300_Single(mount='left')


Plunger Flow Rates
==================

The speeds at which the pipette will aspirate and dispense can be set through ``aspirate_speed`` and ``dispense_speed``.
The values are in microliters/seconds, and have varying defaults depending on the model.

default to ``aspirate_flow_rate=300`` and ``dispense_flow_rate=500``.

.. testcode:: pipettes

    pipette = instruments.P300_Single(
        mount='right',
        aspirate_flow_rate=200,
        dispense_flow_rate=600)

.. testcleanup:: pipettes

    robot.reset()