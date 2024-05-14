:og:description: Style and usage guidance for parameters in Opentrons Python protocols.

.. _rtp-style:

*********************
Parameter Style Guide
*********************

It's important to write clear names and descriptions when you :ref:`define parameters <defining-rtp>` in your protocols. Clarity improves the user experience for the technicians who run your protocols. They rely on your parameter names and descriptions to understand how the robot will function when running your protocol. 

Adopting the advice of this guide will help make your protocols clear, consistent, and ultimately easy to use. It also aligns them with protocols in the `Opentrons Protocol Library <https://library.opentrons.com>`_, which can help others access and replicate your science.

General Guidance
================

**Parameter names are nouns.** Parameters should be discrete enough that you can describe them in a single word or short noun phrase. ``display_name`` is limited to 30 characters, and you can add more context in the description. 

Don't ask questions or put other sentence punctuation in parameter names. For example:

.. list-table::

    * - ✅ Dry run
      - ❌ Dry run?
    * - ✅ Sample count
      - ❌ How many samples?
    * - ✅ Number of samples
      - ❌ Number of samples to process.
      
      
**Parameter descriptions explain actions.** In one or two clauses or sentences, state when and how the parameter value is used in the protocol. Don't merely restate the parameter name. 

Punctuate descriptions as sentences, even if they aren't complete sentences. For example:

.. list-table::
    :header-rows: 1
    :widths: 1 3

    * - Parameter name
      - Parameter description
    * - Dry run
      - 
        - ✅ Skip incubation delays and shorten mix steps.
        - ❌ Whether to do a dry run.
    * - Aspirate volume
      - 
        - ✅ How much to aspirate from each sample.
        - ❌ Volume that the pipette will aspirate
    * - Dilution factor
      - 
        - ✅ Each step uses this ratio of total liquid to original solution. Express the ratio as a decimal.
        - ❌ total/diluent ratio for the process

Not every parameter requires a description! For example, in a protocol that uses only one pipette, it would be difficult to explain a parameter named "Pipette type" without repeating yourself. In a protocol that offers parameters for two different pipettes, it may be useful to summarize what steps each pipette performs.
    
**Use sentence case for readability**. Sentence case means adding a capital letter to *only* the first word of the name and description. This gives your parameters a professional appearance. Keep proper names capitalized as they would be elsewhere in a sentence. For example:

.. list-table::

    * - ✅ Number of samples
      - ❌ number of samples
    * - ✅ Temperature Module slot
      - ❌ Temperature module slot
    * - ✅ Dilution factor
      - ❌ Dilution Factor

**Use numerals for all numbers.** In a scientific context, this includes single-digit numbers. Additionally, punctuate numbers according to the needs of your protocol's users. If you plan to share your protocol widely, consider using American English number punctuation (comma for thousands separator; period for decimal separator).

**Order choices logically.** Place items within the ``choices`` attribute in the order that makes sense for your application. 

Numeric choices should either ascend or descend. Consider an offset parameter with choices. Sorting according to value is easy to use in either direction, but sorting by absolute value is difficult:

.. list-table::

    * - ✅ -3, -2, -1, 0, 1, 2, 3
      - ❌ 0, 1, -1, 2, -2, 3, -3
    * - ✅ 3, 2, 1, 0, -1, -2, -3
      - 

String choices may have an intrinsic ordering. If they don't, fall back to alphabetical order.

.. list-table::
    :header-rows: 1

    * - Parameter name
      - Parameter description
    * - Liquid color
      - 
        - ✅ Red, Orange, Yellow, Green, Blue, Violet
        - ❌ Blue, Green, Orange, Red, Violet, Yellow
    * - Tube brand
      -
        - ✅ Eppendorf, Falcon, Generic, NEST
        - ❌ Falcon, NEST, Eppendorf, Generic

Type-Specific Guidance
======================

Booleans
--------

The ``True`` value of a Boolean corresponds to the word *On* and the ``False`` value corresponds to the word *Off*. 

**Avoid double negatives.** These are difficult to understand and may lead to a technician making an incorrect choice. Remember that negation can be part of a word's meaning! For example, it's difficult to reason about what will happen when a parameter named "Deactivate module" is set to "Off".

**When in doubt, clarify in the description.** If you feel like you need to add extra clarity to your Boolean choices, use the phrase "When on" or "When off" at the beginning of your description. For example, a parameter named "Dry run" could have the description "When on, skip protocol delays and return tips instead of trashing them."

Number Choices
--------------

**Don't repeat text in choices.** Rely on the name and description to indicate what the number refers to. It's OK to add units to the display names of numeric choices, because the ``unit`` attribute is ignored when you specify ``choices``.

.. list-table::
    :header-rows: 1

    * - Parameter name
      - Parameter description
    * - Number of columns
      - 
        - ✅ 1, 2, 3
        - ❌ 1 column, 2 columns, 3 columns
    * - Aspirate volume
      - 
        - ✅ 10 µL, 20 µL, 50 µL
        - ✅ Low (10 µL), Medium (20 µL), High (50 µL)
        - ❌ Low volume, Medium volume, High volume

**Use a range instead of choices when all values are acceptable.** It's faster and easier to enter a numeric value than to choose from a long list. For example, a "Number of columns" parameter that accepts any number 1 through 12 should specify a ``minimum`` and ``maximum``, rather than ``choices``. However, if the application requires that the parameter only accepts even numbers, you need to specify choices (2, 4, 6, 8, 10, 12).

Strings
-------

**Avoid strings that are synonymous with "yes" and "no".** When presenting exactly two string choices, consider their meaning. Can they be rephrased in terms of "yes/no", "true/false", or "on/off"? If no, then a string parameter is appropriate. If yes, it's better to use a Boolean, which appears in run setup as a toggle rather than a dropdown menu.

    - ✅ Blue, Red
    - ✅ Left-to-right, Right-to-left
    - ❌ Include, Exclude
    - ❌ Yes, No
