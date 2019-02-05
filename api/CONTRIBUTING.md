=================================
Opentrons Backend Server
==================================

This subdir of the repo contains the code that runs the backend server that control the OT2. It also can be installed from pip and used to simulate protocols.

This page is about how to get set up to work on the API itself. For information on how to use the API to simulate protocols or run protocols on an OT2, see [the readme](https://github.com/Opentrons/opentrons/blob/edge/api/README.rst) or [the documentation](https://docs.opentrons.com).

Setting Up For Development
-----------------------------

First, read the [top-level contributing guide](https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md). As with the other parts of the Opentrons software stack, the work on the backend server abides 


Using This Repo Outside Of A Robot From A Git Clone
----------------------------------------------------------

The code in this subdirectory can be used outside of a robot to check protocols; however, because the code requires extra shared data files and dependencies, you cannot simply run a python interpreter - it must be installed. Note that this is not the recommended way to simulate protocols on a computer - for that, see [the readme](https://github.com/Opentrons/opentrons/blob/edge/api/README.rst)

There are two ways to install the Opentrons software. The first is to create a virtual environment unique to this particular checkout of the Opentrons software; this is useful to avoid affecting the rest of your system. The second way is to install the Opentrons software to your entire system, and is much easier to use with other Python packages like Jupyter.

Before either step is taken, please follow the instructions in the Environment and Repository section of CONTRIBUTING.md in the repository root, up to and including running ``make install``.


Virtual Environment Setup
~~~~~~~~~~~~~~~~~~~~~~~~~

Once ``make install`` has been run, the virtual environment is ready to use. For more information on virtual environments see the Python documentation at https://docs.python.org/3/library/venv.html . The API Makefile contains a useful command to ensure that the version of the API installed to the virtual environment is up to date and start the virtual environment: ``make local-shell``. After running ``make local-shell``, the terminal in which you ran it is now in the virtual environment, and other Python scripts or applications started from that terminal will be able to see the Opentrons software.

In addition to running scripts that ``import opentrons``, the local installation makes it easy to run an API server locally on your machine. This is only important if you want to interact with the system the same way the opentrons app does; if you only want to test protocols, you can simply run the protocol in the virtual environment. To run the server, do ``make dev``.

Systemwide Setup
~~~~~~~~~~~~~~~~

Sometimes it can be inconvenient to activate a virtual environment and run things from it every time you want to use the API to simulate a protocol. This workflow is easier in that case, and is best used when you do not intend to modify the API. In that case, in addition to running ``make install``, we recommend that you check out the latest release of the API rather than using the ``edge`` branch. Instead, go to the root of the repository on GitHub at https://github.com/Opentrons/opentrons , click the branch dropdown, click the tags tab, and find the numerically highest tag, then check that out locally.

Once the most recent tag is checked out, in this directory run ``make wheel``. This command builds the API into an installable Python object. Then, in this directory run ``pip install dist/opentrons-*.whl``. This command installs the API on your system. Finally, set the environment variable ``ENABLE_VIRTUAL_SMOOTHIE=true``. This prevents the API from accessing your computer as it would the robot. If you see errors about the directory ``data``, it means you have not set the environment variable.

Once the API is installed and the environment variable is set, you should be able to ``import opentrons`` from anywhere on your system, including from inside Jupyter.
