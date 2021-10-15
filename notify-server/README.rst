=====================
Notification Server
=====================

Introduction
------------
The notification server is a pub/sub service for the OT2.


Development Environment
-----------------------------------
- `pipenv <https://github.com/pypa/pipenv>`_ is the package manager.
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
The ``clients`` package has two client implementations: a subscriber and a publisher.

Asyncio Publisher Client Example
........................

.. code-block:: python

    from datetime import datetime
    from notify_server.models.event import Event
    from notify_server.models.payload_type import UserData
    from notify_server.clients.publisher import create

    async def run():
        # Create the async publisher client
        pub = create("ipc:///tmp/notify-server")

        # Create a data event
        my_event = Event(
            createdOn=datetime.now(),
            publisher="my_publisher",
            data=UserData(data={
                "whatever_i_want": True
            })
        )

        # Publish an event
        await pub.send(topic="topic", event=my_event)

Publisher Client Example
........................

.. code-block:: python

    from datetime import datetime
    from notify_server.models.event import Event
    from notify_server.models.payload_type import UserData
    from notify_server.clients.publisher import create

    def run():
        # Create the async publisher client
        pub = create("ipc:///tmp/notify-server")

        # Create a data event
        my_event = Event(
            createdOn=datetime.now(),
            publisher="my_publisher",
            data=UserData(data={
                "whatever_i_want": True
            })
        )

        # Publish an event
        pub.send_nowait(topic="topic", event=my_event)


Subscriber Client Example
.........................

.. code-block:: python

    from notify_server.clients.subscriber import create

    async def run():
       # Create the async subscriber client.
       subscriber = create("tcp://localhost:5555",
                           ["topic"])

       # Use the async iterator interface to wait for events.
       async for e in subscriber:
           print(f"{e.event.createdOn}: topic={e.topic}, "
                 f"publisher={e.event.publisher}, data={e.event.data}")


Subscriber Application
......................
The ``notify_server.app_sub`` script is a useful application. It prints events from any number of topics to stdout.

To start from the command line:

.. code-block:: bash

   python -m notify_server.app_sub -s tcp://localhost:5555 topic1 topic2

models
=======
The ``models`` package defines event models.