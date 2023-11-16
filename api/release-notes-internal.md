For more details about this release, please see the full [technical change log][]. 

[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 1.1.0

## New Stuff In This Release

This is a tracking internal release coming off of the edge branch to contain rapid dev on new features for 7.1.0. Features will change drastically between successive alphas even over the course of the day. For this reason, these release notes will not be in their usual depth.

The biggest new features, however, are
- There is a new protocol API version, 2.16, which changes how the default trash is loaded and gates features like partial tip pickup and waste chute usage:
  - Protocols do not load a trash by default. To load the normal trash, load ``opentrons_1_trash_3200ml_fixed`` in slot ``A3``.
    - But also you can load it in any other edge slot if you want (columns 1 and 3).
  - Protocols can load trash chutes; the details of exactly how this works are still in flux.
  - Protocols can configure their 96 and 8 channel pipettes to pick up only a subset of tips using ``configure_nozzle_layout``.
- Support for json protocol V8 and command V8, which adds JSON protocol support for the above features.
- ODD support for rendering the above features in protocols
- ODD support for configuring the loaded deck fixtures like trash chutes
- Labware position check now uses the calibration probe (the same one used for pipette and module calibration) instead of a tip; this should increase the accuracy of LPC.
- Support for P1000S v3.6
- Updated liquid handling functions for all 96 channel pipettes

## Known Issues 

- The ``MoveToAddressableArea`` command will noop. This means that all commands that use the movable trash bin will not "move to the trash bin". The command will analyze successfully.
- The deck configuration on the robot is not persistent, this means that between boots of a robot, you must PUT a deck configuration on the robot via HTTP.
 
