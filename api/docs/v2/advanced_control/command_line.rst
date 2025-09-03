:og:description: How to control a robot outside of the Opentrons App using the command line.

.. _command-line:

Command Line
=============

The Python API also lets you perform many actions directly from the command line with ``opentrons_execute``.

.. TODO update with separate links to OT-2 and Flex setup, when new Flex process is in manual or on help site

The robot's command line is accessible either by going to **New > Terminal** in Jupyter or `via SSH <https://docs.opentrons.com/flex/advanced-operation/#command-line-operation-over-ssh>`_.

To execute a protocol from the robot's command line, copy the protocol file to the robot with ``scp`` and then run the protocol with ``opentrons_execute``:

.. prompt:: bash

   opentrons_execute /data/my_protocol.py


By default, ``opentrons_execute`` will print out the same run log shown in the Opentrons App, as the protocol executes. It also prints out internal logs at the level ``warning`` or above. Both of these behaviors can be changed. Run ``opentrons_execute --help`` for more information. 