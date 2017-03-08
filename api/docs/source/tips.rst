.. _tips:

=======
Tips
=======

When we handle liquids with a pipette, we are constantly exchanging old, used tips for new ones to prevent cross-contamination between our wells. To help with this constant need, we describe in this section a few methods for getting new tips, and removing tips from a pipette.

.. toctree::
    :maxdepth: 3

    tips

**********************

.. testsetup:: tips

    from opentrons import containers, instruments, robot

    robot.reset()

    trash = containers.load('point', 'D2')
    tiprack = containers.load('tiprack-200ul', 'B1')

    pipette = instruments.Pipette(axis='a')

Tips
----

This section demonstrates the options available for controlling tips

.. testcode:: tips
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    trash = containers.load('point', 'D2')
    tiprack = containers.load('tiprack-200ul', 'B1')

    pipette = instruments.Pipette(axis='a')

Pick Up Tip
^^^^^^^^^^^

Before any liquid handling can be done, your pipette must have a tip on it. The command ``pick_up_tip()`` will move the pipette over to the specified tip, the press down into it to create a vacuum seal. The below example picks up the tip at location ``'A1'``.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A1'))

Drop Tip
^^^^^^^^

Once finished with a tip, the pipette will autonomously remove the tip when we call ``drop_tip()``. We can specify where to drop the tip by passing in a location. The below example drops the tip back at its originating location on the tip rack.

.. testcode:: tips

    pipette.drop_tip(tiprack.wells('A1'))

Instead of returning a tip to the tip rack, we can also drop it in a trash container.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A2'))
    pipette.drop_tip(trash)

Return Tip
^^^^^^^^^^

When we need to return the tip to its originating location on the tip rack, we can simply call ``return_tip()``. The example below will automatically return the tip to ``'A3'`` on the tip rack.

.. testcode:: tips

    pipette.pick_up_tip(tiprack.wells('A3'))
    pipette.return_tip()

**********************

.. testsetup:: tipsiterating

    from opentrons import containers, instruments, robot

    robot.reset()

    trash = containers.load('point', 'D2')
    tip_rack_1 = containers.load('tiprack-200ul', 'B1')
    tip_rack_2 = containers.load('tiprack-200ul', 'B2')

    pipette = instruments.Pipette(
        axis='b',
        tip_racks=[tip_rack_1, tip_rack_2],
        trash_container=trash
    )

Tips Iterating
--------------

Automatically iterate through tips and drop tip in trash by attaching containers to a pipette

.. testcode:: tipsiterating
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers, instruments

    trash = containers.load('point', 'D2')
    tip_rack_1 = containers.load('tiprack-200ul', 'B1')
    tip_rack_2 = containers.load('tiprack-200ul', 'B2')

Attach Tip Rack to Pipette
^^^^^^^^^^^^^^^^^^^^^^^^^^

Tip racks and trash containers can be "attached" to a pipette when the pipette is created. This give the pipette the ability to automatically iterate through tips, and to automatically send the tip to the trash container.

Trash containers can be attached with the option ``trash_container=TRASH_CONTAINER``.

Multiple tip racks are can be attached with the option ``tip_racks=[RACK_1, RACK_2, etc... ]``.

.. testcode:: tipsiterating

    pipette = instruments.Pipette(
        axis='b',
        tip_racks=[tip_rack_1, tip_rack_2],
        trash_container=trash
    )

.. note::

    The ``tip_racks=`` option expects us to give it a Python list, containing each tip rack we want to attach. If we are only attaching one tip rack, then the list will have a length of one, like the following:

    ``tip_racks=[tiprack]``


Iterating Through Tips
^^^^^^^^^^^^^^^^^^^^^^

Now that we have two tip racks attached to the pipette, we can automatically step through each tip whenever we call ``pick_up_tip()``. We then have the option to either ``return_tip()`` to the tip rack, or we can ``drop_tip()`` to remove the tip in the attached trash container.

.. testcode:: tipsiterating

    pipette.pick_up_tip()  # picks up tip_rack_1:A1
    pipette.return_tip()
    pipette.pick_up_tip()  # picks up tip_rack_1:A2
    pipette.drop_tip()     # automatically drops in trash

    # use loop to pick up tips tip_rack_1:A3 through tip_rack_2:H12
    for i in range(94 + 96):
        pipette.pick_up_tip()
        pipette.return_tip()

If we try to ``pick_up_tip()`` again when all the tips have been used, the Opentrons API will show you an error.

.. note::

    If you run the cell above, and then uncomment and run the cell below, you will get an error because the pipette is out of tips.

.. testcode:: tipsiterating

    # this will raise an exception if run after the previous code block
    # pipette.pick_up_tip()


Select Starting Tip
^^^^^^^^^^^^^^^^^^^

Calls to ``pick_up_tip()`` will by default start at the attached tip rack's ``'A1'`` location. If you however want to start automatic tip iterating at a different tip, you can use ``start_at_tip()``.

.. testcode:: tipsiterating

    pipette.reset()

    pipette.start_at_tip(tip_rack_1['C3'])
    pipette.pick_up_tip()  # pick up C3 from "tip_rack_1"
    pipette.return_tip()

Get Current Tip
^^^^^^^^^^^^^^^

Get the source location of the pipette's current tip by calling ``current_tip()``. If the tip was from the ``'A1'`` position on our tip rack, ``current_tip()`` will return that position.

.. testcode:: tipsiterating

    print(pipette.current_tip())  # is holding no tip

    pipette.pick_up_tip()
    print(pipette.current_tip())  # is holding the next available tip

    pipette.return_tip()
    print(pipette.current_tip())  # is holding no tip

will print out...

.. testoutput:: tipsiterating

    None
    <Well D3>
    None
