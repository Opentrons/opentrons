:og:description: Access parameter values in Opentrons Python protocols.

.. _using-rtp:

****************
Using Parameters
****************

Once you've :ref:`defined parameters <defining-rtp>`, their values are accessible anywhere within the ``run()`` function of your protocol.

The ``params`` Object
=====================

Protocols with parameters have a :py:obj:`.ProtocolContext.params` object, which contains the values of all parameters as set during run setup. Each attribute of ``params`` corresponds to the ``variable_name`` of a parameter.

For example, consider a protocol that defines the following three parameters:

- ``add_bool`` with ``variable_name="dry_run"``
- ``add_int`` with ``variable_name="sample_count"``
- ``add_float`` with ``variable_name="volume"``

Then ``params`` will gain three attributes: ``params.dry_run``, ``params.sample_count``, and ``params.volume``. You can use these attributes anywhere you want to access their values, including directly as arguments of methods.

.. code-block::

    if protocol.params.dry_run == False:
        pipette.mix(repetitions=10, volume=protocol.params.volume)

You can also save parameter values to variables with names of your choosing.

Parameter Types
===============

Each attribute of ``params`` has the type corresponding to its parameter definition. Keep in mind the parameter's type when using its value in different contexts.

Say you wanted to add a comment to the run log, stating how many samples the protocol will process. Since ``sample_count`` is an ``int``, you'll need to cast it to a ``str`` or the API will raise an error.

.. code-block::

    protocol.comment(
        "Processing " + str(protocol.params.sample_count) + " samples."
    )

Also be careful with ``int`` types when performing calculations: dividing an ``int`` by an ``int`` with the ``/`` operator always produces a ``float``, even if there is no remainder. The :ref:`sample count use case <use-case-sample-count>` converts a sample count to a column count by dividing by 8 — but it uses the ``//`` integer division operator, so the result can be used for creating ranges, slicing lists, and as ``int`` argument values without having to cast it in those contexts.

Limitations
===========

Since ``params`` is only available within the ``run()`` function, there are certain aspects of a protocol that parameter values can't affect. These include, but are not limited to the following:


.. list-table::
    :header-rows: 1

    * - Information
      - Location
    * - ``import`` statements
      - At the beginning of the protocol.
    * - Robot type (Flex or OT-2)
      - In the ``requirements`` dictionary.
    * - API version
      - In the ``requirements`` or ``metadata`` dictionary.
    * - Protocol name
      - In the ``metadata`` dictionary.
    * - Protocol description
      - In the ``metadata`` dictionary.
    * - Protocol author
      - In the ``metadata`` dictionary.
    * - Other runtime parameters
      - In the ``add_parameters()`` function.
    * - Non-nested function definitions
      - Anywhere outside of ``run()``.
