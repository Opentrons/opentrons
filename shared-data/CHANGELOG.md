# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.



**Note:** Version bump only for package @opentrons/shared-data





## [3.18.1](https://github.com/Opentrons/opentrons/compare/v3.18.0...v3.18.1) (2020-05-26)

**Note:** Version bump only for package @opentrons/shared-data





# [3.18.0](https://github.com/Opentrons/opentrons/compare/v3.17.1...v3.18.0) (2020-05-20)


### Bug Fixes

* **protocol-designer:** fix multichannel well selection bug ([#5607](https://github.com/Opentrons/opentrons/issues/5607)) ([e20d645](https://github.com/Opentrons/opentrons/commit/e20d645))


### Features

* **api:** support thermocycler commands in executor ([#5557](https://github.com/Opentrons/opentrons/issues/5557)) ([b4ca09e](https://github.com/Opentrons/opentrons/commit/b4ca09e))
* **protocol-designer:** add 'mini' command creators for TC ([#5643](https://github.com/Opentrons/opentrons/issues/5643)) ([e6654a8](https://github.com/Opentrons/opentrons/commit/e6654a8)), closes [#5598](https://github.com/Opentrons/opentrons/issues/5598)





## [3.17.1](https://github.com/Opentrons/opentrons/compare/v3.17.0...v3.17.1) (2020-05-06)

### Bug Fixes

* **app-shell:** upgrade Electron, avoid hoisting dependencies, and fix devtools ([#5545](https://github.com/Opentrons/opentrons/issues/5545)) ([f993925](https://github.com/Opentrons/opentrons/commit/f993925)), closes [#5537](https://github.com/Opentrons/opentrons/issues/5537) [#5541](https://github.com/Opentrons/opentrons/issues/5541)


### Features

* **app:** guide the user through leveling gen2 multis ([#5348](https://github.com/Opentrons/opentrons/issues/5348)) ([185d0ad](https://github.com/Opentrons/opentrons/commit/185d0ad)), closes [#5344](https://github.com/Opentrons/opentrons/issues/5344)
* **shared-data:** add nest_96_wellplate_2ml_deep ([#5503](https://github.com/Opentrons/opentrons/issues/5503)) ([3002453](https://github.com/Opentrons/opentrons/commit/3002453))





# [3.17.0](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.1...v3.17.0) (2020-04-23)

**Note:** Version bump only for package @opentrons/shared-data





# [3.17.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.0...v3.17.0-beta.1) (2020-04-14)

**Note:** Version bump only for package @opentrons/shared-data





# [3.17.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.16.1...v3.17.0-beta.0) (2020-04-01)

### Bug Fixes

* **api:** return tips to tipracks from the same height as drop tip ([#5187](https://github.com/Opentrons/opentrons/issues/5187)) ([82187ed](https://github.com/Opentrons/opentrons/commit/82187ed)), closes [#5186](https://github.com/Opentrons/opentrons/issues/5186)
* **shared-data:** fix typo in v4 protocol schema ([#4997](https://github.com/Opentrons/opentrons/issues/4997)) ([2483b00](https://github.com/Opentrons/opentrons/commit/2483b00))


### Features

* **api:** add v4 JSON executor ([#5221](https://github.com/Opentrons/opentrons/issues/5221)) ([e81cb56](https://github.com/Opentrons/opentrons/commit/e81cb56))
* **api:** support gen2 modules ([#5039](https://github.com/Opentrons/opentrons/issues/5039)) ([fa7a320](https://github.com/Opentrons/opentrons/commit/fa7a320)), closes [#4960](https://github.com/Opentrons/opentrons/issues/4960)
* **app, components:** Support gen2 modules ([#5177](https://github.com/Opentrons/opentrons/issues/5177)) ([3a938ff](https://github.com/Opentrons/opentrons/commit/3a938ff)), closes [#4960](https://github.com/Opentrons/opentrons/issues/4960)
* **protocol-designer:** disambiguate module model vs type ([#5029](https://github.com/Opentrons/opentrons/issues/5029)) ([a1f4740](https://github.com/Opentrons/opentrons/commit/a1f4740)), closes [#4897](https://github.com/Opentrons/opentrons/issues/4897)
* **protocol-designer:** save v3/v4 files correctly ([#5100](https://github.com/Opentrons/opentrons/issues/5100)) ([53e8ddf](https://github.com/Opentrons/opentrons/commit/53e8ddf)), closes [#4919](https://github.com/Opentrons/opentrons/issues/4919)
* **shared-data:** correct existing labware defs engageHeight ([#5261](https://github.com/Opentrons/opentrons/issues/5261)) ([767054d](https://github.com/Opentrons/opentrons/commit/767054d)), closes [#5226](https://github.com/Opentrons/opentrons/issues/5226)





## [3.16.1](https://github.com/opentrons/opentrons/compare/v3.16.0...v3.16.1) (2020-02-25)

**Note:** Version bump only for package @opentrons/shared-data





# [3.16.0](https://github.com/Opentrons/opentrons/compare/v3.15.2...v3.16.0) (2020-02-19)

### Features

* **api:** add module def schema v2 and v2 defs ([#4805](https://github.com/Opentrons/opentrons/issues/4805)) ([4018254](https://github.com/Opentrons/opentrons/commit/4018254)), closes [#4222](https://github.com/Opentrons/opentrons/issues/4222)
* **api:** add p10m v1.6 ([#4722](https://github.com/Opentrons/opentrons/issues/4722)) ([c25c887](https://github.com/Opentrons/opentrons/commit/c25c887))
* **protocol-designer:** add commands for temperature step ([#4770](https://github.com/Opentrons/opentrons/issues/4770)) ([6aff0e8](https://github.com/Opentrons/opentrons/commit/6aff0e8))
* **protocol-designer:** Populate engageHeight field with previous values ([#4794](https://github.com/Opentrons/opentrons/issues/4794)) ([b68b52d](https://github.com/Opentrons/opentrons/commit/b68b52d)), closes [#4764](https://github.com/Opentrons/opentrons/issues/4764)
* **protocol-designer:** use immer in step generation ([#4769](https://github.com/Opentrons/opentrons/issues/4769)) ([7915393](https://github.com/Opentrons/opentrons/commit/7915393)), closes [#4697](https://github.com/Opentrons/opentrons/issues/4697)
* **shared-data:** add 20uL filter tiprack ([#4532](https://github.com/Opentrons/opentrons/issues/4532)) ([423da87](https://github.com/Opentrons/opentrons/commit/423da87))
* **shared-data:** add new v4 JSON protocol schema ([#4846](https://github.com/Opentrons/opentrons/issues/4846)) ([bd49812](https://github.com/Opentrons/opentrons/commit/bd49812)), closes [#4836](https://github.com/Opentrons/opentrons/issues/4836) [#4897](https://github.com/Opentrons/opentrons/issues/4897)





## [3.15.2](https://github.com/opentrons/opentrons/compare/v3.15.1...v3.15.2) (2019-12-17)


### Bug Fixes

* **labware:** "retire" eppendorf tiprack definitions ([#4526](https://github.com/Opentrons/opentrons/issues/4526)) ([ddc2800](https://github.com/Opentrons/opentrons/commit/ddc2800)), closes [#4518](https://github.com/Opentrons/opentrons/issues/4518)
* **shared-data:** require well(s) in labware schema ([#4621](https://github.com/Opentrons/opentrons/issues/4621)) ([4dcbff5](https://github.com/Opentrons/opentrons/commit/4dcbff5)), closes [#4506](https://github.com/Opentrons/opentrons/issues/4506)


### Features

* **protocol-designer:** reorganize step-generation ([#4531](https://github.com/Opentrons/opentrons/issues/4531)) ([125f06f](https://github.com/Opentrons/opentrons/commit/125f06f)), closes [#4301](https://github.com/Opentrons/opentrons/issues/4301)





## [3.15.1](https://github.com/Opentrons/opentrons/compare/v3.15.1...v3.15.1) (2019-12-09)

**Note:** Version bump only for package @opentrons/shared-data





# [3.15.0](https://github.com/Opentrons/opentrons/compare/v3.14.1...v3.15.0) (2019-12-05)



### Bug Fixes

* **api:** present loaded but unused pipettes and modules to rpc ([#4538](https://github.com/Opentrons/opentrons/issues/4538)) ([fe27ef7](https://github.com/Opentrons/opentrons/commit/fe27ef7))
* **shared-data:** increase GEN2 pipette plunger & drop tip current ([#4523](https://github.com/Opentrons/opentrons/issues/4523)) ([e6909b9](https://github.com/Opentrons/opentrons/commit/e6909b9))
* **api,shared-data:** fix gen2 multi positioning ([#4412](https://github.com/Opentrons/opentrons/issues/4412)) ([54be7f9](https://github.com/Opentrons/opentrons/commit/54be7f9))


### Features

* **api,shared-data:** support p20/300/1k single v2.1 ([#4392](https://github.com/Opentrons/opentrons/issues/4392)) ([e743d2b](https://github.com/Opentrons/opentrons/commit/e743d2b)), closes [#4389](https://github.com/Opentrons/opentrons/issues/4389)
* **protocol-designer:** render modules on deck ([#4309](https://github.com/Opentrons/opentrons/issues/4309)) ([20514f0](https://github.com/Opentrons/opentrons/commit/20514f0))
* **protocol-designer:** save/load protocols with modules in prepro PD ([#4419](https://github.com/Opentrons/opentrons/issues/4419)) ([2b98da2](https://github.com/Opentrons/opentrons/commit/2b98da2))





## [3.14.1](https://github.com/Opentrons/opentrons/compare/v3.14.0...v3.14.1) (2019-11-11)

**Note:** Version bump only for package @opentrons/shared-data





# [3.14.0](https://github.com/Opentrons/opentrons/compare/v3.13.2...v3.14.0) (2019-10-31)

### Bug Fixes

* **api,shared-data,labware-creator:** do not touch tip on troughs ([#4271](https://github.com/Opentrons/opentrons/issues/4271)) ([d7e76cd](https://github.com/Opentrons/opentrons/commit/d7e76cd)), closes [#4258](https://github.com/Opentrons/opentrons/issues/4258)
* **shared-data:** swap X/Y spacing for 24-well nest tuberacks ([#4240](https://github.com/Opentrons/opentrons/issues/4240)) ([34330ed](https://github.com/Opentrons/opentrons/commit/34330ed))

### Features

* **api:** Allow backwards compatibility with gen2 pipettes in apiv2 ([#4326](https://github.com/Opentrons/opentrons/issues/4326)) ([4609172](https://github.com/Opentrons/opentrons/commit/4609172))
* **app:** allow p1000 gen2 to fallback to specced p1000 gen1 ([#4316](https://github.com/Opentrons/opentrons/issues/4316)) ([0e33f65](https://github.com/Opentrons/opentrons/commit/0e33f65)), closes [#3598](https://github.com/Opentrons/opentrons/issues/3598)
* **shared-data:** add "GEN1" to gen 1 pipette display names ([#4313](https://github.com/Opentrons/opentrons/issues/4313)) ([cbdc814](https://github.com/Opentrons/opentrons/commit/cbdc814))
* **api:** deprecate api support for JSON v1/2 ([#4155](https://github.com/Opentrons/opentrons/issues/4155)) ([61361a8](https://github.com/Opentrons/opentrons/commit/61361a8)), closes [#4128](https://github.com/Opentrons/opentrons/issues/4128)
* **api:** v1: Add version specification to labware.load ([#4218](https://github.com/Opentrons/opentrons/issues/4218)) ([37060ce](https://github.com/Opentrons/opentrons/commit/37060ce)), closes [#4216](https://github.com/Opentrons/opentrons/issues/4216)
* **shared-data:** add NEST labware ([#4156](https://github.com/Opentrons/opentrons/issues/4156)) ([0d2491d](https://github.com/Opentrons/opentrons/commit/0d2491d))





## [3.13.2](https://github.com/Opentrons/opentrons/compare/v3.13.1...v3.13.2) (2019-10-10)

**Note:** Version bump only for package @opentrons/shared-data





## [3.13.1](https://github.com/Opentrons/opentrons/compare/v3.13.0...v3.13.1) (2019-10-09)


### Bug Fixes

* **api:** change trash definitions to avoid y head crash ([#4188](https://github.com/Opentrons/opentrons/issues/4188)) ([68b6201](https://github.com/Opentrons/opentrons/commit/68b6201))





# [3.13.0](https://github.com/Opentrons/opentrons/compare/v3.12.0...v3.13.0) (2019-10-02)

### Bug Fixes

* **api:** apiv2: Separate tip overlap per pipette ([#4106](https://github.com/Opentrons/opentrons/issues/4106)) ([1bac2a9](https://github.com/Opentrons/opentrons/commit/1bac2a9)), closes [#4103](https://github.com/Opentrons/opentrons/issues/4103)


### Features

* **api:** Explicit cmdline and jupyter entrypoints ([#4032](https://github.com/Opentrons/opentrons/issues/4032)) ([b534096](https://github.com/Opentrons/opentrons/commit/b534096))
* **api:** replace format with quirks for rectangular well behavior ([#4027](https://github.com/Opentrons/opentrons/issues/4027)) ([42deac2](https://github.com/Opentrons/opentrons/commit/42deac2)), closes [#3894](https://github.com/Opentrons/opentrons/issues/3894)
* **components, app:** add custom pipette select with category support ([#3996](https://github.com/Opentrons/opentrons/issues/3996)) ([47f0713](https://github.com/Opentrons/opentrons/commit/47f0713))
* **protocol-designer:** avoid use of labware "format" ([#4070](https://github.com/Opentrons/opentrons/issues/4070)) ([f8603a6](https://github.com/Opentrons/opentrons/commit/f8603a6)), closes [#3894](https://github.com/Opentrons/opentrons/issues/3894)





# [3.12.0](https://github.com/Opentrons/opentrons/compare/v3.11.4...v3.12.0) (2019-09-13)

### Bug Fixes

* **shared-data:** fix tipOvelap value for P20 tiprack ([#3990](https://github.com/Opentrons/opentrons/issues/3990)) ([9982ceb](https://github.com/Opentrons/opentrons/commit/9982ceb))


### Features

* **protocol-designer:** allow user to upload custom labware ([#3863](https://github.com/Opentrons/opentrons/issues/3863)) ([2dfe404](https://github.com/Opentrons/opentrons/commit/2dfe404))
* **shared-data:** add 24-well NEST tube racks ([#3916](https://github.com/Opentrons/opentrons/issues/3916)) ([eaa30dc](https://github.com/Opentrons/opentrons/commit/eaa30dc))
* **shared-data:** add NEST 96 PCR well plate 100 uL ([#3827](https://github.com/Opentrons/opentrons/issues/3827)) ([2a9a986](https://github.com/Opentrons/opentrons/commit/2a9a986))
* **shared-data:** add NEST 96 wellplate 200 uL Flat ([#3862](https://github.com/Opentrons/opentrons/issues/3862)) ([39835e9](https://github.com/Opentrons/opentrons/commit/39835e9))
* **shared-data:** add NEST conical tuberacks ([#3906](https://github.com/Opentrons/opentrons/issues/3906)) ([a39c3e7](https://github.com/Opentrons/opentrons/commit/a39c3e7))





## [3.11.4](https://github.com/Opentrons/opentrons/compare/v3.11.3...v3.11.4) (2019-08-29)

**Note:** Version bump only for package @opentrons/shared-data





## [3.11.3](https://github.com/Opentrons/opentrons/compare/v3.11.2...v3.11.3) (2019-08-28)

**Note:** Version bump only for package @opentrons/shared-data





## [3.11.2](https://github.com/Opentrons/opentrons/compare/v3.11.1...v3.11.2) (2019-08-21)

**Note:** Version bump only for package @opentrons/shared-data





## [3.11.1](https://github.com/Opentrons/opentrons/compare/v3.11.0...v3.11.1) (2019-08-21)

**Note:** Version bump only for package @opentrons/shared-data





# [3.11.0](https://github.com/Opentrons/opentrons/compare/v3.10.3...v3.11.0) (2019-08-21)


### Bug Fixes

* **shared-data:** fix "strict" arg for labware creation ([#3874](https://github.com/Opentrons/opentrons/issues/3874)) ([bd604e2](https://github.com/Opentrons/opentrons/commit/bd604e2))


### Features

* **app:** display TC on Deck Map ([#3786](https://github.com/Opentrons/opentrons/issues/3786)) ([272a6ad](https://github.com/Opentrons/opentrons/commit/272a6ad)), closes [#3553](https://github.com/Opentrons/opentrons/issues/3553) [#3064](https://github.com/Opentrons/opentrons/issues/3064)





<a name="3.10.3"></a>
## [3.10.3](https://github.com/Opentrons/opentrons/compare/v3.10.2...v3.10.3) (2019-07-26)

**Note:** Version bump only for package @opentrons/shared-data




<a name="3.10.2"></a>
## [3.10.2](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.2) (2019-07-25)


### Features

* **api:** Make blow out flow rate settable ([#3735](https://github.com/Opentrons/opentrons/issues/3735)) ([e12b4fd](https://github.com/Opentrons/opentrons/commit/e12b4fd)), closes [#3733](https://github.com/Opentrons/opentrons/issues/3733)
* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)
* **shared-data:** add displayCategory to pipetteNameSpecs and schema ([#3731](https://github.com/Opentrons/opentrons/issues/3731)) ([3b39dea](https://github.com/Opentrons/opentrons/commit/3b39dea))
* **shared-data:** labwareV2: add filter tip racks ([#3777](https://github.com/Opentrons/opentrons/issues/3777)) ([0dd5285](https://github.com/Opentrons/opentrons/commit/0dd5285))





<a name="3.10.1"></a>
## [3.10.1](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.1) (2019-07-19)


### Features

* **api:** Make blow out flow rate settable ([#3735](https://github.com/Opentrons/opentrons/issues/3735)) ([e12b4fd](https://github.com/Opentrons/opentrons/commit/e12b4fd)), closes [#3733](https://github.com/Opentrons/opentrons/issues/3733)
* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)
* **shared-data:** add displayCategory to pipetteNameSpecs and schema ([#3731](https://github.com/Opentrons/opentrons/issues/3731)) ([3b39dea](https://github.com/Opentrons/opentrons/commit/3b39dea))





<a name="3.10.0"></a>
# [3.10.0](https://github.com/Opentrons/opentrons/compare/v3.9.0...v3.10.0) (2019-07-15)


### Bug Fixes

* **api:** Fix gen2 model offsets ([#3614](https://github.com/Opentrons/opentrons/issues/3614)) ([dd1680a](https://github.com/Opentrons/opentrons/commit/dd1680a))
* **labware:** Fix generator well y calculation, update docs/schema ([#3697](https://github.com/Opentrons/opentrons/issues/3697)) ([31a2963](https://github.com/Opentrons/opentrons/commit/31a2963)), closes [#3602](https://github.com/Opentrons/opentrons/issues/3602)
* **shared_data:** Change deep well name, modify tipracks ([#3513](https://github.com/Opentrons/opentrons/issues/3513)) ([9c883d5](https://github.com/Opentrons/opentrons/commit/9c883d5))
* **shared_data:** Fix module path in shared data ([#3556](https://github.com/Opentrons/opentrons/issues/3556)) ([4742458](https://github.com/Opentrons/opentrons/commit/4742458))
* **shared-data:** patch some v2 labware from drawings ([#3623](https://github.com/Opentrons/opentrons/issues/3623)) ([84ecef1](https://github.com/Opentrons/opentrons/commit/84ecef1)), closes [#3618](https://github.com/Opentrons/opentrons/issues/3618)
* **shared-data:** patch v2 opentrons 15 and 50 mL tube racks ([#3712](https://github.com/Opentrons/opentrons/issues/3712)) ([66f1200](https://github.com/Opentrons/opentrons/commit/66f1200))


### Features

* **api:** Add a quirk for return tip height ([#3687](https://github.com/Opentrons/opentrons/issues/3687)) ([3a89b69](https://github.com/Opentrons/opentrons/commit/3a89b69))
* **api:** Add Gen2 multichannel pipette api support ([#3691](https://github.com/Opentrons/opentrons/issues/3691)) ([d1ae1ed](https://github.com/Opentrons/opentrons/commit/d1ae1ed))
* **api:** Add P50Sv1.5 ([#3689](https://github.com/Opentrons/opentrons/issues/3689)) ([6b42e6c](https://github.com/Opentrons/opentrons/commit/6b42e6c)), closes [#3680](https://github.com/Opentrons/opentrons/issues/3680)
* **api:** reference calibration data via hash of labware def ([#3498](https://github.com/Opentrons/opentrons/issues/3498)) ([0475586](https://github.com/Opentrons/opentrons/commit/0475586)), closes [#3493](https://github.com/Opentrons/opentrons/issues/3493)
* **api:** save labware under namespace/load_name/version ([#3487](https://github.com/Opentrons/opentrons/issues/3487)) ([400d6e6](https://github.com/Opentrons/opentrons/commit/400d6e6)), closes [#3474](https://github.com/Opentrons/opentrons/issues/3474)
* **app:** Get protocolDisplayData based on protocol schema ([#3531](https://github.com/Opentrons/opentrons/issues/3531)) ([ec69d84](https://github.com/Opentrons/opentrons/commit/ec69d84)), closes [#3494](https://github.com/Opentrons/opentrons/issues/3494)
* **labware:** update labware mapping ([#3636](https://github.com/Opentrons/opentrons/issues/3636)) ([a1e6005](https://github.com/Opentrons/opentrons/commit/a1e6005)), closes [#3605](https://github.com/Opentrons/opentrons/issues/3605)
* **labware:** zero out cornerOffsetFromSlot from all current v2 labware defs ([#3642](https://github.com/Opentrons/opentrons/issues/3642)) ([9b91298](https://github.com/Opentrons/opentrons/commit/9b91298))
* **labware-library:** show only the single latest version of a def ([#3552](https://github.com/Opentrons/opentrons/issues/3552)) ([f901a30](https://github.com/Opentrons/opentrons/commit/f901a30)), closes [#3551](https://github.com/Opentrons/opentrons/issues/3551)
* **protocol-designer:** migrate PD files to 3.0.0 ([#3606](https://github.com/Opentrons/opentrons/issues/3606)) ([10363ca](https://github.com/Opentrons/opentrons/commit/10363ca)), closes [#3337](https://github.com/Opentrons/opentrons/issues/3337)
* **protocol-designer:** save v3 protocols ([#3588](https://github.com/Opentrons/opentrons/issues/3588)) ([40f3a9e](https://github.com/Opentrons/opentrons/commit/40f3a9e)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336) [#3414](https://github.com/Opentrons/opentrons/issues/3414)
* **protocol-designer:** use labware def URIs ([#3526](https://github.com/Opentrons/opentrons/issues/3526)) ([6077eb8](https://github.com/Opentrons/opentrons/commit/6077eb8)), closes [#3455](https://github.com/Opentrons/opentrons/issues/3455)
* **protocol-designer:** use RobotWorkSpace for deck map ([#3479](https://github.com/Opentrons/opentrons/issues/3479)) ([9aa4eb6](https://github.com/Opentrons/opentrons/commit/9aa4eb6)), closes [#3327](https://github.com/Opentrons/opentrons/issues/3327)
* **shared-data:** add 1-well troughs and 96-well deep well plate ([#3570](https://github.com/Opentrons/opentrons/issues/3570)) ([f495ea1](https://github.com/Opentrons/opentrons/commit/f495ea1))
* **shared-data:** Add Corning 96 flat labware def ([#3625](https://github.com/Opentrons/opentrons/issues/3625)) ([af9e561](https://github.com/Opentrons/opentrons/commit/af9e561)), closes [#3619](https://github.com/Opentrons/opentrons/issues/3619)
* **shared-data:** display specific v2 labware as "retired" ([#3627](https://github.com/Opentrons/opentrons/issues/3627)) ([3fb5812](https://github.com/Opentrons/opentrons/commit/3fb5812))
* **shared-data:** make flow def for json protocol v3 ([#3571](https://github.com/Opentrons/opentrons/issues/3571)) ([9144193](https://github.com/Opentrons/opentrons/commit/9144193))
* **shared-data:** remove otId from all v2 labware and dependencies ([#3549](https://github.com/Opentrons/opentrons/issues/3549)) ([1766cb1](https://github.com/Opentrons/opentrons/commit/1766cb1)), closes [#3471](https://github.com/Opentrons/opentrons/issues/3471)





<a name="3.9.0"></a>
# [3.9.0](https://github.com/Opentrons/opentrons/compare/v3.8.3...v3.9.0) (2019-05-29)


### Features

* **api:** add pipette plus constructors ([#3407](https://github.com/Opentrons/opentrons/issues/3407)) ([f4feee9](https://github.com/Opentrons/opentrons/commit/f4feee9))
* **api:** Add pipette v2.0 config ([#3394](https://github.com/Opentrons/opentrons/issues/3394)) ([f7739b9](https://github.com/Opentrons/opentrons/commit/f7739b9))
* **api:** Enable Double Drop Quirk ([#3485](https://github.com/Opentrons/opentrons/issues/3485)) ([e864150](https://github.com/Opentrons/opentrons/commit/e864150))
* **api:** Make pipette quirks configurable ([#3463](https://github.com/Opentrons/opentrons/issues/3463)) ([3513794](https://github.com/Opentrons/opentrons/commit/3513794))
* **protocol-designer:** make "labware views" use new v2 labware components ([#3448](https://github.com/Opentrons/opentrons/issues/3448)) ([ec6598b](https://github.com/Opentrons/opentrons/commit/ec6598b))
* **repo:** change v2 labware len/width fields ([#3410](https://github.com/Opentrons/opentrons/issues/3410)) ([0ef0bd5](https://github.com/Opentrons/opentrons/commit/0ef0bd5))
* **shared-data:** add layers to deck schema and definitions ([#3385](https://github.com/Opentrons/opentrons/issues/3385)) ([d84cc35](https://github.com/Opentrons/opentrons/commit/d84cc35)), closes [#3325](https://github.com/Opentrons/opentrons/issues/3325)
* **shared-data:** add version, schemaVersion, and namespace keys to v2 labware ([#3469](https://github.com/Opentrons/opentrons/issues/3469)) ([da03025](https://github.com/Opentrons/opentrons/commit/da03025)), closes [#3454](https://github.com/Opentrons/opentrons/issues/3454)
* **shared-data:** deck component from physical data ([#3415](https://github.com/Opentrons/opentrons/issues/3415)) ([ddf9e78](https://github.com/Opentrons/opentrons/commit/ddf9e78)), closes [#3326](https://github.com/Opentrons/opentrons/issues/3326)


<a name="3.8.3"></a>
## [3.8.3](https://github.com/Opentrons/opentrons/compare/v3.8.2...v3.8.3) (2019-04-30)


### Features

* **api:** Add new 10ul tiprack ([#3393](https://github.com/Opentrons/opentrons/issues/3393)) ([a7c15cc](https://github.com/Opentrons/opentrons/commit/a7c15cc))



<a name="3.8.2"></a>
## [3.8.2](https://github.com/Opentrons/opentrons/compare/v3.8.1...v3.8.2) (2019-04-23)


### Bug Fixes

* **labware-library:** Take cornerOffsetFromSlot into account with render ([#3297](https://github.com/Opentrons/opentrons/issues/3297)) ([04a1ab8](https://github.com/Opentrons/opentrons/commit/04a1ab8))
* **shared-data:** fix v2 labware definition ([#3289](https://github.com/Opentrons/opentrons/issues/3289)) ([e652fb7](https://github.com/Opentrons/opentrons/commit/e652fb7)), closes [#3271](https://github.com/Opentrons/opentrons/issues/3271)


### Features

* **api:** Add Geometry Logic For Thermocycler Configurations ([#3266](https://github.com/Opentrons/opentrons/issues/3266)) ([4d8e463](https://github.com/Opentrons/opentrons/commit/4d8e463))
* **api:** add P10M 1.5 config data ([#3365](https://github.com/Opentrons/opentrons/issues/3365)) ([1332f63](https://github.com/Opentrons/opentrons/commit/1332f63))
* **api:** define & execute v3 json protocols ([#3312](https://github.com/Opentrons/opentrons/issues/3312)) ([988407d](https://github.com/Opentrons/opentrons/commit/988407d)), closes [#3110](https://github.com/Opentrons/opentrons/issues/3110)
* **api:** Set P10M1.5 pick up increment to 3mm ([#3374](https://github.com/Opentrons/opentrons/issues/3374)) ([f5b63d0](https://github.com/Opentrons/opentrons/commit/f5b63d0))
* **api:** validate JSON protocols before executing ([#3318](https://github.com/Opentrons/opentrons/issues/3318)) ([9c15f7d](https://github.com/Opentrons/opentrons/commit/9c15f7d)), closes [#3250](https://github.com/Opentrons/opentrons/issues/3250)
* **shared-data:** update P300M 1.5 pick up current to 0.9 A ([#3355](https://github.com/Opentrons/opentrons/issues/3355)) ([a2d9024](https://github.com/Opentrons/opentrons/commit/a2d9024))





<a name="3.8.1"></a>
## [3.8.1](https://github.com/Opentrons/opentrons/compare/v3.8.0...v3.8.1) (2019-03-29)


### Bug Fixes

* **api,shared-data:** Lowercase labware names and camelCase categories ([#3234](https://github.com/Opentrons/opentrons/issues/3234)) ([55e332e](https://github.com/Opentrons/opentrons/commit/55e332e)), closes [#3231](https://github.com/Opentrons/opentrons/issues/3231)
* **shared-data:** Ensure all volumes are µL; remove displayLengthUnits ([#3262](https://github.com/Opentrons/opentrons/issues/3262)) ([031f2b9](https://github.com/Opentrons/opentrons/commit/031f2b9)), closes [#3240](https://github.com/Opentrons/opentrons/issues/3240)
* **shared-data:** fix case of 'brand' text ([#3258](https://github.com/Opentrons/opentrons/issues/3258)) ([3dbe35a](https://github.com/Opentrons/opentrons/commit/3dbe35a))


### Features

* **api:** Add more pick up tip config elements to pipette config ([#3237](https://github.com/Opentrons/opentrons/issues/3237)) ([f69da42](https://github.com/Opentrons/opentrons/commit/f69da42))
* **api:** Add support for (p300m,p50m,p10s,p1000s)v1.5 ([#3265](https://github.com/Opentrons/opentrons/issues/3265)) ([9dfc127](https://github.com/Opentrons/opentrons/commit/9dfc127))
* **api:** Add support for p300s v1.5 ([#3276](https://github.com/Opentrons/opentrons/issues/3276)) ([e4ca4ff](https://github.com/Opentrons/opentrons/commit/e4ca4ff))
* **api:** move-to-slot JSON protocol command ([#3242](https://github.com/Opentrons/opentrons/issues/3242)) ([cef5123](https://github.com/Opentrons/opentrons/commit/cef5123))





<a name="3.8.0"></a>
# [3.8.0](https://github.com/Opentrons/opentrons/compare/v3.7.0...v3.8.0) (2019-03-19)


### Bug Fixes

* **api:** Fix mistakenly-changed pick up current for p10s1.4 ([#3155](https://github.com/Opentrons/opentrons/issues/3155)) ([7474752](https://github.com/Opentrons/opentrons/commit/7474752))
* **shared-data:** fix y axis svg value for fixed trash ([#3151](https://github.com/Opentrons/opentrons/issues/3151)) ([248f3ec](https://github.com/Opentrons/opentrons/commit/248f3ec))


### Features

* **api:** add pipette config endpoint ([#3128](https://github.com/Opentrons/opentrons/issues/3128)) ([b6b958b](https://github.com/Opentrons/opentrons/commit/b6b958b))





<a name="3.7.0"></a>
# [3.7.0](https://github.com/Opentrons/opentrons/compare/v3.6.5...v3.7.0) (2019-02-19)


### Bug Fixes

* **protocol-designer:** fix bug where 'default-values' shape did not conform to JSON schema ([#3032](https://github.com/Opentrons/opentrons/issues/3032)) ([6c86496](https://github.com/Opentrons/opentrons/commit/6c86496))
* **shared-data:** add tests to ensure filename matches name/loadName ([#2849](https://github.com/Opentrons/opentrons/issues/2849)) ([e821079](https://github.com/Opentrons/opentrons/commit/e821079))
* **shared-data:** fix irregular labware generator ([#2855](https://github.com/Opentrons/opentrons/issues/2855)) ([f405c8e](https://github.com/Opentrons/opentrons/commit/f405c8e))


### Features

* **api:** Add ability to use papi2 in protocol ([#2803](https://github.com/Opentrons/opentrons/issues/2803)) ([6bbb83c](https://github.com/Opentrons/opentrons/commit/6bbb83c))
* **api:** Add calibrate labware and tip probe with new protocol API ([#2846](https://github.com/Opentrons/opentrons/issues/2846)) ([3264cff](https://github.com/Opentrons/opentrons/commit/3264cff)), closes [#2719](https://github.com/Opentrons/opentrons/issues/2719)
* **api:** Add json protocol execution to new protocol API ([#2854](https://github.com/Opentrons/opentrons/issues/2854)) ([48bbcb1](https://github.com/Opentrons/opentrons/commit/48bbcb1)), closes [#2248](https://github.com/Opentrons/opentrons/issues/2248)
* **api:** Add skeleton of Thermocycler API class ([#3015](https://github.com/Opentrons/opentrons/issues/3015)) ([b42f318](https://github.com/Opentrons/opentrons/commit/b42f318)), closes [#2992](https://github.com/Opentrons/opentrons/issues/2992)
* **api:** api2: Move multichannel center for certain labwares ([#2900](https://github.com/Opentrons/opentrons/issues/2900)) ([dfb60a5](https://github.com/Opentrons/opentrons/commit/dfb60a5)), closes [#2892](https://github.com/Opentrons/opentrons/issues/2892)
* **api:** decrease plunger acceleration and add drop tip speed to config ([#2904](https://github.com/Opentrons/opentrons/issues/2904)) ([dc64b0d](https://github.com/Opentrons/opentrons/commit/dc64b0d))
* **api:** pipette config plunger position ([#2999](https://github.com/Opentrons/opentrons/issues/2999)) ([cbd559a](https://github.com/Opentrons/opentrons/commit/cbd559a))


### Performance Improvements

* **api:** New aspiration functions for all pipettes ([#3014](https://github.com/Opentrons/opentrons/issues/3014)) ([ae850ce](https://github.com/Opentrons/opentrons/commit/ae850ce)), closes [#3012](https://github.com/Opentrons/opentrons/issues/3012)





<a name="3.6.5"></a>
## [3.6.5](https://github.com/Opentrons/opentrons/compare/v3.6.4...v3.6.5) (2018-12-18)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.6.4"></a>
## [3.6.4](https://github.com/Opentrons/opentrons/compare/v3.6.3...v3.6.4) (2018-12-17)


### Performance Improvements

* **api:** Update P1000S aspirate function ([#2830](https://github.com/Opentrons/opentrons/issues/2830)) ([ca65283](https://github.com/Opentrons/opentrons/commit/ca65283))





<a name="3.6.3"></a>
## [3.6.3](https://github.com/Opentrons/opentrons/compare/v3.6.2...v3.6.3) (2018-12-13)


### Bug Fixes

* **api:** raise p300s droptip pose by 1mm to increase QC yield ([#2808](https://github.com/Opentrons/opentrons/issues/2808)) ([40759b2](https://github.com/Opentrons/opentrons/commit/40759b2))





<a name="3.6.2"></a>
## [3.6.2](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.2) (2018-12-11)


### Features

* **api:** p10 behavior feature flag ([#2794](https://github.com/Opentrons/opentrons/issues/2794)) ([c468b06](https://github.com/Opentrons/opentrons/commit/c468b06)), closes [#2792](https://github.com/Opentrons/opentrons/issues/2792)
* **shared-data:** Add more new labware definitions to shared-data ([#2703](https://github.com/Opentrons/opentrons/issues/2703)) ([9737196](https://github.com/Opentrons/opentrons/commit/9737196))





<a name="3.6.1"></a>
## [3.6.1](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.1) (2018-12-05)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.6.0"></a>
# [3.6.0](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.1...v3.6.0) (2018-11-29)


### Bug Fixes

* **shared-data:** fix total-liquid-volume of opentrons-tuberack-50ml ([#2744](https://github.com/Opentrons/opentrons/issues/2744)) ([aef8cc8](https://github.com/Opentrons/opentrons/commit/aef8cc8)), closes [#2743](https://github.com/Opentrons/opentrons/issues/2743)





<a name="3.6.0-beta.1"></a>
# [3.6.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.0...v3.6.0-beta.1) (2018-11-27)


### Bug Fixes

* **api:** re-position p1000 droptip/blowout positions ([#2681](https://github.com/Opentrons/opentrons/issues/2681)) ([f0cf01b](https://github.com/Opentrons/opentrons/commit/f0cf01b))


### Features

* **api:** Add 1.5ml tuberack to old labware definition section ([#2679](https://github.com/Opentrons/opentrons/issues/2679)) ([2739038](https://github.com/Opentrons/opentrons/commit/2739038))
* **api:** Adds pipette models v1.4 to robot config ([#2689](https://github.com/Opentrons/opentrons/issues/2689)) ([fd9c38a](https://github.com/Opentrons/opentrons/commit/fd9c38a))





<a name="3.6.0-beta.0"></a>
# [3.6.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.5.1...v3.6.0-beta.0) (2018-11-13)


### Features

* **api:** support offset in json protocol touch-tip command ([#2566](https://github.com/Opentrons/opentrons/issues/2566)) ([d54ee84](https://github.com/Opentrons/opentrons/commit/d54ee84))
* **shared-data:** Add generator function for irregular labware ([#2610](https://github.com/Opentrons/opentrons/issues/2610)) ([ad568c1](https://github.com/Opentrons/opentrons/commit/ad568c1)), closes [#2275](https://github.com/Opentrons/opentrons/issues/2275)
* **shared-data:** support unversioned pipettes in JSON protocols ([#2605](https://github.com/Opentrons/opentrons/issues/2605)) ([9e84ff6](https://github.com/Opentrons/opentrons/commit/9e84ff6))





<a name="3.5.1"></a>
# [3.5.1](https://github.com/Opentrons/opentrons/compare/v3.5.0...v3.5.1) (2018-10-26)


**Note:** Version bump only for package @opentrons/shared-data




<a name="3.5.0"></a>
# [3.5.0](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.1...v3.5.0) (2018-10-25)


### Bug Fixes

* **shared-data:** Fix corner offset from slot logic; add in container offset to well coordinates ([#2519](https://github.com/Opentrons/opentrons/issues/2519)) ([c79684b](https://github.com/Opentrons/opentrons/commit/c79684b))


### Features

* **api:** Add error checking on generated labware def ([#2476](https://github.com/Opentrons/opentrons/issues/2476)) ([242ffe4](https://github.com/Opentrons/opentrons/commit/242ffe4))





<a name="3.5.0-beta.1"></a>
# [3.5.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.0...v3.5.0-beta.1) (2018-10-16)


### Features

* **api:** Add labware load to protocol API ([#2472](https://github.com/Opentrons/opentrons/issues/2472)) ([bae6ef6](https://github.com/Opentrons/opentrons/commit/bae6ef6)), closes [#2240](https://github.com/Opentrons/opentrons/issues/2240)
* **api:** Add newly formatted labware defs and update labware schema ([#2457](https://github.com/Opentrons/opentrons/issues/2457)) ([690c0f2](https://github.com/Opentrons/opentrons/commit/690c0f2))
* **api:** Store pipette function params as data ([#2466](https://github.com/Opentrons/opentrons/issues/2466)) ([4e557dd](https://github.com/Opentrons/opentrons/commit/4e557dd))





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Features

* **shared-data:** Add generator function to create regular labware defs ([#2380](https://github.com/Opentrons/opentrons/issues/2380)) ([bc81574](https://github.com/Opentrons/opentrons/commit/bc81574))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)


### Bug Fixes

* **api:** Update the aluminum block definitions to match drawings ([#2342](https://github.com/Opentrons/opentrons/issues/2342)) ([4c1e4c2](https://github.com/Opentrons/opentrons/commit/4c1e4c2)), closes [#2292](https://github.com/Opentrons/opentrons/issues/2292)
* **protocol-designer:** fix bug with well access for rect wells ([#2296](https://github.com/Opentrons/opentrons/issues/2296)) ([309a8bf](https://github.com/Opentrons/opentrons/commit/309a8bf)), closes [#2081](https://github.com/Opentrons/opentrons/issues/2081)


### Features

* **protocol-designer:** modify well selection instructional text ([#2263](https://github.com/Opentrons/opentrons/issues/2263)) ([9ec91a4](https://github.com/Opentrons/opentrons/commit/9ec91a4)), closes [#2204](https://github.com/Opentrons/opentrons/issues/2204)





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Features

* **api:** Add new container defs to shared data ([#2225](https://github.com/Opentrons/opentrons/issues/2225)) ([20e2751](https://github.com/Opentrons/opentrons/commit/20e2751))
* **api:** Added min and max volume keywords to pipette constructors ([#2084](https://github.com/Opentrons/opentrons/issues/2084)) ([f68da5a](https://github.com/Opentrons/opentrons/commit/f68da5a)), closes [#2075](https://github.com/Opentrons/opentrons/issues/2075)





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)


### Bug Fixes

* **shared-data:** fix tube-rack-15_50ml labware def ([#2063](https://github.com/Opentrons/opentrons/issues/2063)) ([b32df5e](https://github.com/Opentrons/opentrons/commit/b32df5e))


### Features

* **api:** support flow rate (uL/sec) in JSON protocols ([#2123](https://github.com/Opentrons/opentrons/issues/2123)) ([b0f944e](https://github.com/Opentrons/opentrons/commit/b0f944e))
* **protocol-designer:** support mm from bottom offset in JSON protocols ([#2180](https://github.com/Opentrons/opentrons/issues/2180)) ([db22ae8](https://github.com/Opentrons/opentrons/commit/db22ae8)), closes [#2157](https://github.com/Opentrons/opentrons/issues/2157)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Features

* **api:** Consolidate pipette configuration ([#2055](https://github.com/Opentrons/opentrons/issues/2055)) ([ee39ea3](https://github.com/Opentrons/opentrons/commit/ee39ea3))





<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Features

* **components:** use labware defs from shared-data for Deck component ([26493f4](https://github.com/Opentrons/opentrons/commit/26493f4))
* **protocol-designer:** add form level validation errors and warnings ([#1823](https://github.com/Opentrons/opentrons/issues/1823)) ([9cdd66f](https://github.com/Opentrons/opentrons/commit/9cdd66f)), closes [#1090](https://github.com/Opentrons/opentrons/issues/1090) [#1595](https://github.com/Opentrons/opentrons/issues/1595) [#1592](https://github.com/Opentrons/opentrons/issues/1592) [#1594](https://github.com/Opentrons/opentrons/issues/1594)
* **shared-data:** annotate labware with format and other metadata ([9d4082d](https://github.com/Opentrons/opentrons/commit/9d4082d))





<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)

**Note:** Version bump only for package @opentrons/shared-data





<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)

**Note:** Version bump only for package @opentrons/shared-data
