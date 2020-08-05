.. _v2-versioning:

Versioning
==========

The OT-2 Python Protocol API has its own versioning system, which is separated from the version of the OT-2 software or of the Opentrons App. This separation allows you to specify the Protocol Api version your protocol requires without being concerned with what OT-2 software versions it will work with, and allows Opentrons to version the Python Protocol API based only on changes that affect protocols.

The API is versioned with a major and minor version, expressed like this: ``major.minor``. For instance, major version 2 and minor version 0 is written as ``2.0``. Versions are not decimal numbers. Major version 2 and minor version 10 is written as ``2.10``, while ``2.1`` means major version 2 and minor version 1.

Major and Minor Version
-----------------------

The major version of the API is increased whenever there are signficant structural or behavioral changes to protocols. For instance, major version 2 of the API was introduced because protocols must now have a ``run`` function that takes a ``protocol`` argument rather than importing the ``robot``, ``instruments``, and ``labware`` modules. A similar level of structural change would require a major version 3. Another major version bump would be if all of the default units switched to nanoliters instead of microliters (we won't do this, it's just an example). This major behavioral change would also require a major version 3.

The minor version of the API is increased whenever we add new functionality that might change the way a protocol is written, or when we want to make a behavior change to an aspect of the API but not the whole thing. For instance, if we added support for a new module, added an option for specifying volume units in the ``aspirate`` and ``dispense`` functions, or added a way to queue up actions from multiple different modules and execute them at the same time, we would increase the minor version of the API. Another minor version bump would be if we added automatic liquid level tracking, and the position at which the OT-2 aspirated from wells was now dynamic - some people might not want that change appearing suddenly in their well-tested protocol, so we would increase the minor version.



Expressing Versions
-------------------

You must specify the API version you are targeting at the top of your Python protocol. This is done in the ``metadata`` block, using the key ``'apiLevel'``:

.. code-block:: python

   from opentrons import protocol_api

   metadata = {
       'apiLevel': '2.2',
       'author': 'A. Biologist'}

   def run(protocol: protocol_api.ProtocolContext):
       pass


This key exists alongside the other elements of the metadata.

Version specification is required by the system. If you do not specify your target API version, you will not be able to simulate or run your protocol.

The version you specify determines the features and behaviors available to your protocol. For instance, if Opentrons adds the ability to set the volume units in a call to ``aspirate`` in version 2.1, then you must specify version 2.1 in your metadata. A protocol like this:


.. code-block:: python


   from opentrons import protocol_api

   metadata = {
       'apiLevel': '2.0',
       'author': 'A. Biologist'}

   def run(protocol: protocol_api.ProtocolContext):
       tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
       plate = protocol.load_labware('corning_96_wellplate_380ul', '2')
       left = protocol.load_instrument('p300_single', 'left', tip_racks=[tiprack])

       left.pick_up_tip()
       left.aspirate(volume=50000, location=plate['A1'], units='nanoliters')


would cause an error, because the ``units`` argument is not present in API version 2.0. This protects you from accidentally using features not present in your specified API version, and keeps your protocol portable between API versions.

In general, you should closely consider what features you need in your protocol, and keep your specified API level as low as possible. This makes your protocol work on a wider range of OT-2 software versions.


Determining What Version Is Available
-------------------------------------

Since version 3.15.0 of the OT-2 software and Opentrons App, the maximum supported API level of your OT-2 is visible in the Information card in the Opentrons App for your OT-2.

This maximum supported API level is the highest API level you can specify in a protocol. If you upload a protocol that specifies a higher API level than the OT-2 software supports, the OT-2 cannot simulate or run your protocol.


Determining What Features Are In What Version
---------------------------------------------

As you read the documentation on this site, you will notice that all documentation on features, function calls, available properties, and everything else about the Python Protocol API notes which API version it was introduced in. Keep this information in mind when specifying your protocol's API version. The version statement will look like this:

.. versionadded:: 2.0


.. _version-table:

API and OT-2 Software Versions
-------------------------------

This table lists the correspondence between Protocol API versions and robot software versions.

+-------------+-----------------------------+
| API Version | Introduced In OT-2 Software |
+=============+=============================+
|     1.0     |           3.0.0             |
+-------------+-----------------------------+
|     2.0     |          3.14.0             |
+-------------+-----------------------------+
|     2.1     |          3.15.2             |
+-------------+-----------------------------+
|     2.2     |          3.16.0             |
+-------------+-----------------------------+
|     2.3     |          3.17.0             |
+-------------+-----------------------------+
|     2.4     |          3.17.1             |
+-------------+-----------------------------+
|     2.5     |          3.19.0             |
+-------------+-----------------------------+
|     2.6     |          3.20.0             |
+-------------+-----------------------------+

Changes in API Versions
-----------------------

Version 2.1
+++++++++++

- You can now specify a label when loading labware into a module with the ``label`` parameter of
  :py:meth:`.ModuleContext.load_labware` just like you can when loading labware
  into your protocol with :py:meth:`.ProtocolContext.load_labware`.


Version 2.2
+++++++++++

- You should now specify magnetic module engage height using the
  ``height_from_base`` parameter, which specifies the height of the top of the
  magnet from the base of the labware. For more, see :ref:`magnetic-module-engage`.
- Return tip will now use pre-defined heights from hardware testing. For more information, see :ref:`pipette-return-tip`.
- When using the return tip function, tips are no longer added back into the tip tracker. For more information, see :ref:`pipette-return-tip`.


Version 2.3
+++++++++++

- Magnetic Modules GEN2 and Temperature Modules GEN2 are now supported; you can load them with the names ``"magnetic
  module gen2"`` and ``"temperature module gen2"``, respectively
- All pipettes will return tips to tipracks from a higher position to avoid
  possible collisions
- During a :ref:`mix`, the pipette will no longer move up to clear the liquid in
  between every dispense and following aspirate
- You can now access the temperature module's status via the ``status`` property of ```ModuleContext.TemperatureModuleContext```


Version 2.4
+++++++++++

- The following improvements were made to the `touch_tip` command:
    - The speed for `touch_tip` can now be lowered down to 1 mm/s
    - `touch_tip` no longer moves diagonally from the X direction -> Y direction
    - Takes into account geometry of the deck and modules


Version 2.5
+++++++++++

- New :ref:`new-utility-commands` were added:
    - :py:meth:`.ProtocolContext.set_rail_lights`: turns robot rail lights on or off
    - :py:obj:`.ProtocolContext.rail_lights_on`: describes whether or not the rail lights are on
    - :py:obj:`.ProtocolContext.door_closed`: describes whether the robot door is closed


Version 2.6
+++++++++++

- GEN2 Single pipettes now default to flow rates equivalent to 10 mm/s plunger
  speeds
    - Protocols that manually configure pipette flow rates will be unaffected
    - For a comparison between API Versions, see :ref:`defaults`
