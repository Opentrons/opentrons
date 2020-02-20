=============
Opentrons
=============

.. image:: https://badgen.net/travis/Opentrons/opentrons/edge
   :target: https://travis-ci.org/Opentrons/opentrons
   :alt: Build Status

.. image:: https://badgen.net/codecov/c/github/Opentrons/opentrons
   :target: https://codecov.io/gh/Opentrons/opentrons
   :alt: Coverage Status

.. image:: https://badgen.net/pypi/v/opentrons
   :target: https://pypi.org/project/opentrons/
   :alt: Download From PyPI

.. _Full API Documentation: http://docs.opentrons.com


Introduction
------------

This is the Opentrons library, the Python module that runs the Opentrons OT-2. It contains the code that interprets and executes protocols; code that controls the hardware both during and outside of protocols; and all the other small tasks and capabilities that the robot fulfills.

This document is about the structure and purpose of the source code. For information on how to use the Opentrons library or the robot in general, please refer to our  `Full API Documentation`_ for detailed instructions.

The Opentrons library allow two purposes:

1. **Control an Opentrons OT-2 robot.**  The API server uses the Opentrons library when controlling a robot. We boot up a server for the robot’s HTTP endpoints, and a server for its WebSockets-based RPC system for control during protocols. We are configured by files in the robot’s filesystem in ``/data``.

2. **Simulate protocols on users’ computers.** When simulating a protocol on a user’s computer, we use the entry point in `opentrons.simulate <https://github.com/Opentrons/opentrons/blob/edge/api/src/opentrons/simulate.py>`_. We set up simulators for the protocol, but do not run any kind of web servers. We are configured by files in the user’s home directory (for more information see configuration_).


Setting Up For Development
--------------------------

First, read the `top-level contributing guide section on setup <https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#environment-and-repository>`_. As that document states, once you have installed the prerequisites you can simply run ``make install`` in this subdirectory.

The only additional prerequisite concerns building documentation. If you want to build the PDF version of the documentation, you will need an installation of `LaTeX <https://www.latex-project.org/get/>`_ that includes the ``pdflatex`` tool. Note that if you don’t install this, everything will still work - you just won’t get the PDF documentation.



Updating A Robot
----------------

Since the library is installed on a robot, we need to have easy ways of getting newly-built wheels to the robot. This is provided by the ``push-api`` target of the top-level makefile. To send a library to the robot, navigate to the top-level ``opentrons`` directory and run ``make push-api host=<robot ip>``. If you forget the ``host=`` part, the makefile will look for a robot connected via USB. Note that the update facility relies on the `update-server <https://github.com/Opentrons/opentrons/tree/edge/update-server>`_ running.

The top level makefile (and the library makefile) also have a target called ``term``, which will give you an SSH terminal in the robot. This is just a light skin over invoking SSH with some options that make it more tolerant about frequently-changing IP addresses. It also takes an argument: ``make term host=<robot ip>`` connects to a specific ip, and if you don’t specify ``host=`` the makefile will look for a robot connected via USB. Unlike ``push-api``, this command only needs the robot to be booted to function.


Tests and Linting
-----------------

All code changes should be accompanied by test changes as a rule of thumb. The only exceptions are to changes that are mostly about invoking different things in the system or changing hardware behavior; these should be documented with tests run on physical robots.

Our tests live in ``tests/opentrons`` and are run with `pytest <https://docs.pytest.org/en/latest/>`_. Tests are run in CI on every pull request and on ``edge``; PRs will not be merged with failing tests.

Tests should be organized similarly to the organization of the module itself.

We use `PyLama <https://github.com/klen/pylama>`_ for lint checks, and `mypy <http://mypy-lang.org/>`_ for type-checking annotations. Both of these tools are run in the ``lint`` makefile target, and is run in CI; PRs will not be merged with failing lint. Usage of ``noqa`` to temporarily disable lint is discouraged, but if you need to please disable only a specific rule and leave a comment explaining exactly why. The same goes with ``type: ignore``.

New code should have appropriate type annotations, and refactors of old code should try to add type annotations. We’re flexible about the refactor part, though - if adding type annotations greatly expands the scope of a PR, it’s OK to not add them as long as you explain this in the PR message.


Simulating Protocols
--------------------

To simulate a protocol using this package, you can use the console script ``opentrons_simulate``, which is installed when this package is installed from pip. For detailed information on how to run the script, run ``opentrons_simulate --help``. In general, however, simulating a protocol is as simple as running ``opentrons_simulate.exe C:\path\to\protocol`` on Windows or ``opentrons_simulate /path/to/protocol`` on OSX or Linux.

The simulation script can also be invoked through python with ``python -m opentrons.simulate /path/to/protocol``.

This also provides an entrypoint to use the Opentrons simulation package from other Python contexts such as an interactive prompt or Jupyter. To simulate a protocol in python, open a file containing a protocol and pass it to ``opentrons.simulate.simulate``:

.. code-block:: python

   import opentrons.simulate
   protocol_file = open('/path/to/protocol.py')
   opentrons.simulate.simulate(protocol_file)


The function will either run and return or raise an  exception if there is a problem with the protocol.


Configuration
-------------

The module has a lot of configuration, some of which is only relevant when running on an actual robot, but some of which could be useful during simulation. When the module is first imported, it will try and write configuration files in ``~/.opentrons/config.json`` (``C:\Users\%USERNAME%\.opentrons\config.json`` on Windows). This contains mostly paths to other configuration files and directories, most of which will be in that folder. The location can be changed by setting the environment variable ``OT_API_CONFIG_DIR`` to another path. Inividual settings in the config file can be overridden by setting environment variables named like ``OT_API_${UPPERCASED_VAR_NAME}`` (for instance, to override the ``serial_log_file`` config element you could set the environment variable ``OT_API_SERIAL_LOG_FILE`` to a different path).


Using the Deck Calibration Tool
-------------------------------

You can run this tool from the command line of the robot by using `ssh` to access the terminal.
To run the tool either type `calibrate` or `python -m opentrons.deck_calibration.dc_main`

Instructions:
    - Robot must be set up with two 300ul or 50ul single-channel pipettes
      installed on the right-hand and left-hand mount.
    - Put a GEB 300ul tip onto the pipette.
    - Use the arrow keys to jog the robot over slot 5 in an open space that
      is not an engraving or a hole.
    - Use the 'q' and 'a' keys to jog the pipette up and down respectively
      until the tip is just touching the deck surface, then press 'z'. This
      will save the 'Z' height.
    - Press '1' to automatically go to the expected location of the first
      calibration point. Jog the robot until the tip is actually at
      the point, then press 'enter'.
    - Repeat with '2' and '3'.
    - After calibrating all three points, press the space bar to save the
      configuration.
    - Optionally, press 4,5,6 or 7 to validate the new configuration.
    - Press 'p' to perform tip probe. Press the space bar to save again.
    - Press 'm' to perform mount calibration. Press the space bar to save again.
    - Press 'esc' to exit the program.
