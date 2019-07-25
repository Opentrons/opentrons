# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.10.2"></a>
## [3.10.2](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.2) (2019-07-25)


### Features

* **shared-data:** labwareV2: add filter tip racks ([#3777](https://github.com/Opentrons/opentrons/issues/3777)) ([0dd5285](https://github.com/Opentrons/opentrons/commit/0dd5285))





<a name="3.10.1"></a>
## [3.10.1](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.1) (2019-07-19)

**Note:** Version bump only for package @opentrons/labware-library





<a name="3.10.0"></a>
# [3.10.0](https://github.com/Opentrons/opentrons/compare/v3.9.0...v3.10.0) (2019-07-15)


### Bug Fixes

* **labware:** Fix generator well y calculation, update docs/schema ([#3697](https://github.com/Opentrons/opentrons/issues/3697)) ([31a2963](https://github.com/Opentrons/opentrons/commit/31a2963)), closes [#3602](https://github.com/Opentrons/opentrons/issues/3602)


### Features

* **labware:** update labware mapping ([#3636](https://github.com/Opentrons/opentrons/issues/3636)) ([a1e6005](https://github.com/Opentrons/opentrons/commit/a1e6005)), closes [#3605](https://github.com/Opentrons/opentrons/issues/3605)
* **labware:** zero out cornerOffsetFromSlot from all current v2 labware defs ([#3642](https://github.com/Opentrons/opentrons/issues/3642)) ([9b91298](https://github.com/Opentrons/opentrons/commit/9b91298))
* **labware-library:** show only the single latest version of a def ([#3552](https://github.com/Opentrons/opentrons/issues/3552)) ([f901a30](https://github.com/Opentrons/opentrons/commit/f901a30)), closes [#3551](https://github.com/Opentrons/opentrons/issues/3551)
* **protocol-designer:** migrate PD files to 3.0.0 ([#3606](https://github.com/Opentrons/opentrons/issues/3606)) ([10363ca](https://github.com/Opentrons/opentrons/commit/10363ca)), closes [#3337](https://github.com/Opentrons/opentrons/issues/3337)
* **shared-data:** add 1-well troughs and 96-well deep well plate ([#3570](https://github.com/Opentrons/opentrons/issues/3570)) ([f495ea1](https://github.com/Opentrons/opentrons/commit/f495ea1))
* **shared-data:** Add Corning 96 flat labware def ([#3625](https://github.com/Opentrons/opentrons/issues/3625)) ([af9e561](https://github.com/Opentrons/opentrons/commit/af9e561)), closes [#3619](https://github.com/Opentrons/opentrons/issues/3619)
* **shared-data:** remove otId from all v2 labware and dependencies ([#3549](https://github.com/Opentrons/opentrons/issues/3549)) ([1766cb1](https://github.com/Opentrons/opentrons/commit/1766cb1)), closes [#3471](https://github.com/Opentrons/opentrons/issues/3471)





<a name="3.9.0"></a>
# [3.9.0](https://github.com/Opentrons/opentrons/compare/v3.8.3...v3.9.0) (2019-05-29)


### Features

* **components:** dynamic props for Labware component ([#3408](https://github.com/Opentrons/opentrons/issues/3408)) ([ab83662](https://github.com/Opentrons/opentrons/commit/ab83662)), closes [#3328](https://github.com/Opentrons/opentrons/issues/3328)
* **repo:** change v2 labware len/width fields ([#3410](https://github.com/Opentrons/opentrons/issues/3410)) ([0ef0bd5](https://github.com/Opentrons/opentrons/commit/0ef0bd5))
* **shared-data:** add version, schemaVersion, and namespace keys to v2 labware ([#3469](https://github.com/Opentrons/opentrons/issues/3469)) ([da03025](https://github.com/Opentrons/opentrons/commit/da03025)), closes [#3454](https://github.com/Opentrons/opentrons/issues/3454)
* **shared-data:** deck component from physical data ([#3415](https://github.com/Opentrons/opentrons/issues/3415)) ([ddf9e78](https://github.com/Opentrons/opentrons/commit/ddf9e78)), closes [#3326](https://github.com/Opentrons/opentrons/issues/3326)


<a name="3.8.3"></a>
## [3.8.3](https://github.com/Opentrons/opentrons/compare/v3.8.2...v3.8.3) (2019-04-30)

**Note:** Version bump only for package @opentrons/labware-library


<a name="3.8.2"></a>
## [3.8.2](https://github.com/Opentrons/opentrons/compare/v3.8.1...v3.8.2) (2019-04-23)


### Bug Fixes

* **labware-library:** Take cornerOffsetFromSlot into account with render ([#3297](https://github.com/Opentrons/opentrons/issues/3297)) ([04a1ab8](https://github.com/Opentrons/opentrons/commit/04a1ab8))





<a name="3.8.1"></a>
## [3.8.1](https://github.com/Opentrons/opentrons/compare/v3.8.0...v3.8.1) (2019-03-29)


### Bug Fixes

* **shared-data:** Ensure all volumes are µL; remove displayLengthUnits ([#3262](https://github.com/Opentrons/opentrons/issues/3262)) ([031f2b9](https://github.com/Opentrons/opentrons/commit/031f2b9)), closes [#3240](https://github.com/Opentrons/opentrons/issues/3240)
