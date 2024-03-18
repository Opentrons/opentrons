:og:description: Define and customize parameters in Opentrons Python protocols.

.. _runtime-parameters:

******************
Runtime Parameters
******************

.. toctree::
    parameters/choosing
    parameters/defining
    parameters/using_values
    
..     parameters/use_case_sample_count
..     parameters/use_case_dry_run
..     parameters/style

Runtime parameters let you define user-customizable variables in your Python protocols. This gives you greater flexibility and puts extra control in the hands of the technician running the protocol — without forcing them to switch between lots of protocol files or write code themselves.

This section begins with the fundamentals of runtime parameters:

- :ref:`Defining parameters <defining-rtp>`: the syntax for setting up boolean, numeric, and string-based parameters.
- :ref:`Using parameter values <using-rtp>`: how and when to reference what the user has chosen.

It continues with a selection of use cases and some overall style guidance. When adding parameters to your protocol, you are in charge of the user experience when it comes time to set up the protocol! These pages outline best practices for making your protocols reliable and easy to use.

- Use case – sample count: Change behavior throughout a protocol based on how many samples you plan to process. Setting sample count exactly saves time, tips, and reagents.
- Use case – dry run: Test your protocol, instead of doing a live run, just by flipping a toggle.
- Style and usage: When you're a protocol author, you write code. When you're a parameter author, you write words. Follow this advice to make things as clear as possible for your protocol users/readers.