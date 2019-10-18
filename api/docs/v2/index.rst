=============================================
Welcome to the OT-2 Python API Version 2 Docs
=============================================

The Opentrons API is a simple Python framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic Python and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

Version 2 of the OT-2 API is a new way to write Python protocols. It is more reliable, simpler, and better able to be supported. It is where support for new modules like the Thermocycler will be added, and where improvements and bugfixes will be focused. For more about why we developed version 2 of the OT-2 API, see ARTICLE LINK TO INTRO. For a guide on transitioning your protocols from API V1 to API V2, see ARTICLE LINK TO MIGRATION GUIDE. For a more in-depth discussion of why API V2 was developed and what is different about it, see ARTICLE ON DETAILS.

**********************

Getting Started
---------------

New to Python? Check out our :ref:`writing` page first before continuing. To get a sense of the typical structure of our scripts, take a look at our :ref:`new-examples` page.

Our API requires Python version 3.6.4 or later. Once this is set up on your computer, you can simply use `pip` to install the Opentrons package.

.. code-block:: shell

    pip install opentrons

To simulate protocols on your laptop, check out :ref:`simulate-block`. When you're ready to run your script on a robot, download our latest `desktop app`__

__ https://www.opentrons.com/ot-app

Troubleshooting
---------------

If you encounter problems using our products please take a look at our `support docs`__

__ https://support.opentrons.com/en/

or contact our team via intercom on our website at `opentrons.com`__

__ https://opentrons.com

Feature Requests
----------------

Have an interesting idea or improvement for our software? Create a ticket on github by following these `guidelines.`__

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#opening-issues

Developer's guide
-----------------

Do you want to contribute to our open-source API? You can find more information on how to be involved `here.`__

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md


.. toctree::

    writing
    apiv2index
