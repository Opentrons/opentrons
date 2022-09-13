# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.1.0-alpha.4](https://github.com/Opentrons/opentrons/compare/v6.1.0-beta.0...v6.1.0-alpha.4) (2022-09-13)

**Note:** Version bump only for package @opentrons/step-generation





# [6.1.0-beta.0](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.3...v6.1.0-beta.0) (2022-08-29)

**Note:** Version bump only for package @opentrons/step-generation



# [6.1.0-alpha.3](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.2...v6.1.0-alpha.3) (2022-08-19)

**Note:** Version bump only for package @opentrons/step-generation





# [6.1.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.1...v6.1.0-alpha.2) (2022-08-10)

**Note:** Version bump only for package @opentrons/step-generation





# [6.1.0-alpha.1](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.0...v6.1.0-alpha.1) (2022-08-05)

**Note:** Version bump only for package @opentrons/step-generation





# [6.1.0-alpha.0](https://github.com/Opentrons/opentrons/compare/v6.0.0...v6.1.0-alpha.0) (2022-08-03)


### Features

* **api, step-generation:** emit and ingest command keys ([#10885](https://github.com/Opentrons/opentrons/issues/10885)) ([4f81309](https://github.com/Opentrons/opentrons/commit/4f81309c4cc546cd36b90f637cd4be447ddd08a5))
* **engine:** thermocycler run profile ([#10921](https://github.com/Opentrons/opentrons/issues/10921)) ([8a70b53](https://github.com/Opentrons/opentrons/commit/8a70b53ed35d33951b130bb1299026f02cf81d7b))
* **step-generation:** deactivate heater shaker after timer finishes ([#10876](https://github.com/Opentrons/opentrons/issues/10876)) ([21cf672](https://github.com/Opentrons/opentrons/commit/21cf6728409857dfd645d6861cf85408c7bcc41f)), closes [#10875](https://github.com/Opentrons/opentrons/issues/10875)
* **step-generation, shared-data:** delete TC await profile complete command ([#11273](https://github.com/Opentrons/opentrons/issues/11273)) ([9654cf2](https://github.com/Opentrons/opentrons/commit/9654cf2c86f7908bf718053a5bbab222d6103a73)), closes [#11272](https://github.com/Opentrons/opentrons/issues/11272)





## [6.0.1](https://github.com/Opentrons/opentrons/compare/v6.0.0...v6.0.1) (2022-08-09)

**Note:** Version bump only for package @opentrons/step-generation





# [6.0.0](https://github.com/Opentrons/opentrons/compare/v5.0.2...v6.0.0) (2022-07-14)


### Features

* **protocol-designer:** add heater shaker module ([#9626](https://github.com/Opentrons/opentrons/issues/9626)) ([adc2692](https://github.com/Opentrons/opentrons/commit/adc26925464ea2358c3f981abe01acb0d143f216)), closes [#9560](https://github.com/Opentrons/opentrons/issues/9560)
* **protocol-designer:** add load liquid commands ([#9923](https://github.com/Opentrons/opentrons/issues/9923)) ([5b003f5](https://github.com/Opentrons/opentrons/commit/5b003f57ed224b69c2b133156c8685e3808e812b)), closes [#9702](https://github.com/Opentrons/opentrons/issues/9702)
* **protocol-designer:** add timeline error for tall labware east west of a heater shaker ([#10551](https://github.com/Opentrons/opentrons/issues/10551)) ([1e799d3](https://github.com/Opentrons/opentrons/commit/1e799d3d65a40080f346f8ac2f1e6e3e7196b564)), closes [#10444](https://github.com/Opentrons/opentrons/issues/10444)
* **protocol-designer:** hook up heater shaker command creator ([#9896](https://github.com/Opentrons/opentrons/issues/9896)) ([443afa1](https://github.com/Opentrons/opentrons/commit/443afa1edc22da4ec832d8fe429730cf12a18f48))
* **protocol-designer:** pipette step validation for H-S latch open ([#9928](https://github.com/Opentrons/opentrons/issues/9928)) ([cd65ccd](https://github.com/Opentrons/opentrons/commit/cd65ccd5c15b29d8619d5b43a43c6626e6059641)), closes [#9745](https://github.com/Opentrons/opentrons/issues/9745)
* **protocol-designer:** pipette step validation for H-S shaking ([#9933](https://github.com/Opentrons/opentrons/issues/9933)) ([5b52d68](https://github.com/Opentrons/opentrons/commit/5b52d68041cb72ecfa9422b1b01090a37b103ec7)), closes [#9752](https://github.com/Opentrons/opentrons/issues/9752)
* **protocol-designer, step-generation, shared-data:** rename trash labware id to match protocol engine usage ([#10132](https://github.com/Opentrons/opentrons/issues/10132)) ([2136030](https://github.com/Opentrons/opentrons/commit/21360302a0a67a544ebde9f114d5eb31d61af659)), closes [#10017](https://github.com/Opentrons/opentrons/issues/10017)
* **shared-data:** add H/S to deck definition, bump deck definition schema ([#10417](https://github.com/Opentrons/opentrons/issues/10417)) ([183a1ac](https://github.com/Opentrons/opentrons/commit/183a1acd2db56750148d59a6058345aa32618311))
* **step-generation:** add multi channel N/S access timeline error for heater shaker ([#10697](https://github.com/Opentrons/opentrons/issues/10697)) ([15f47dd](https://github.com/Opentrons/opentrons/commit/15f47dd0343536a05a45a750a7e48b1318ccc80e)), closes [#10448](https://github.com/Opentrons/opentrons/issues/10448)
* **step-generation:** raise timeline error when pipetting E/W of H-S with multi channel pipette ([#10681](https://github.com/Opentrons/opentrons/issues/10681)) ([3ea88a2](https://github.com/Opentrons/opentrons/commit/3ea88a260ebbfedc7c7fcda194ab5d37e1b22774)), closes [#10442](https://github.com/Opentrons/opentrons/issues/10442)
* **step-generation, protocol-designer:** add H-S timeline error when pipetting E-W with latch open ([#10566](https://github.com/Opentrons/opentrons/issues/10566)) ([3abafbd](https://github.com/Opentrons/opentrons/commit/3abafbd8f5b6463c67b47d14ecf6a371b8ce7bfa)), closes [#10510](https://github.com/Opentrons/opentrons/issues/10510)
* **step-generation, protocol-designer:** add JSON schema v6 support ([#9824](https://github.com/Opentrons/opentrons/issues/9824)) ([0c95a58](https://github.com/Opentrons/opentrons/commit/0c95a58c309ea8d901bbb9fac82f371c296fe1d4))
* **step-generation, protocol-designer:** generate error when pipetting NSEW of HS while shaking ([#10589](https://github.com/Opentrons/opentrons/issues/10589)) ([17c1b27](https://github.com/Opentrons/opentrons/commit/17c1b27dbdf30f6e42fac0e3e657d813d7eff57e)), closes [#10509](https://github.com/Opentrons/opentrons/issues/10509)
* **step-generation, protocol-designer:** hook up heater-shaker PD step form ([#9873](https://github.com/Opentrons/opentrons/issues/9873)) ([a44ecd7](https://github.com/Opentrons/opentrons/commit/a44ecd7694006e61947dc963e5842078bd7076ae)), closes [#9741](https://github.com/Opentrons/opentrons/issues/9741)





## [5.0.2](https://github.com/Opentrons/opentrons/compare/v5.0.1...v5.0.2) (2022-03-03)

**Note:** Version bump only for package @opentrons/step-generation





## [5.0.1](https://github.com/Opentrons/opentrons/compare/v5.0.0...v5.0.1) (2022-02-24)

**Note:** Version bump only for package @opentrons/step-generation





# [5.0.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0) (2022-02-16)

**Note:** Version bump only for package @opentrons/step-generation





# [4.7.0](https://github.com/Opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)


**Note:** Version bump only for package @opentrons/step-generation





## [4.6.2](https://github.com/Opentrons/opentrons/compare/v4.6.1...v4.6.2) (2021-09-30)

**Note:** Version bump only for package @opentrons/step-generation





## [4.6.1](https://github.com/Opentrons/opentrons/compare/v4.6.0...v4.6.1) (2021-09-28)

**Note:** Version bump only for package @opentrons/step-generation





# [4.6.0](https://github.com/Opentrons/opentrons/compare/v4.5.0...v4.6.0) (2021-09-27)

**Note:** Version bump only for package @opentrons/step-generation





# [4.5.0](https://github.com/Opentrons/opentrons/compare/v4.4.0...v4.5.0) (2021-08-03)


### Features

* **labware-creator:** export and import tiprack defs ([#7947](https://github.com/Opentrons/opentrons/issues/7947)) ([a90e66d](https://github.com/Opentrons/opentrons/commit/a90e66d191a47d2a92a839e9554b8610aac27603)), closes [#7696](https://github.com/Opentrons/opentrons/issues/7696) [#7697](https://github.com/Opentrons/opentrons/issues/7697)





# [4.4.0](https://github.com/Opentrons/opentrons/compare/v4.3.1...v4.4.0) (2021-06-16)

**Note:** Version bump only for package @opentrons/step-generation
