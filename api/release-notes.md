# Robot OS Changes from 3.16.0 to 3.16.1

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- [Pandas](https://pandas.pydata.org/) version 0.25.3 is now available on the OT-2
after it was incorrectly not included in 3.16.0.
- Fixed an issue where using tips after returning them would result in an error ([#5059](https://github.com/opentrons/opentrons/issues/5059))
- Fixed an issue where protocols would always simulate at the maximum protocol
  API level ([#5060](https://github.com/opentrons/opentrons/issues/5060))
