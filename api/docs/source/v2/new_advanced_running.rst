Running Protocols Directly On The Robot
=======================================

Sometimes, you may write a protocol that is not suitable for execution through the Opentrons App. Perhaps it requires user input; perhaps it needs to do a lot of things it cannot do when being simulated. There are two ways to run a protocol on the robot without using the Opentrons app.

Jupyter Notebook
----------------

The robot runs a Jupyter notebook server that you can connect to with your web browser. This is a convenient environment in which to write and debug protocols, since you can define different parts of your protocol in different notebook cells and run only part of the protocol at a given time.

You can access the robot’s Jupyter notebook by following these steps:

1. Open your Opentrons App and look for the IP address of your robot on the robot information page.
2. Type in ``(Your Robot's IP Address):48888`` into any browser on your computer.

Here, you can select a notebook and develop protocols that will be saved on the robot itself. Note that these protocols will only be on the robot unless specifically downloaded to your computer using the ``File / Download As`` buttons in the notebook.

Protocol Structure
++++++++++++++++++

To take advantage of Jupyter's ability to run only parts of your protocol, you have to restructure it slightly - turn it inside out. Rather than writing a single ``run`` function that contains all your protocol logic, you can use the function :py:meth:`opentrons.execute.get_protocol_api`:

.. code-block:: python

   >>> import opentrons.execute
   >>> protocol = opentrons.execute.get_protocol_api()


This returns the same kind of object - a :py:class:`.ProtocolContext` - that is passed into your protocol's ``run`` function when you upload your protocol in the Opentrons App. Full documentation on the capabilities and use of the :py:class:`.ProtocolContext` object is available in the other sections of this guide - :ref:`protocol-api-robot`, :ref:`new-pipette`, :ref:`v2-atomic-commands`, :ref:`v2-complex-commands`, :ref:`new-labware`, and :ref:`new_modules`; a full list of all available attributes and methods is available in :ref:`protocol-api-reference`.

Whenever you call `get_protocol_api`, the robot will update its cache of attached instruments and modules. You can call `get_protocol_api` repeatedly; it will return an entirely new :py:class:`.ProtocolContext` each time, without any labware loaded or any instruments established. This can be a good way to reset the state of the system, if you accidentally loaded in the wrong labware.

Now that you have a :py:class:`.ProtocolContext`, you call all its methods just as you would in a protocol, without the encompassing ``run`` function, just like if you were prototyping a plotting or pandas script for later use.

Running A Previously-Written Protocol
+++++++++++++++++++++++++++++++++++++

If you have a protocol that you have already written, that is defined in a ``run`` function, and that you don't want to modify, you can run it directly in Jupyter. Copy the protocol into a cell and execute it - this won't cause the robot to move, it just makes the function available. Then, call the ``run`` function you just defined, and give it a :py:class:`.ProtocolContext`:

.. code-block:: python

   >>> import opentrons.execute
   >>> from opentrons import protocol_api
   >>> def run(protocol: protocol_api.ProtocolContext):
   ...     # the contents of your protocol are here...
   ...
   >>> protocol = opentrons.execute.get_protocol_api()
   >>> run(protocol)  # your protocol will now run



Command Line
------------

The robot's command line is accessible either by creating a new terminal in Jupyter or by using SSH to access its terminal. Sometimes, you may want to run a protocol on the robot terminal directly, without using the Opentrons App or the robot's Jupyter notebook. To do this, use the command line program ``opentrons_execute``:

.. code-block:: shell

   # opentrons_execute /data/my_protocol.py


You can access help on the usage of ``opentrons_execute`` by calling ``opentrons_execute --help``. This script has a couple options to let you customize what it prints out when you run it. By default, it will print out the same runlog you see in the Opentrons App when running a protocol, as it executes; it will also print out internal logs at level ``warning`` or above. Both of these behaviors can be changed.
