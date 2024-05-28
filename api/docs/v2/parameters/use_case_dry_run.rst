:og:description: How to set up and use a dry run parameter in an Opentrons Python protocol.

.. _use-case-dry-run:

****************************
Parameter Use Case – Dry Run
****************************

When testing out a new protocol, it's common to perform a dry run to watch your robot go through all the steps without actually handling samples or reagents. This use case explores how to add a single Boolean parameter for whether you're performing a dry run.

The code examples will show how this single value can control:

- Skipping module actions and long delays.
- Reducing mix repetitions to save time.
- Returning tips (that never touched any liquid) to their racks.

To keep things as simple as possible, this use case only focuses on setting up and using the value of the dry run parameter, which could be just one of many parameters in a complete protocol.

Dry Run Definition
==================

First, we need to set up the dry run parameter. We want to set up a simple yes/no choice for the technician running the protocol, so we'll use a Boolean parameter::

    def add_parameters(parameters):

        parameters.add_bool(
            variable_name="dry_run",
            display_name="Dry Run",
            description=(
                "Skip delays,"
                " shorten mix steps,"
                " and return tips to their racks."
            ),
            default=False
        )

This parameter is set to ``False`` by default, assuming that most runs will be live runs. In other words, during run setup the technician will have to change the parameter setting to perform a dry run. If they leave it as is, the robot will perform a live run.

Additionally, since "dry run" can have different meanings in different contexts, it's important to include a ``description`` that indicates exactly what the parameter will control — in this case, three things. The following sections will show how to accomplish each of those when the dry run parameter is set to ``True``.

Skipping Delays
===============

Many protocols have built-in delays, either for a module to work or to let a reaction happen passively. Lengthy delays just get in the way when verifying a protocol with a dry run. So wherever the protocol calls for a delay, we can check the value of ``protocol.params.dry_run`` and make the protocol behave accordingly.

To start, let's consider a simple :py:meth:`.delay` command. We can wrap it in an ``if`` statement such that the delay will only execute when the run is *not* a dry run::

    if protocol.params.dry_run is False:
        protocol.delay(minutes=5)

You can extend this approach to more complex situations, like module interactions. For example, in a protocol that moves a plate to the Thermocycler for an incubation, you'll want to perform all the movement steps — opening and closing the module lid, and moving the plate to and from the block — but skip the heating and cooling time. The simplest way to do this is, like in the delay example above, to wrap each skippable command::

    protocol.move_labware(labware=plate, new_location=tc_mod, use_gripper=True)
    if protocol.params.dry_run is False:
        tc_mod.set_block_temperature(4)
        tc_mod.set_lid_temperature(100)
    tc_mod.close_lid()
    pcr_profile = [
        {"temperature": 68, "hold_time_seconds": 180},
        {"temperature": 98, "hold_time_seconds": 180},
    ]
    if protocol.params.dry_run is False:
        tc_mod.execute_profile(
            steps=pcr_profile, repetitions=1, block_max_volume=50
        )
    tc_mod.open_lid()

Shortening Mix Steps
====================

Similar to delays, mix steps can take a long time because they are inherently repetitive actions. Mixing ten times takes ten times as long as mixing once! To save time, set a mix repetitions variable based on the value of ``protocol.params.dry_run`` and pass that to :py:meth:`.mix`::

    if protocol.params.dry_run is True:
        mix_reps = 1
    else:
        mix_reps = 10
    pipette.mix(repetitions=mix_reps, volume=50, location=plate["A1"].bottom())

Note that this checks whether the dry run parameter is ``True``. If you prefer to set up all your ``if`` statements to check whether it's ``False``, you can reverse the logic::

    if protocol.params.dry_run is False:
        mix_reps = 10
    else:
        mix_reps = 1

Returning Tips
==============

Tips used in a dry run should be reusable — for another dry run, if nothing else. It doesn't make sense to dispose of them in a trash container, unless you specifically need to test movement to the trash. You can choose whether to use :py:meth:`.drop_tip` or :py:meth:`.return_tip` based on the value of ``protocol.params.dry_run``. If the protocol doesn't have too many tip drop actions, you can use an ``if`` statement each time::

    if protocol.params.dry_run is True:
        pipette.return_tip()
    else:
        pipette.drop_tip()

However, repeating this block every time you handle tips could significantly clutter your code. Instead, you could define it as a function::

    def return_or_drop(pipette):
        if protocol.params.dry_run is True:
            pipette.return_tip()
        else:
            pipette.drop_tip()

Then call that function throughout your protocol::

    pipette.pick_up_tip()
    return_or_drop(pipette)

.. note::

    It's generally better to define a standalone function, rather than adding a method to the :py:class:`.InstrumentContext` class. This makes your custom, parameterized commands stand out from API methods in your code.

Additionally, if your protocol uses enough tips that you have to replenish tip racks, you'll need separate behavior for dry runs and live runs. In a live run, once you've used all the tips, the rack is empty, because the tips are in the trash. In a dry run, once you've used all the tips in a rack, the rack is *full*, because you returned the tips.

The API has methods to handle both of these situations. To continue using the same tip rack without physically replacing it, call :py:meth:`.reset_tipracks`. In the live run, move the empty tip rack off the deck and move a full one into place::

    if protocol.params.dry_run is True:
        pipette.reset_tipracks()
    else:
        protocol.move_labware(
            labware=tips_1, new_location=chute, use_gripper=True
        )
        protocol.move_labware(
            labware=tips_2, new_location="C3", use_gripper=True
        )

You can modify this code for similar cases. You may be moving tip racks by hand, rather than with the gripper. Or you could even mix the two, moving the used (but full) rack off-deck by hand — instead of dropping it down the chute, spilling all the tips — and have the gripper move a new rack into place. Ultimately, it's up to you to fine-tune your dry run behavior, and communicate it to your protocol's users with your parameter descriptions.
