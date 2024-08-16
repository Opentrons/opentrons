:og:description: Define and customize parameters in Opentrons Python protocols.

.. _runtime-parameters:

******************
Runtime Parameters
******************

.. toctree::
    parameters/choosing
    parameters/defining
    parameters/using_values
    parameters/use_case_sample_count
    parameters/use_case_dry_run
    parameters/use_case_cherrypicking
    parameters/style

Runtime parameters let you define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol — without forcing them to switch between lots of protocol files or write code themselves.

This section begins with the fundamentals of runtime parameters:

- Preliminary advice on how to :ref:`choose good parameters <good-rtps>`, before you start writing code.
- The syntax for :ref:`defining parameters <defining-rtp>` with boolean, numeric, and string values.
- How to :ref:`use parameter values <using-rtp>` in your protocol, building logic and API calls that implement the technician's choices.

It continues with a selection of use cases and some overall style guidance. When adding parameters, you are in charge of the user experience when it comes time to set up the protocol! These pages outline best practices for making your protocols reliable and easy to use.

- :ref:`Use case – sample count <use-case-sample-count>`: Change behavior throughout a protocol based on how many samples you plan to process. Setting sample count exactly saves time, tips, and reagents.
- :ref:`Use case – dry run <use-case-dry-run>`: Test your protocol, rather than perform a live run, just by flipping a toggle.
- :ref:`Use case – cherrypicking <use-case-cherrypicking>`: Use a CSV file to specify locations and volumes for a simple cherrypicking protocol.
- :ref:`Style and usage <rtp-style>`: When you're a protocol author, you write code. When you're a parameter author, you write words. Follow this advice to make things as clear as possible for the technicians who will run your protocol.
