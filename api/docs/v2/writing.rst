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
More detailed information on Python can always be found at `the Python docs <https://docs.python.org/3/index.html>`_

*******************************

*******************
Working with Python
*******************


Using a popular and free code editor, like `Visual Studio Code`__, is a common method for writing Python protocols. Download onto your computer, and you can now write Python scripts.

__ https://code.visualstudio.com/

.. note::

    Make sure that when saving a protocol file, it ends with the ``.py`` file extension. This will ensure the Opentrons App and other programs are able to properly read it.

    For example, ``my_protocol.py``


***************************
Simulating Python Protocols
***************************

In general, the best way to simulate a protocol is to simply upload it to your OT-2 through the Opentrons App. When you upload a protocol via the app, the OT-2 simulates the protocol and the app displays any errors. However, if you want to simulate protocols without being connected to an OT-2, you can download the Opentrons Python package.

Installing
==========

To install the Opentrons package, you must install it from Python’s package manager, `pip`. The exact method of installation is slightly different depending on whether you use Jupyter on your computer (note: you do not need to do this if you want to use the :ref:`writing-robot-jupyter`, ONLY for your locally-installed notebook) or not.

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

.. _simulate-block:

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

Using Jupyter
^^^^^^^^^^^^^

In your Jupyter notebook, you can use the Python Protocol API simulator by doing

.. code-block:: python
    :substitutions:

    from opentrons import simulate
    protocol = simulate.get_protocol_api('|apiLevel|')
    p300 = protocol.load_instrument('p300_single', 'right')
    # ...

The ``protocol`` object, which is an instance of :py:class:`.ProtocolContext`, is the same thing that gets passed to your protocol's ``run`` function, but set to simulate rather than control an OT-2. You can call all your protocol's functions on that object.

If you have a full protocol, wrapped inside a ``run`` function, defined in a Jupyter cell you can also use :py:meth:`opentrons.simulate.simulate` as described above to simulate the protocol.

These instructions also work on the OT-2's Jupyter notebook. This can also be used in the Python interactive shell.


Configuration and Local Storage
===============================

The Opentrons Python package uses a folder in your user directory as a place to store and read configuration and changes to its internal data. This location is ``~/.opentrons`` on Linux or OSX and ``C:\Users\%USERNAME%\.opentrons`` on Windows.


.. _writing-robot-jupyter:

************************
Robot’s Jupyter Notebook
************************

Your OT-2 also has a Jupyter notebook, which you can use to develop and execute protocols. For more information on how to execute protocols using the OT-2's Jupyter notebook, please see :ref:`advanced-control`. To simulate protocols on the OT-2's Jupyter notebook, use the instructions above.
