:og:description: How to control a robot outside of the Opentrons App, using Jupyter Notebook or the command line.

.. _advanced-control:

Advanced Control
================

As its name implies, the Python Protocol API is primarily designed for creating protocols that you upload via the Opentrons App and execute on the robot as a unit. But sometimes it's more convenient to control the robot outside of the app. For example, you might want to have variables in your code that change based on user input or the contents of a CSV file. Or you might want to only execute part of your protocol at a time, especially when developing or debugging a new protocol.

The OT-2 offers two ways of issuing Python API commands to the robot outside of the app: through Jupyter Notebook or on the command line with ``opentrons_execute``.

Jupyter Notebook
----------------

The OT-2 runs a `Jupyter Notebook <https://jupyter.org>`_ server on port 48888, which you can connect to with your web browser. This is a convenient environment for writing and debugging protocols, since you can define different parts of your protocol in different notebook cells and run a single cell at a time.

.. note::
    The Jupyter Notebook server only supports Python Protocol API versions 2.13 and earlier. Use the Opentrons App to run protocols that require functionality added in newer versions.

Access the OT-2’s Jupyter Notebook by either:

- Going to the **Advanced** tab of Robot Settings and clicking **Launch Jupyter Notebook**.
- Going directly to ``http://<robot-ip>:48888`` in your web browser (if you know your robot's IP address).

Once you've launched Jupyter Notebook, you can create a notebook file or edit an existing one. These notebook files are stored on the OT-2 itself. If you want to save code from a notebook to your computer, go to **File > Download As** in the notebook interface.

Protocol Structure
++++++++++++++++++

Jupyter Notebook is structured around `cells`: discrete chunks of code that can be run individually. This is nearly the opposite of Opentrons protocols, which bundle all commands into a single ``run`` function. Therefore, to take full advantage of Jupyter Notebook, you have to restructure your protocol. 

Rather than writing a  ``run`` function and embedding commands within it, start your notebook by importing ``opentrons.execute`` and calling :py:meth:`opentrons.execute.get_protocol_api`. This function also replaces the ``metadata`` block of a standalone protocol by taking the minimum :ref:`API version <v2-versioning>` as its argument. Then you can call :py:class:`~opentrons.protocol_api.ProtocolContext` methods in subsequent lines or cells:

.. code-block:: python

    import opentrons.execute
    protocol = opentrons.execute.get_protocol_api('2.13')
    protocol.home()

The first command you execute should always be :py:meth:`~opentrons.protocol_api.ProtocolContext.home`. If you try to execute other commands first, you will get a ``MustHomeError``. (When running protocols through the Opentrons App, the robot homes automatically.)

You should use the same :py:class:`.ProtocolContext` throughout your notebook, unless you need to start over from the beginning of your protocol logic. In that case, call :py:meth:`~opentrons.execute.get_protocol_api` again to get a new :py:class:`.ProtocolContext`.

Running a Previously Written Protocol
+++++++++++++++++++++++++++++++++++++

You can also use Jupyter to run a protocol that you have already written. To do so, first copy the entire text of the protocol into a cell and run that cell:

.. code-block:: python

    import opentrons.execute
    from opentrons import protocol_api
    def run(protocol: protocol_api.ProtocolContext):
        # the contents of your previously written protocol go here


Since a typical protocol only `defines` the ``run`` function but doesn't `call` it, this won't immediately cause the OT-2 to move. To begin the run, instantiate a :py:class:`.ProtocolContext` and pass it to the ``run`` function you just defined:

.. code-block:: python

    protocol = opentrons.execute.get_protocol_api('2.13')
    run(protocol)  # your protocol will now run


Using Custom Labware
++++++++++++++++++++

If you have custom labware definitions you want to use with Jupyter, make a new directory called ``labware`` in Jupyter and put the definitions there. These definitions will be available when you call :py:meth:`~opentrons.protocol_api.ProtocolContext.load_labware`.

Using Modules
+++++++++++++

If your protocol uses :ref:`new_modules`, you need to take additional steps to make sure that Jupyter Notebook doesn't send commands that conflict with the robot server. Sending commands to modules while the robot server is running will likely cause errors, and the module commands may not execute as expected.

To disable the robot server, open a Jupyter terminal session by going to **New > Terminal** and run ``systemctl stop opentrons-robot-server``. Then you can run code from cells in your notebook as usual. When you are done using Jupyter Notebook, you should restart the robot server with ``systemctl start opentrons-robot-server``.

.. note::

    While the robot server is stopped, the robot will display as unavailable in the Opentrons App. If you need to control the robot or its attached modules through the app, you need to restart the robot server and wait for the robot to appear as available in the app.


Command Line
------------

The OT-2's command line is accessible either by going to **New > Terminal** in Jupyter or `via SSH <https://support.opentrons.com/s/article/Connecting-to-your-OT-2-with-SSH>`_.

To execute a protocol from the robot's command line, copy the protocol file to the robot with ``scp`` and then run the protocol with ``opentrons_execute``:

.. prompt:: bash

   opentrons_execute /data/my_protocol.py


By default, ``opentrons_execute`` will print out the same run log shown in the Opentrons App, as the protocol executes. It also prints out internal logs at the level ``warning`` or above. Both of these behaviors can be changed; for further details, run ``opentrons_execute --help``. 
