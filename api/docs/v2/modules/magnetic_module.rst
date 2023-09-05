.. _magnetic-module:

***************
Magnetic Module
***************

.. note::
   The Magnetic Module is compatible with the OT-2 only. If you have a Flex, use the :ref:`magnetic-block`.

The Magnetic Module controls a set of permanent magnets which can move vertically to induce a magnetic field in the labware loaded on the module. 

The Magnetic Module is represented by a :py:class:`.MagneticModuleContext` object, which has methods for engaging (raising) and disengaging (lowering) its magnets.

The examples in this section apply to an OT-2 with a Magnetic Module GEN2 loaded in slot 6:

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        mag_mod = protocol.load_module(
          module_name='magnetic module gen2',
          location='6')
        plate = mag_mod.load_labware(
          name='nest_96_wellplate_100ul_pcr_full_skirt')

.. versionadded:: 2.3

Loading Labware
===============

Like with all modules, use the Magnetic Module’s :py:meth:`~.MagneticModuleContext.load_labware` method to specify what you will place on the module. The Magnetic Module supports 96-well PCR plates and deep well plates. For the best compatibility, use a labware definition that specifies how far the magnets should move when engaging with the labware. The following plates in the `Opentrons Labware Library <https://labware.opentrons.com/>`_ include this measurement:

.. list-table::
   :widths: 50 50
   :header-rows: 1

   * - Labware Name
     - API Load Name
   * - Bio-Rad 96 Well Plate 200 µL PCR
     - ``biorad_96_wellplate_200ul_pcr``
   * - NEST 96 Well Plate 100 µL PCR Full Skirt
     - ``nest_96_wellplate_100ul_pcr_full_skirt``
   * - NEST 96 Deep Well Plate 2mL
     - ``nest_96_wellplate_2ml_deep``
   * - Thermo Scientific Nunc 96 Well Plate 1300 µL
     - ``thermoscientificnunc_96_wellplate_1300ul``
   * - Thermo Scientific Nunc 96 Well Plate 2000 µL
     - ``thermoscientificnunc_96_wellplate_2000ul``
   * - USA Scientific 96 Deep Well Plate 2.4 mL
     - ``usascientific_96_wellplate_2.4ml_deep``

To check whether a custom labware definition specifies this measurement, load the labware and query its :py:attr:`~.Labware.magdeck_engage_height` property. If has a numerical value, the labware is ready for use with the Magnetic Module.

.. _magnetic-module-engage:

Engaging and Disengaging
========================

Raise and lower the module's magnets with the  :py:meth:`~.MagneticModuleContext.engage` and :py:meth:`~.MagneticModuleContext.disengage` functions, respectively.

If your loaded labware is fully compatible with the Magnetic Module, you can call ``engage()`` with no argument:

  .. code-block:: python

      mag_mod.engage()

  .. versionadded:: 2.0

This will move the magnets upward to the default height for the labware, which should be close to the bottom of the labware's wells. If your loaded labware doesn't specify a default height, this will raise an ``ExceptionInProtocolError``.

For certain applications, you may want to move the magnets to a different height. The recommended way is to use the ``height_from_base`` parameter, which represents the distance above the base of the labware (its lowest point, where it rests on the module). Setting ``height_from_base=0`` should move the tops of the magnets level with the base of the labware. Alternatively, you can use the ``offset`` parameter, which represents the distance above *or below* the labware's default position (close to the bottom of its wells). Like using ``engage()`` with no argument, this will raise an error if there is no default height for the loaded labware.

.. note::
    There is up to 1 mm of manufacturing variance across Magnetic Module units, so observe the exact position and adjust as necessary before running your protocol.

Here are some examples of where the magnets will move when using the different parameters in combination with the loaded NEST PCR plate, which specifies a default height of 20 mm:

  .. code-block:: python

      mag_mod.engage(height_from_base=13.5)  # 13.5 mm
      mag_mod.engage(offset=-2)              # 15.5 mm

Note that ``offset`` takes into account the fact that the magnets' home position is measured as −2.5 mm for GEN2 modules.

  .. versionadded:: 2.0
  .. versionchanged:: 2.2
     Added the ``height_from_base`` parameter.

When you need to retract the magnets back to their home position, call :py:meth:`~.MagneticModuleContext.disengage`. 

  .. code-block:: python

      mag_mod.disengage()  # -2.5 mm

.. versionadded:: 2.0

If at any point you need to check whether the magnets are engaged or not, use the :py:obj:`~.MagneticModuleContext.status` property. This will return either the string ``engaged`` or ``disengaged``, not the exact height of the magnets.

.. note:: 

    The OT-2 will not automatically deactivate the Magnetic Module at the end of a protocol. If you need to deactivate the module after a protocol is completed or canceled, use the Magnetic Module controls on the device detail page in the Opentrons App or run ``deactivate()`` in Jupyter notebook.
    
Changes with the GEN2 Magnetic Module
=====================================

The GEN2 Magnetic Module uses smaller magnets than the GEN1 version. This change helps mitigate an issue with the magnets attracting beads from their retracted position, but it also takes longer for the GEN2 module to attract beads. The recommended attraction time is 5 minutes for liquid volumes up to 50 µL and 7 minutes for volumes greater than 50 µL. If your application needs additional magnetic strength to attract beads within these timeframes, use the available `Adapter Magnets <https://support.opentrons.com/s/article/Adapter-magnets>`_.
