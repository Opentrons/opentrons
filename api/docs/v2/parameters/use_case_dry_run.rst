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

