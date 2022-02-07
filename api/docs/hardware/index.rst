=========================
OT-2 Hardware Control API
=========================

The Hardware Control API is a Python interface to the Opentrons hardware. It is intended for internal testing and is not version controlled. Please restrict use of this interface to what is absolutely necessary, and use only methods and attributes whose names do not begin with an underscore.

How To Get A Hardware Controller
================================

.. code:: python

    import asyncio
    from typing import cast
    from opentrons.hardware_control import ThreadManager, API
    from opentrons.types import Point, Mount
    from opentrons.hardware_control.types import Axis

    hardware: API = cast(API, ThreadManager(API.build_hardware_controller))
    # You can use the hardware object to call async methods. The cast is to
    # make VS Code or mypy understand those calls.
    asyncio.run(hardware.cache_instruments())  # search for instruments

    synch_hardware = hardware.sync  # type: ignore
    # You can use the synch_hardware object to call methods normally. Unfortunately
    # no tooling will understand this
    synch_hardware.cache_instruments()  # search for instruments

There's a lot here, and the following sections go into it.


Input Values, Typing, and Structure
===================================

The hardware control API is primarily intended for use by other parts of the Opentrons package and uses concepts like
`enums <https://docs.python.org/3.7/library/enum.html>`_ that are used elsewhere in the package and therefore imported
from other parts of the package. This is all in aid of having more structure, and having the way you use the
hardware control API be easy to verify and check. It's heavily recommended to use a development environment that
can infer requirements from the structure of the Opentrons package, like `VSCode <https://code.visualstudio.com/>`_. In
addition, using tools like `mypy <https://github.com/python/mypy>`_ (installable with ``pip install mypy``) on the
scripts you're developing can really help make sure those scripts work correctly the first time (though there are
some challenges to correct use of both, stemming from weird organization of the hardware control API).

If you import ``opentrons.types`` and ``opentrons.hardware_control.types`` you should have all of the definitions
necessary to interact with the hardware control API. For instance, ``opentrons.types`` provides ``Mount`` and ``Point``;
``opentrons.hardware_control.types`` provides ``CriticalPoint``, and ``Axis``.

You also need to import ``opentrons.hardware_control`` to get the ``API`` object itself (which has classmethods to
build it like ``build_hardware_controller``) and the ``ThreadManager`` class (which lets you run the hardware controller
in a different thread, and optionally access it using synchronous patterns).

Asyncio and Async/Await
=======================

All of the hardware controller methods that actually cause motion are defined with ``async def`` instead of just
``def``. This means that they are `coroutines <https://docs.python.org/3.7/library/asyncio-task.html#coroutines>`_
designed to work with Python's `asyncio <https://docs.python.org/3.7/library/asyncio.html>`_ structure.

Coroutines execute piece-by-piece instead of all at once, by doing chunks of work and then letting the system
decide what to do next. They are used when you want to do several tasks at once, and each task isn't that
computationally hard but does involve waiting for input from other systems - for instance, the normal example
is a webserver that has to serve many page requests but doesn't have to do much to actually build the page. In
our case, this API is async because it's used by a server that is async, and because talking to something over
a serial connection is another great example of when to use coroutines like this (the general term is IO-concurrency).

There are two key things to know about coroutines:
   - to execute the code in the coroutine, it's not enough to just call it; you have to ``await`` it
   - you can only ``await`` things when running in an async context, meaning inside a call to ``asyncio.run``

.. code:: python

    import asyncio

    async def say_hello():
        print("hello")

    hello()  # doesn't print hello

    async def run_async():
        hello()  # doesn't print hello
        await hello()  # prints hello

    asyncio.run(await hello())


This looks painful, because it is. It's a result of the API being written for use in other parts of the Opentrons
package.

It's also the best way to interact with the hardware control API. There is a way to interact with it where you
don't have to do this (see below) but using that ``SynchronousAdapter`` prevents tooling like ``mypy`` or the
built in analysis in Visual Studio Code from properly understanding how the hardware controller works. We, sadly,
recommend that test scripts use this, by

- Making the main function they run `async`
- calling that function with `asyncio.run` instead of calling it directly


Synchronous Adapters? Thread Managers? What?
============================================

There are two other ways to interact with the hardware controller, which both grow out of it being async and also
it not doing a good job of being async. Even though it's async, calls to the smoothie still take a long time (for
now). That means that even though everything is ``async def``, it can still block your code. This is the reason
behind the ``ThreadManager``. Creating a ``ThreadManager`` instead of an ``API`` object will run the API in an
``async.run`` call inside another thread. You can then treat the ``ThreadManager`` exactly like an ``API`` - call
all the same methods, access all the same attributes - and they will get moved between threads and work. The
downside is that no tooling understands this. You can get around this by annotating it as
in the example, and that's what the ``hardware: API = cast(API, ThreadManager(API.build_hardware_controller))``
call does. The part after the ``:`` tells tooling what it should treat the ``hardware``
object as, and the ``cast`` call (which does nothing at runtime) tells the tooling
"OK, ignore that this is actually a ``ThreadManager``".

If you want to ignore the ``async`` and ``await`` stuff, once you have a ``ThreadManager``
you can access the ``sync`` attribute. This gives you an instance of a class called
``SynchronousAdapter``, which wraps every call and access to the hardware control API and
makes them work like normal python method calls and attribute accesses. The downside is
that, for real this time with no workarounds, no tooling can handle this and you're kind
of on your own.


.. toctree::

    hc_api
