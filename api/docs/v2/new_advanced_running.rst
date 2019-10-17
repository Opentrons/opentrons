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


Bundling Protocols
==================

.. warning::

    Bundled protocols are a beta feature. The only way to create them is with the ``opentrons_simulate`` script. The format of the bundle files themselves is subject to change. This is a feature you should use with care. Only very limited support from Opentrons is available for this beta feature.


Bundled protocols are zip files containing

1. an APIv2 protocol
2. Definitions for all required labware for the protocol, including the fixed trash
3. Additional data files that will be made available to the protocol

Bundled protocols may be uploaded through the Opentrons App in their zipped form, just like normal protocols. They may be simulated with ``opentrons_simulate`` and executed from the robot command line with ``opentrons_execute`` just like normal protocols.

The advantage to using bundled protocols is that you can pack in custom labware definitions and custom data files such as CSVs specifying aspiration amounts and locations.


Writing A Bundled Protocol
--------------------------

When you write a bundled protocol, you write a normal APIv2 Python protocol. It may or may not include custom labware or data files. It is written in Python using the same API as any other APIv2 Python protocol.

Bundled protocols have all their labware definitions available to them inside the bundle, including both standard and custom definitions. They are limited to loading labware defined in the bundle; for this reason, **if you change what labware you use in a bundled protocol you must rebundle it**.

Bundled protocols also have any data files they may need available to them inside the bundle. Similarly to labware, if you change what data files you read inside the protocol you should rebundle it.

Bundled protocols are created using ``opentrons_simulate``. The protocol must be an APIv2 protocol, and ``opentrons_simulate`` must be running in APIv2 mode. The easiest way to do this is to specify it with the environment variable ``OT_API_FF_useProtocolApi2=1``. You can specify this every time you run ``opentrons_simulate`` on Linux or Mac, or put it in your shell rc file; on Windows, you can set it in the environment variables dialog.

To bundle, use the ``-b`` option to ``opentrons_simulate``. **If the ``-b`` option is not available, it is because you have not set the APIv2 feature flag**. This will simulate the protocol, then (if successful) bundle the protocol file, all required labware definitions, and any specified data file into a zip suitable for use with the Opentrons app or the ``opentrons_execute`` script. If you are using custom data files or custom labware definitions, you must ensure that these files and definitions are available to ``opentrons_simulate``.


Accessing Custom Labware Definitions
++++++++++++++++++++++++++++++++++++

To access a labware definition inside a bundle, use :py:meth:`.ProtocolContext.load_labware` just like in a normal protocol. To make custom labware definitions available to ``opentrons_simulate``, use the ``-L`` option. By default, any labware definition in the current directory when you run ``opentrons_simulate`` is available to the protocol.


Accessing Custom Data
+++++++++++++++++++++

Custom data files are made available in :py:attr:`.ProtocolContext.bundled_data`. This is a dictionary mapping the names of data files (without any paths) to their contents, as bytes. If you need the contents of the files as strings, you must decode them with ``.decode('utf-8')`` (the files are presented in bytes in case they are not text, for instance if they are images or zip files). These can then be read in whatever format you need.

For instance, if a CSV file called ``aspirations.csv`` is bundled, you can do:

.. code-block:: python

    import csv
    def run(ctx):
        aspirations_contents = ctx.bundled_data['aspirations.csv'].decode('utf-8')
        print(aspirations_contents)  # prints contents when simulated


To make a custom data file available to ``opentrons_simulate``, use the ``-d`` option to specify a file.


Executing A Bundled Protocol
----------------------------

Once you have a bundled protocol file (by default, its file extension will be ``.ot2.zip``) you can use it without any further specification of labware or data files - they are all bundled inside the file. For instance,

1. You can execute a bundled protocol through the Opentrons App by selecting it in the protocol pane
2. You can execute a bundled protocol on the robot command line by doing ``opentrons_execute ./protocol.ot2.zip``
3. You can simulate a bundled protocol on your computer by doing ``opentrons_simulate ./protocol.ot2.zip``.
