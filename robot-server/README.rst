=======================
Opentrons OT-2 HTTP API
=======================

.. image:: https://badgen.net/travis/Opentrons/opentrons/edge
   :target: https://travis-ci.org/Opentrons/opentrons
   :alt: Build Status

.. image:: https://badgen.net/codecov/c/github/Opentrons/opentrons
   :target: https://codecov.io/gh/Opentrons/opentrons
   :alt: Coverage Status


Introduction
------------

This is the Opentrons HTTP Server, the webservice that runs the Opentrons OT-2. It contains endpoints for executing protocols, controlling the hardware, and various other small tasks and capabilities that the robot fulfills.

This document is about the structure and purpose of the source code of the HTTP Server.

Setting Up For Development
--------------------------

First, read the `top-level contributing guide section on setup <https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#environment-and-repository>`_. As that document states, once you have installed the prerequisites you can simply run ``make install`` in this subdirectory.


Configuration
-------------

The configuration is defined in this [json schema](./settings_schema.json) file. The default configuration is for the robot environment.

Besides the usual methods, environment variables can be defined in a dotenv file located in ``/data/robot.env`` on robot or ``~/.opentrons/robot.env`` (``C:\Users\%USERNAME%\.opentrons\robot.env`` on Windows). The location of the dotenv file can be customized by defining `OT_ROBOT_SERVER_DOT_ENV_PATH` environment variable.


Updating A Robot
----------------

Since the API server runs on a robot, we need to have easy ways of getting newly-built wheels to the robot and interacting with it in general. This is provided by the ``push-api`` target of the top-level makefile. To send an API to the robot, navigate to the top-level ``opentrons`` directory and run ``make push-api host=<robot ip>``. If you forget the ``host=`` part, the makefile will look for a robot connected via USB. Note that the update facility relies on the `update-server <https://github.com/Opentrons/opentrons/tree/edge/update-server>`_ running.

The top level makefile (and the API makefile) also have a target called ``term``, which will give you an SSH terminal in the robot. This is just a light skin over invoking SSH with some options that make it more tolerant about frequently-changing IP addresses. It also takes an argument: ``make term host=<robot ip>`` connects to a specific ip, and if you don’t specify ``host=`` the makefile will look for a robot connected via USB. Unlike ``push-api``, this command only needs the robot to be booted to function.


Tests and Linting
-----------------

All code changes should be accompanied by test changes as a rule of thumb.

Our tests live in ``tests/robot_server`` and are run with `pytest <https://docs.pytest.org/en/latest/>`_. Tests are run in CI on every pull request and on ``edge``; PRs will not be merged with failing tests.

Tests should be organized similarly to the organization of the module itself.

We use `PyLama <https://github.com/klen/pylama>`_ for lint checks, and `mypy <http://mypy-lang.org/>`_ for type-checking annotations. Both of these tools are run in the ``lint`` makefile target, and is run in CI; PRs will not be merged with failing lint. Usage of ``noqa`` to temporarily disable lint is discouraged, but if you need to please disable only a specific rule and leave a comment explaining exactly why. The same goes with ``type: ignore``.

New code should have appropriate type annotations, and refactors of old code should try to add type annotations. We’re flexible about the refactor part, though - if adding type annotations greatly expands the scope of a PR, it’s OK to not add them as long as you explain this in the PR message.
