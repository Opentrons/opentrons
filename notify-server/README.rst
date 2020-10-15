=====================
Notification Server
=====================

Introduction
------------
The notification server is a pub/sub service for the OT2.


Development Environment
-----------------------------------
- `poetry <https://python-poetry.org>`_ is used as the package manager. Follow these `installation instructions <https://python-poetry.org/docs/#installation>`_.
- ``make setup`` will setup the project.
- ``make test`` will run the unit tests.
- ``make lint`` will run type checking and linting.
- ``make dev`` will run the server application locally in dev mode.

Project
-------
``notify_server`` is the root package and contains the following subpackages.

server
===============
The ``server`` package contains the server application.

clients
=======
The ``clients`` package has two clients: a subscriber and a publisher.

models
=======
The ``models`` package defines event models.