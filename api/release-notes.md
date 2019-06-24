# Robot Software Changes from 3.8.3 to 3.9.0

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- There is a more accurate definition for Opentrons 1000ul tips. You can load it via `opentrons-tiprack-1000ul`
- Remove hard-coded smoothie timeouts to prevent issues with extremely long aspirations and dispenses.
- Added support for more upcoming pipette hardware revisions
- Enable pipette behavior settings to be configurable in the App

## Bug fixes

- Better support firmware updates

## Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction


[schema-v3]: https://github.com/Opentrons/opentrons/blob/edge/shared-data/protocol-json-schema/protocolSchemaV3.json
