.. _writing:

##########################
Using Python For Protocols
##########################

Writing protocols in Python requires some up-front design before seeing your liquid handling automation in action. At a high-level, writing protocols with the OT-2 Python Protocol API looks like:

1) Write a Python protocol
2) Test the code for errors
3) Repeat steps 1 & 2
4) Calibrate labware on your OT-2
5) Run your protocol

These sets of documents aim to help you get the most out of steps 1 & 2, the "design" stage.

*******************************

********************
Python for Beginners
********************

If Python is new to you, we suggest going through a few simple tutorials to acquire a base understanding to build upon. The following tutorials are a great starting point for working with the Protocol API (from `learnpython.org <http://www.learnpython.org/>`_):

1) `Hello World <http://www.learnpython.org/en/Hello%2C_World%21>`_
2) `Variables and Types <http://www.learnpython.org/en/Variables_and_Types>`_
3) `Lists <http://www.learnpython.org/en/Lists>`_
4) `Basic Operators <http://www.learnpython.org/en/Basic_Operators>`_
5) `Conditions <http://www.learnpython.org/en/Conditions>`_
6) `Loops <http://www.learnpython.org/en/Loops>`_
7) `Functions <http://www.learnpython.org/en/Functions>`_
8) `Dictionaries <http://www.learnpython.org/en/Dictionaries>`_

After going through the above tutorials, you should have enough of an understanding of Python to work with the Protocol API and start designing your experiments!
More detailed information on Python can always be found in `the Python docs <https://docs.python.org/3/index.html>`_.

*******************************

*******************
Working with Python
*******************


Using a popular and free code editor, like `Visual Studio Code`__, is a common method for writing Python protocols. Download onto your computer, and you can now write Python scripts.

__ https://code.visualstudio.com/

.. note::

    Make sure that when saving a protocol file, it ends with the ``.py`` file extension. This will ensure the Opentrons App and other programs are able to properly read it.

    For example, ``my_protocol.py``

How Protocols Are Organized
===========================

When writing protocols using the Python Protocol API, there are generally five sections:

1) Metadata and Version Selection
2) Run function
3) Labware
4) Pipettes
5) Commands

Metadata and Version Selection
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Metadata is a dictionary of data that is read by the server and returned to client applications (such as the Opentrons App). Most metadata is not needed to run a protocol, but if present can help the Opentrons App display additional data about the protocol currently being executed. These optional (but recommended) fields are (``"protocolName"``, ``"author"``, and ``"description"``).

The required element of the metadata is ``"apiLevel"``. This must contain a string specifying the major and minor version of the Python Protocol API that your protocol is designed for. For instance, a protocol written for version 2.0 of the Python Protocol API (only launch version of the Protocol API should have in its metadata ``"apiLevel": "2.0"``.


For more information on Python Protocol API versioning, see :ref:`v2-versioning`.

The Run Function and the Protocol Context
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Protocols are structured around a function called ``run(protocol)``, defined in code like this:

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        pass

This function must be named exactly ``run`` and must take exactly one mandatory argument (its name doesn’t matter, but we recommend ``protocol`` since this argument represents the protocol that the robot will execute).

The function ``run`` is the container for the code that defines your protocol.

The object ``protocol`` is the *protocol context*, which represents the robot and its capabilities. It is always an instance of the :py:class:`opentrons.protocol_api.ProtocolContext` class (though you'll never have to instantiate one yourself - it is always passed in to ``run()``), and it is tagged as such in the example protocol to allow most editors to give you autocomplete.

The protocol context has two responsibilities:

1) Remember, track, and check the robot’s state
2) Expose the functions that make the robot execute actions

The protocol context plays the same role as the ``robot``, ``labware``, ``instruments``, and ``modules`` objects in past versions of the API, with one important difference: it is only one object; and because it is passed in to your protocol rather than imported, it is possible for the API to be much more rigorous about separating simulation from reality.

The key point is that there is no longer any need to ``import opentrons`` at the top of every protocol, since the *robot* now *runs the protocol*, rather than the *protocol running the robot*. The example protocol imports the definition of the protocol context to provide editors with autocomplete sources.


Labware
^^^^^^^

The next step is defining the labware required for your protocol. You must tell the protocol context about what should be present on the deck, and where. You tell the protocol context about labware by calling the method ``protocol.load_labware(name, slot)`` and saving the result.

The name of a labware is a string that is different for each kind of labware. You can look up labware to add to your protocol on the Opentrons `Labware Library <https://labware.opentrons.com>`_.

The slot is the labelled location on the deck in which you've placed the labware. The available slots are numbered from 1-11.

Our example protocol above loads

* a `Corning 96 Well Plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_ in slot 2:

.. code-block:: python

   plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)

* an `Opentrons 300µL Tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_ in slot 1:

.. code-block:: python

   tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 1)

These labware can be referenced later in the protocol as ``plate`` and ``tiprack`` respectively. Check out `the Python docs <https://docs.python.org/3/index.html>`_ for further clarification on using variables effectively in your code.

You can find more information about handling labware in the :ref:`new-labware` section.


Pipettes
^^^^^^^^

After defining labware, you define the instruments required for your protocol. You tell the protocol context about which pipettes should be attached, and which slot they should be attached to, by calling the method ``protocol.load_instrument(model, mount, tip_racks)`` and saving the result.

The ``model`` of the pipette is the kind of pipette that should be attached; the ``mount`` is either ``"left"`` or ``"right"``; and ``tip_racks`` is a list of the objects representing tip racks that this instrument should use. Specifying ``tip_racks`` is optional, but if you don't then you'll have to manually specify where the instrument should pick up tips from every time you try and pick up a tip.

See :ref:`new-pipette` for more information on creating and working with pipettes.

Our example protocol above loads a P300 Single-channel pipette (``'p300_single'``) in the left mount (``'left'``), and uses the Opentrons 300 µL tiprack we loaded previously as a source of tips (``tip_racks=[tiprack]``).


Commands
^^^^^^^^

Once the instruments and labware required for the protocol are defined, the next step is to define the commands that make up the protocol. The most common commands are ``aspirate()``, ``dispense()``, ``pick_up_tip()``, and ``drop_tip()``. These and many others are described in the :ref:`v2-atomic-commands` and :ref:`v2-complex-commands` sections, which go into more detail about the commands and how they work. These commands typically specify which wells of which labware to interact with, using the labware you defined earlier, and are methods of the instruments you created in the pipette section. For instance, in our example protocol, you use the pipette you defined to:

1) Pick up a tip (implicitly from the tiprack you specified in slot 1 and assigned to the pipette): ``pipette.pick_up_tip()``
2) Aspirate 100 µL from well A1 of the 96 well plate you specified in slot 2: ``pipette.aspirate(100, plate['A1'])``
3) Dispense 100 µL into well A2 of the 96 well plate you specified in slot 2: ``pipette.dispense(100, plate['A2'])``
4) Drop the tip (implicitly into the trash at the back right of the robot's deck): ``pipette.drop_tip()``


.. _simulate-block:

***************************
Simulating Python Protocols
***************************

In general, the best way to simulate a protocol is to simply upload it to your OT-2 through the Opentrons App. When you upload a protocol via the app, the OT-2 simulates the protocol and the app displays any errors. However, if you want to simulate protocols without being connected to an OT-2, you can download the Opentrons Python package.

Installing
==========

To install the Opentrons package, you must install it from Python’s package manager, `pip`. The exact method of installation is slightly different depending on whether you use Jupyter on your computer or not. You do not need to do this if you want to use :ref:`writing-robot-jupyter`, *only* for your locally installed notebook.

Non-Jupyter Installation
^^^^^^^^^^^^^^^^^^^^^^^^

First, install Python 3.7.6 (`Windows x64 <https://www.python.org/ftp/python/3.7.6/python-3.7.6-amd64.exe>`_, `Windows x86 <https://www.python.org/ftp/python/3.7.6/python-3.7.6.exe>`_, `OS X <https://www.python.org/ftp/python/3.7.6/python-3.7.6-macosx10.6.pkg>`_) or higher on your local computer.

Once the installer is done, make sure that Python is properly installed by opening a terminal and doing ``python --version``. If this is not higher than 3.7.6, you have another version of Python installed; this happens frequently on OS X and sometimes on Windows. We recommend using a tool like `pyenv <https://github.com/pyenv/pyenv>`_ to manage multiple Python versions. This is particularly useful on OS X, which has a built-in install of Python 2.7 that should not be removed.

Once Python is installed, install the `opentrons package <https://pypi.org/project/opentrons/>`_ using ``pip``:

.. prompt:: bash

   pip install opentrons

You should see some output that ends with :substitution-code:`Successfully installed opentrons-|release|`.

Jupyter Installation
^^^^^^^^^^^^^^^^^^^^

You must make sure that you install the ``opentrons`` package for whichever kernel and virtual environment the notebook is using. A generally good way to do this is

.. prompt:: python >>>

   import sys
   !{sys.executable} -m pip install opentrons

Simulating Your Scripts
=======================

From the Command Line
^^^^^^^^^^^^^^^^^^^^^

Once the Opentrons Python package is installed, you can simulate protocols in your terminal using the ``opentrons_simulate`` command:

.. prompt:: bash

   opentrons_simulate.exe my_protocol.py

or, on OS X or Linux,

.. prompt:: bash

   opentrons_simulate my_protocol.py

The simulator will print out a log of the actions the protocol will cause, similar to the Opentrons App; it will also print out any log messages caused by a given command next to that list of actions. If there is a problem with the protocol, the simulation will stop and the error will be printed.

The simulation script can also be invoked through python:

.. prompt:: bash

    python -m opentrons.simulate /path/to/protocol

``opentrons_simulate`` has several command line options that might be useful.
Most options are explained below, but to see all options you can run

.. prompt:: bash

   opentrons_simulate --help


Using Custom Labware
^^^^^^^^^^^^^^^^^^^^

By default, ``opentrons_simulate`` will load custom labware definitions from the
directory in which you run it. You can change the directory
``opentrons_simulate`` searches for custom labware with the
``--custom-labware-path`` option:

.. code-block:: shell

   python.exe -m opentrons.simulate --custom-labware-path="C:\Custom Labware"


In the Python Shell
^^^^^^^^^^^^^^^^^^^

The Opentrons Python package also provides an entrypoint to use the Opentrons simulation package from other Python contexts such as an interactive prompt or Jupyter. To simulate a protocol in Python, open a file containing a protocol and pass it to :py:meth:`opentrons.simulate.simulate`:

.. code-block:: python


   from opentrons.simulate import simulate, format_runlog
   # read the file
   protocol_file = open('/path/to/protocol.py')
   # simulate() the protocol, keeping the runlog
   runlog, _bundle = simulate(protocol_file)
   # print the runlog
   print(format_runlog(runlog))

The :py:meth:`opentrons.simulate.simulate` method does the work of simulating the protocol and returns the run log, which is a list of structured dictionaries. :py:meth:`opentrons.simulate.format_runlog` turns that list of dictionaries into a human readable string, which is then printed out. For more information on the protocol simulator, see :ref:`simulate-block`.


.. _writing-robot-jupyter:

The Robot’s Jupyter Notebook
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Your OT-2 also has a Jupyter notebook, which you can use to develop and execute protocols. In the Jupyter notebook, you can use the Python Protocol API simulator by writing:

.. code-block:: python
    :substitutions:

    from opentrons import simulate
    protocol = simulate.get_protocol_api('|apiLevel|')
    p300 = protocol.load_instrument('p300_single', 'right')
    # ...

The ``protocol`` object, which is an instance of :py:class:`.ProtocolContext`, is the same thing that gets passed to your protocol's ``run`` function, but set to simulate rather than control an OT-2. You can call all your protocol's functions on that object.

If you have a full protocol, wrapped inside a ``run`` function, defined in a Jupyter cell you can also use :py:meth:`opentrons.simulate.simulate` as described above to simulate the protocol.

For more information on how to execute protocols using the OT-2's Jupyter notebook, please see :ref:`advanced-control`.


Configuration and Local Storage
===============================

The Opentrons Python package uses a folder in your user directory as a place to store and read configuration and changes to its internal data. This location is ``~/.opentrons`` on Linux or OSX and ``C:\Users\%USERNAME%\.opentrons`` on Windows.

