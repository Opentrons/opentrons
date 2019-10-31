.. _writing:

####################
Design with Python
####################

Writing protocols in Python requires some up-front design before seeing your liquid handling automation in action. At a high-level, writing protocols with the Opentrons API looks like:

1) Write a Python protocol
2) Test the code for errors
3) Repeat steps 1 & 2
4) Calibrate labware on robot
5) Run your protocol

These sets of documents aim to help you get the most out of steps 1 & 2, the "design" stage.

*******************************

********************
Python for Beginners
********************

If Python is new to you, we suggest going through a few simple tutorials to acquire a base understanding to build upon. The following tutorials are a great starting point for working with the Opentrons API (from `learnpython.org <http://www.learnpython.org/>`_):

1) `Hello World <http://www.learnpython.org/en/Hello%2C_World%21>`_
2) `Variables and Types <http://www.learnpython.org/en/Variables_and_Types>`_
3) `Lists <http://www.learnpython.org/en/Lists>`_
4) `Basic Operators <http://www.learnpython.org/en/Basic_Operators>`_
5) `Conditions <http://www.learnpython.org/en/Conditions>`_
6) `Loops <http://www.learnpython.org/en/Loops>`_
7) `Functions <http://www.learnpython.org/en/Functions>`_
8) `Dictionaries <http://www.learnpython.org/en/Dictionaries>`_

After going through the above tutorials, you should have enough of an understanding of Python to work with the Opentrons API and start designing your experiments!

*******************************

*******************
Working with Python
*******************

Currently, we recommend writing your protocols in one of two ways:

Text Editor
===========

Using a popular and free code editor, like `Sublime Text 3`__, is a common method for writing Python protocols. Download onto your computer, and you can now write and save Python scripts.

__ https://www.sublimetext.com/3

.. note::

    Make sure that when saving a protocol file, it ends with the ``.py`` file extension. This will ensure the App and other programs are able to properly read it.

    For example, ``my_protocol_file.py``

Jupyter Notebook
================

For a more interactive environment to write and debug using some of our API tools, we recommend using Jupyter Notebook. To begin, just install `Anaconda`__, which comes with Jupyter Notebook.

__ https://www.continuum.io/downloads

Once installed, launch Jupyter Notebook, and install the Opentrons API by doing the following:

1) Create a new Python notebook
2) Run the command ``!pip install --upgrade opentrons`` in a cell
3) Restart your notebook's Kernel, and API will be installed

.. note::

    Be sure to download the **Python 3.6 version** if Anaconda, and Python 2.7 will not work with the Opentrons API.
