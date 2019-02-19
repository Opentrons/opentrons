.. _Full API Documentation: http://docs.opentrons.com

The Opentrons API is a simple framework designed to make writing automated biology lab protocols for the Opentrons OT-2 easy.

This package can be used to simulate protocols on your computer without connecting to a robot. Please refer to our `Full API Documentation`_ for detailed instructions on how to write and simulate your first protocol.

This package is now for use with the Opentrons OT-2 only. For the software needed to run an Opentrons OT-1, please see versions_.

.. _simulating:

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


.. _configuration:

Configuration
-------------

The module has a lot of configuration, some of which is only relevant when running on an actual robot, but some of which could be useful during simulation. When the module is first imported, it will try and write configuration files in ``~/.opentrons/config.json`` (``C:\Users\%USERNAME%\.opentrons\config.json`` on Windows). This contains mostly paths to other configuration files and directories, most of which will be in that folder. The location can be changed by setting the environment variable ``OT_API_CONFIG_DIR`` to another path. Inividual settings in the config file can be overridden by setting environment variables named like ``OT_API_${UPPERCASED_VAR_NAME}`` (for instance, to override the ``serial_log_file`` config element you could set the environment variable ``OT_API_SERIAL_LOG_FILE`` to a different path).


.. _versions:

Note On Versions
----------------

This API is for locally simulating protocols for the OT 2 without connecting to a robot. It no longer controls an OT 1.

`Version 2.5.2 <https://pypi.org/project/opentrons/2.5.2/>`_ was the final release of this API for the OT 1. If you want to download this API to use the OT 1, you should download it with

.. code-block:: shell

   pip install opentrons==2.5.2

For APIs between 2.5.2 and 3.7.0, there is no PyPI package available. Those APIs should be installed by cloning this repo and following the instructions in `the Development Setup section of CONTRIBUTING.md <https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#development-setup>`_ and `the API readme <https://github.com/Opentrons/opentrons/blob/edge/api/README.rst>`_.
