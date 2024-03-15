:og:description: Define and set possible values for parameters in Opentrons Python protocols.

.. _defining-rtp:

*******************
Defining Parameters
*******************

.. dunno if this will be a named intro section or just some text at the top

Parameters all have:

- A ``variable_name`` for referencing in code.
- A ``display_name`` to label them in the Opentrons App or on the touchscreen.
- An optional ``description`` to provide more information about how the parameter will affect the execution of the protocol.
- A ``default`` value that the protocol will use if no changes are made during run setup.

Numeric and string parameters have additional attributes. See below.

The ``add_parameters()`` Function
=================================

Types of Parameters
===================

Boolean Parameters
------------------

Boolean parameters are ``True`` or ``False``. During setup, they appear as *On* or *Off*, respectively. 

Integer Parameters
------------------

Enter an integer within a range or choose from a list of options.

Float Parameters
----------------

Enter a floating point number within a range or choose from a list of options.


String Parameters
-----------------

Enumerated only. Choose from a list of predefined strings.


What to Parameterize
====================