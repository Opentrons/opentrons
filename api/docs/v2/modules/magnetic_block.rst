.. _magnetic-block:

*****************************
Using a Magnetic Block Module
*****************************

.. note::
   Recommended for use with the Flex only. If you have an OT-2, see :ref:`magnetic-module`.

The Magnetic Block is an unpowered, 96-well plate that holds labware close to its high-strength neodymium magnets. It is suitable for many magnetic bead-based protocols, but does not move beads up or down in solution.

Because the Magnetic Block is unpowered, neither your robot nor the Opentrons App aware of this module. You control it via protocols that use the `Opentrons Flex Gripper <https://shop.opentrons.com/opentrons-flex-gripper-gen1/>`_ to move labware on and off the module. For example, this code loads a Magnetic Block in deck slot D1, stacks a well-plate on top of it, and then uses the Gripper to move the well plate to another deck slot::

    def run(protocol: protocol_api.ProtocolContext):
        
        # Load the Magnetic Block in deck slot D1
        mag_block = protocol.load_module(
          module_name='magneticBlockV1',
          location='D1')
        
        # Load a 96-well plate on the magnetic block
        well_plate = mag_block.load_labware(
          name="biorad_96_wellplate_200ul_pcr")
        
        # Use the gripper to move the well plate off the block
        protocol.move_labware(well_plate,
          new_location="B2",
          use_gripper=True)
        
After the ``load_module ()`` method loads labware into your protocol, it returns the :py:class:`~opentrons.protocol_api.MagneticBlockContext`.

For more information about using and moving labware with the Magnetic Block, see :ref:`Labware` and :ref:`Moving Labware`, respectively.
