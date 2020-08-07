.. _advanced-control:

Advanced Control
================

Sometimes, you may write a protocol that is not suitable for execution through the Opentrons App. Perhaps it requires user input; perhaps it needs to do a lot of things it cannot do when being simulated. There are two ways to run a protocol on the OT-2 without using the Opentrons App.

Jupyter Notebook
----------------

The OT-2 runs a Jupyter Notebook server that you can connect to with your web browser. This is a convenient environment in which to write and debug protocols, since you can define different parts of your protocol in different notebook cells and run only part of the protocol at a given time.

You can access the OT-2’s Jupyter Notebook by following these steps:

1. Open your Opentrons App and look for the IP address of your OT-2 on the information page.
2. Type in ``(Your OT-2's IP Address):48888`` into any browser on your computer.

Here, you can select a notebook and develop protocols that will be saved on the OT-2 itself. These protocols will only be on the OT-2 unless specifically downloaded to your computer using the ``File / Download As`` buttons in the notebook.

Protocol Structure
++++++++++++++++++

To take advantage of Jupyter's ability to run only parts of your protocol, you have to restructure your protocol - turn it inside out. Rather than writing a single ``run`` function that contains all your protocol logic, you can use the function :py:meth:`opentrons.execute.get_protocol_api`, into which you pass the same API version (see :ref:`v2-versioning`) that you would specify in your protocol's metadata:

.. code-block:: python
    :substitutions:

    import opentrons.execute
    protocol = opentrons.execute.get_protocol_api('|apiLevel|')
    protocol.home()


This returns the same kind of object - a :py:class:`.ProtocolContext` - that is passed into your protocol's ``run`` function when you upload your protocol in the Opentrons App. Full documentation on the capabilities and use of the :py:class:`.ProtocolContext` object is available in the other sections of this guide - :ref:`new-pipette`, :ref:`v2-atomic-commands`, :ref:`v2-complex-commands`, :ref:`new-labware`, and :ref:`new_modules`; a full list of all available attributes and methods is available in :ref:`protocol-api-reference`.

Whenever you call ``get_protocol_api``, the robot will update its cache of attached instruments and modules. You can call ``get_protocol_api`` repeatedly; it will return an entirely new :py:class:`.ProtocolContext` each time, without any labware loaded or any instruments established. This can be a good way to reset the state of the system, if you accidentally loaded in the wrong labware.

Now that you have a :py:class:`.ProtocolContext`, you call all its methods just
as you would in a protocol, without the encompassing ``run`` function, just like
if you were prototyping a plotting or pandas script for later use.

.. note::

    Before you can command the OT-2 to move using the protocol API you have just
    built, you must home the robot using ``protocol.home()``. If you try to move
    the OT-2 before you have called ``protocol.home()``, you will get a
    ``MustHomeError``.


Running A Previously-Written Protocol
+++++++++++++++++++++++++++++++++++++

If you have a protocol that you have already written you can run it directly in Jupyter. Copy the protocol into a cell and execute it - this won't cause the OT-2 to move, it just makes the function available. Then, call the ``run`` function you just defined, and give it a :py:class:`.ProtocolContext`:

.. code-block:: python
    :substitutions:

   import opentrons.execute
   from opentrons import protocol_api
   def run(protocol: protocol_api.ProtocolContext):
       # the contents of your protocol are here...

   protocol = opentrons.execute.get_protocol_api('|apiLevel|')
   run(protocol)  # your protocol will now run


Custom Labware
++++++++++++++

If you have custom labware definitions you want to use with Jupyter, make a new directory called "labware" in Jupyter and put the definitions there. These definitions will be available when you call ``load_labware``.


Command Line
------------

The OT-2's command line is accessible either by creating a new terminal in Jupyter or by `using SSH to access its terminal <https://support.opentrons.com/en/articles/3203681>`_.

To execute a protocol via SSH, copy it to the OT-2 using a program like ``scp`` and then use the command line program ``opentrons_execute``:

.. code-block:: shell

   # opentrons_execute /data/my_protocol.py


You can access help on the usage of ``opentrons_execute`` by calling ``opentrons_execute --help``. This script has a couple options to let you customize what it prints out when you run it. By default, it will print out the same runlog you see in the Opentrons App when running a protocol, as it executes; it will also print out internal logs at level ``warning`` or above. Both of these behaviors can be changed.

