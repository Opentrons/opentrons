Running Protocols Directly On The Robot
=======================================

There are two ways to run a protocol on the robot without using the Opentrons app. These are typically protocols that require input or physical stimulations and cannot be emulated. 

Jupyter Notebook
----------------

Using your web browers (I'd suggest which are tested here for example 'we recommend Chrome or Firefox v10), you can acess the robots Jupyter notebook server. This is a convenient environment to execute and debug protocols and define different parts of your protocol in different notebook cells. By doing such you can specify which parts of the protocol at a given time should run.

To access the robot’s Jupyter notebook:

1. Find the IP address of your robot on the robot information page.
2. Open your Opentrons App
3. Enter ``(Your Robot's IP Address):48888`` into any browser on your computer.

Here, you can select a notebook and develop protocols. 

Note: Protocols will stored ONLY on the robot only unless specifically downloaded to your computer via ``File / Download As`` buttons in the notebook.

Protocol Structure
++++++++++++++++++

To take advantage of Jupyter's ability to run only parts of your protocol use the function :py:meth:`opentrons.execute.get_protocol_api`:

.. code-block:: python

   >>> import opentrons.execute
   >>> protocol = opentrons.execute.get_protocol_api()


This returns the same kind of object - a :py:class:`.ProtocolContext` - that is passed into your protocol's ``run`` function when you upload your protocol in the Opentrons App. Full documentation on the capabilities and use of the :py:class:`.ProtocolContext` object is available in the other sections of this guide - :ref:`protocol-api-robot`, :ref:`new-pipette`, :ref:`v2-atomic-commands`, :ref:`v2-complex-commands`, :ref:`new-labware`, and :ref:`new_modules`; a full list of all available attributes and methods is available in :ref:`protocol-api-reference`.

Whenever you call `get_protocol_api`, the robot will update its cache of attached instruments and modules. By calling `get_protocol_api` repeatedly; it will return an entirely new :py:class:`.ProtocolContext` without any labware loaded or any instruments established. 
Using :py:class:`.ProtocolContext`, you call all its methods just as you would in a protocol, without the encompassing ``run`` function, just like if you were prototyping a plotting or pandas script for later use.

How To Run A Previously-Written Protocol
+++++++++++++++++++++++++++++++++++++

Any protocol written that is defined in a ``run`` function, you implement directly in Jupyter. Copy the protocol into a cell and execute it. This won't cause the robot to move, it just makes the function available. Call the ``run`` function you just defined, and give it a :py:class:`.ProtocolContext`:

.. code-block:: python

   >>> import opentrons.execute
   >>> from opentrons import protocol_api
   >>> def run(protocol: protocol_api.ProtocolContext):
   ...     # the contents of your protocol are here
   ...
   >>> protocol = opentrons.execute.get_protocol_api()
   >>> run(protocol)  # your protocol will now run



Command Line
------------

The robot's command line is accessible either by creating a new terminal in Jupyter or by using SSH to access its terminal. This allows you to run the protocol directly. To do this, use the command line program ``opentrons_execute``:

.. code-block:: shell

   # opentrons_execute /data/my_protocol.py


You can access help on the usage of ``opentrons_execute`` by calling ``opentrons_execute --help``.
