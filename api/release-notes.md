# Robot OS Changes from 3.17.1 to 3.18.1

For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Bugfixes

- Fixed a well access bug that was causing touch-tip to fail with labware that was on top of a module ([#5531][])
- Fixed protocol pause commands skipping if they preceded a delay command ([#4801][])

[#5531]: https://github.com/Opentrons/opentrons/issues/5531
[#4801]: https://github.com/Opentrons/opentrons/issues/5531

## New Features

- Added support for Thermocylers in Protocol Designer protocols ([#5557][])
- Switched the Robot Server's HTTP framework to [FastAPI][] ([#5590][])
  - This does not change the behavior of any endpoints, but it does add a few new ones!
  - You can now access the OpenAPI Spec of the robot's HTTP server at `http://${robot_ip_address}:31950/openapi.json`
  - You can now access documentation of the robot's HTTP server at `http://${robot_ip_address}:31950/redoc`

[#5557]: https://github.com/Opentrons/opentrons/pull/5557
[#5590]: https://github.com/Opentrons/opentrons/pull/5590
[fastapi]: https://fastapi.tiangolo.com/
