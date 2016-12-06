.. _setup:

================
Code Environment
================

Jupyter Code Environment
-----------------------------

Jupyter is an interactive programming environment that runs in the browser. Jupyter can support multiple programming languages but we will only be using it for Python 3.

Install Anaconda and Python 3
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To run Opentrons you will need to ensure you have Python 3 installed. We recommend you install `Anaconda`_ before going any further, this will install Python 3 for you. We recommend you use the `Graphical Installer` for `Python3.5`.

Install Jupyter
^^^^^^^^^^^^^^^

After Anaconda and Python 3 are installed, you can get started installing Jupyter by following the official `Jupyter Installation Guide`_.

Launch Jupyter Notebook App
^^^^^^^^^^^^^^^^^^^^^^^^^^^

With GUI -- *Reccomended for Beginners*:
  1. Install and open the Anaconda Navagator App you just downloaded.
  2. Click 'Launch' under Jupyter Notebook.
  3. A new Jupyter Notebook will open in a new browser window. 

In Terminal:
  1. Click on spotlight, type `terminal` to open a terminal window.
  2. Create and Enter the startup folder by typing `mkdir some_folder_name && cd some_folder_name`.
  3. Type `jupyter notebook` to launch the Jupyter Notebook App (it will appear in a new browser window or tab).

Programming in Jupyter Notebook: Hello World!
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When the Jupyter Notebook App is launched on your browser, follow these steps to open a `Notebook`

  1. Navigate towards the `New` dropdown menu button towards the top right hand side of the screen Jupyter Notebook App. 
  2. Click the `New` menu button and scroll down and click `python [conda root]`.

A new tab should open in your browser and you should have an empty text box.

  3. Type `print('hello world')` in the text box. 
  4. Scroll to the top menu bar and press they `play button >| ` to execute the code in the text box. This will cause Jupyter to execute the code in the text box and return you the computed result, which should be 'Hello World'.

Install Opentrons API
---------------------

Before running any code, you need to install the Opentrons API. 

If you are running Anaconda, open Anaconda Navigator. On Home screen click `Channels` and add `opentrons`. This will allow you to install `opentrons` package from our channel. 

In Jupyter click `Conda`. Find and install `opentrons` package. Make sure to check for updates!

If you are not using Anaconda copy and paste the following code into the first cell of your notebook. This only needs to be done the first time you use Jupyter, so feel free to comment it out after it successfully installs.

.. code-block:: bash
  
  !pip install --upgrade opentrons

After this step you should be able to run:

.. code-block:: bash

  import opentrons
  opentrons.__version__

Which should return the version of opentrons package installed.

If you made it this far without any errors then you are done! You should treat yourself well tonight and celebrate your successes generously!

If you want to learn more about Jupyter Notebook Navigation `check this out`_. 

.. _Anaconda: https://www.continuum.io/downloads

.. _Jupyter Installation Guide: http://jupyter.readthedocs.io/en/latest/install.html

.. _check this out: http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Notebook%20Basics.ipynb

Saving File to Run
---------------------

Our app supports python (.py) files and JSON files.  

.py File
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

You can download any jupyter notebook files as a .py file, and the app will ignore everything except the containers and commands.  


JSON File
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Old JSON files can still be run in 2.0, and still need their deck, head, ingredients and instruction section.  However, we recommend writing all protocols using our new API as they will enable you to do a lot more with the robot - don't hesitate to reach out if you have trouble translating your files!
