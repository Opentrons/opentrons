# Robot OS Changes from 3.16.1 to 3.17.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Bugfixes

- Module commands now respect pausing and cancelling. If you pause before a
  module command, the command will not occur until you resume, and if you cancel
  before or during a module command the protocol will be cancelled immediately
  ([#3529](https://github.com/opentrons/opentrons/issues/3529), [#2811](https://github.com/opentrons/opentrons/issues/2811))
- Fix an issue where variables defined in the file scope of your protocol (not
  in the run function) were not accessible to each other or to the run function
  ([#4981](https://github.com/opentrons/opentrons/issues/4981))
- Fix an issue where after a failed tip probe, the robot would move in a
  dangerous way when moving the pipette back to the front of the robot ([#4793](https://github.com/opentrons/opentrons/issues/4793))
- APIv2 protocols now return tips to tipracks from the same height as APIv1
  ([#5186](https://github.com/opentrons/opentrons/issues/5186)).  To get this
  behavior in your protocol, request API version 2.3 in your metadata.
- Fix a behavior where the pipette would move up and down in between mixes
  during mix() in APIv2
  ([#4640](https://github.com/opentrons/opentrons/issues/4640)). To get this
  behavior in your protocol, request API version 2.3 in your metadata.
- Fix an issue where the robot could not connect to WiFi networks with a colon
  character (':') in their name
- Fix an issue where the robot would be unable to move to tall labware (such as
  a 2 mL tube rack on top of a Temperature Module) even though there was enough
  physical space to do so 
  
## New Features

- Support upcoming GEN2 Multichannel pipettes
- Support upcoming GEN2 Magnetic Modules and Temperature Modules (API version 2.3)
- Support disconnecting from a WiFi network without selecting another network to
  connect to
- Support upcoming Protocol Designer releases that will support modules
- Introduce [Python Protocol API Version
  2.3](https://docs.opentrons.com/v2/versioning.html#version-2-3), which
  includes some behavior-altering bugfixes and support for GEN2 Magnetic and
  Temperature Modules.
