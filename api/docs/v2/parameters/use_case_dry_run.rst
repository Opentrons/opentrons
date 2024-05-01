:og:description: How to set up and use a dry run parameter in an Opentrons Python protocol.

.. _use-case-dry-run:

****************************
Parameter Use Case – Dry Run
****************************

When testing out a new protocol, it's common to perform a dry run to watch your robot go through all the steps without actually handling samples or reagents. This use case explores how to add a single boolean parameter for whether you're performing a dry run. 

The code examples will show how this single value can control:

- Skipping module actions and other delays.
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
            description="Skip delays, shorten mix steps, and return tips to their racks.",
            default=False
        )

This parameter is set to ``False`` by default, assuming that most runs will be live runs. In other words, during run setup the technician will have to change the parameter setting to perform a dry run. If they leave it as is, the robot will perform a live run.

Additionally, since "dry run" can have different meanings in different contexts, it's important to include a ``description`` that indicates exactly what the parameter will control — in this case, three things. The following sections will show how to accomplish each of those when the dry run parameter is set to ``True``.

Skipping Delays
===============


Shortening Mix Steps
====================


Returning Tips
==============
