.. _tutorials:

=============
API Tutorials
=============

Python Setup
^^^^^^^^^^^^^^^

`click here for tutorial`__

__ ./setup.html

There are a few things to consider when beginning a new Python protocol. In this section, we exlain the Opentrons API's ``containers``, ``instruments``, and ``robot`` modules, and how they are used to setup and control your Python protocol.

Wells
^^^^^^^^^

`click here for tutorial`__

__ ./wells.html

We spend a fair amount of time organizing and counting wells when writing Python protocols. This section describes the different ways we can access wells and groups of wells.

Tips
^^^^^^^^^

`click here for tutorial`__

__ ./tips.html

When we handle liquids with a pipette, we are constantly exchanging old, used tips for new ones to prevent cross-contamination between our wells. To help with this constant need, we describe in this section a few methods for getting new tips, and removing tips from a pipette.

Pipettes
^^^^^^^^^^

`click here for tutorial`__

__ ./pipettes.html

This is the fun section, where we get to move things around and pipette! This section describes the ``Pipette`` object's many liquid-handling commands, as well as how to move the ``robot``.

Transfer
^^^^^^^^^^

`click here for tutorial`__

__ ./transfer.html

The Transfer command is a nice way to wrap up the most common liquid-handling actions we take. Instead of having to write a ``loop`` or ``if`` statements, we can simply use the ``transfer()`` command, making Python protocol both easier to write and read!
