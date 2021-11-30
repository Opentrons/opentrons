# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0-beta.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0-beta.0) (2021-11-30)


### Bug Fixes

* **labware-library:** Default opentrons tuberack inserts to brand opentrons ([#8644](https://github.com/Opentrons/opentrons/issues/8644)) ([1f0d8c0](https://github.com/Opentrons/opentrons/commit/1f0d8c0537e4b72d3313e2de5bc5bbbe897574a3)), closes [#8248](https://github.com/Opentrons/opentrons/issues/8248)





# [4.7.0](https://github.com/Opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)


### Features

* **app:** Add Labware Detail with Well Row/Column Highlighting ([#8499](https://github.com/Opentrons/opentrons/issues/8499)) ([158c0bb](https://github.com/Opentrons/opentrons/commit/158c0bbcfa9dc0a0af0acd9e5b24d76853ad913d)), closes [#8380](https://github.com/Opentrons/opentrons/issues/8380)







**Note:** Version bump only for package @opentrons/labware-library





## [4.6.2](https://github.com/Opentrons/opentrons/compare/v4.6.1...v4.6.2) (2021-09-30)

**Note:** Version bump only for package @opentrons/labware-library





## [4.6.1](https://github.com/Opentrons/opentrons/compare/v4.6.0...v4.6.1) (2021-09-28)

**Note:** Version bump only for package @opentrons/labware-library





# [4.6.0](https://github.com/Opentrons/opentrons/compare/v4.5.0...v4.6.0) (2021-09-27)


### Bug Fixes

* **labware-creator:** fix bad syntax in tip rack protocol ([#8171](https://github.com/Opentrons/opentrons/issues/8171)) ([9468633](https://github.com/Opentrons/opentrons/commit/9468633a2eb5c3ee8388f4f83427635b5f32199b))
* **labware-creator:** fix readonly option type error ([#8306](https://github.com/Opentrons/opentrons/issues/8306)) ([463fb70](https://github.com/Opentrons/opentrons/commit/463fb70a65f3fbb0968b7056c5323dd19ea11238)), closes [#7972](https://github.com/Opentrons/opentrons/issues/7972)





# [4.5.0](https://github.com/Opentrons/opentrons/compare/v4.4.0...v4.5.0) (2021-08-03)


### Bug Fixes

* **labware-creator:** add margin to bottom of LC ([#8034](https://github.com/Opentrons/opentrons/issues/8034)) ([eeace5b](https://github.com/Opentrons/opentrons/commit/eeace5b3f3f953e10c2052e645a7f1551d99a24f)), closes [#8027](https://github.com/Opentrons/opentrons/issues/8027)
* **labware-creator:** reduce spacing btw tube brand + rack brand ([#8144](https://github.com/Opentrons/opentrons/issues/8144)) ([d67f0f9](https://github.com/Opentrons/opentrons/commit/d67f0f9f3e7adb49aaf450c6368ed99ecda72a20)), closes [#8140](https://github.com/Opentrons/opentrons/issues/8140)
* **labware-creator:** remove extra margin btw p's of "Custom Tip Racks Are Not Recommended" section ([#8047](https://github.com/Opentrons/opentrons/issues/8047)) ([4be5bc0](https://github.com/Opentrons/opentrons/commit/4be5bc00b7db5958238e53ad7738af31a046fca0))
* **labware-creator:** simplify autofill and fix bugs ([#8143](https://github.com/Opentrons/opentrons/issues/8143)) ([e6e3d9c](https://github.com/Opentrons/opentrons/commit/e6e3d9c95cfcb4577472d82bb896f92885e2f92a))


### Features

* **labware-creator:** add custom copy for tip rack volume section ([#7899](https://github.com/Opentrons/opentrons/issues/7899)) ([d7bf804](https://github.com/Opentrons/opentrons/commit/d7bf80428befb71e1b468145437914e98d4409d6)), closes [#7717](https://github.com/Opentrons/opentrons/issues/7717)
* **labware-creator:** add dynamic height copy for tip racks ([#7869](https://github.com/Opentrons/opentrons/issues/7869)) ([781cc8b](https://github.com/Opentrons/opentrons/commit/781cc8bf8a961166a9cafd76b7d31bb674f7e7f0)), closes [#7716](https://github.com/Opentrons/opentrons/issues/7716)
* **labware-creator:** add python labware test protocols ([#7998](https://github.com/Opentrons/opentrons/issues/7998)) ([50d78bc](https://github.com/Opentrons/opentrons/commit/50d78bca2e9426fd153f8a7f77f66fee24cb2218))
* **labware-creator:** add tiprack test file to export section ([#8018](https://github.com/Opentrons/opentrons/issues/8018)) ([311e1b2](https://github.com/Opentrons/opentrons/commit/311e1b26bbb781645cfa4793562ad0a0890a884f)), closes [#7166](https://github.com/Opentrons/opentrons/issues/7166)
* **labware-creator:** added multichannel compatibility to protocol ([#8093](https://github.com/Opentrons/opentrons/issues/8093)) ([645e633](https://github.com/Opentrons/opentrons/commit/645e633d9e47819733d536442d18030071f9ba21))
* **labware-creator:** added tube brand and rack brand ([#8082](https://github.com/Opentrons/opentrons/issues/8082)) ([22ee36f](https://github.com/Opentrons/opentrons/commit/22ee36f79129b04d2588ae72a173ea1eb1253a12)), closes [#7986](https://github.com/Opentrons/opentrons/issues/7986)
* **labware-creator:** allow dynamic field labels via getLabel ([#8062](https://github.com/Opentrons/opentrons/issues/8062)) ([4960d97](https://github.com/Opentrons/opentrons/commit/4960d9779005d5274a1dbb2d07e9349d5340e4f6)), closes [#7974](https://github.com/Opentrons/opentrons/issues/7974)
* **labware-creator:** change preview text to reflect labware type ([#8031](https://github.com/Opentrons/opentrons/issues/8031)) ([94a5395](https://github.com/Opentrons/opentrons/commit/94a539597855f31a10f82fbf2200b4fe6f406152))
* **labware-creator:** change tube rack inserts for custom tubes ([#8060](https://github.com/Opentrons/opentrons/issues/8060)) ([f51ec8d](https://github.com/Opentrons/opentrons/commit/f51ec8da9c853b3fd9d7a8e76b708f3909459ab2)), closes [#7969](https://github.com/Opentrons/opentrons/issues/7969)
* **labware-creator:** export and import tiprack defs ([#7947](https://github.com/Opentrons/opentrons/issues/7947)) ([a90e66d](https://github.com/Opentrons/opentrons/commit/a90e66d191a47d2a92a839e9554b8610aac27603)), closes [#7696](https://github.com/Opentrons/opentrons/issues/7696) [#7697](https://github.com/Opentrons/opentrons/issues/7697)
* **labware-creator:** grid offset update for tube racks ([#8071](https://github.com/Opentrons/opentrons/issues/8071)) ([f332849](https://github.com/Opentrons/opentrons/commit/f332849cdaaceb174c7aae0d0365c8276e4afde8)), closes [#7984](https://github.com/Opentrons/opentrons/issues/7984)
* **labware-creator:** implement and test saving custom tube racks ([#8089](https://github.com/Opentrons/opentrons/issues/8089)) ([2f6f7e0](https://github.com/Opentrons/opentrons/commit/2f6f7e0c313a9ef9a0d04da67aa8e05e579ca916)), closes [#7964](https://github.com/Opentrons/opentrons/issues/7964)
* **labware-creator:** make dynamic wells/tips copy in Grid section ([#8019](https://github.com/Opentrons/opentrons/issues/8019)) ([9738d9c](https://github.com/Opentrons/opentrons/commit/9738d9c95d1f75a9596ce01b04359af9bdc7dc56))
* **labware-creator:** make error copy "is required" not "must be a number" ([#8038](https://github.com/Opentrons/opentrons/issues/8038)) ([9afc2dd](https://github.com/Opentrons/opentrons/commit/9afc2dd4ffb382e18fd770845430dda1b6562399)), closes [#8026](https://github.com/Opentrons/opentrons/issues/8026)
* **labware-creator:** refactored paused before tip pick up ([#8029](https://github.com/Opentrons/opentrons/issues/8029)) ([40cd5a3](https://github.com/Opentrons/opentrons/commit/40cd5a32acf0a44c9c9ff561f5450d1edc2f5a97))
* **labware-creator:** remove text saying tipracks not supported in LC ([#7971](https://github.com/Opentrons/opentrons/issues/7971)) ([64011e0](https://github.com/Opentrons/opentrons/commit/64011e000c9f4ab972075ac3a0d06ea43ce42d8f))
* **labware-creator:** show Grid section for custom tube racks ([#8068](https://github.com/Opentrons/opentrons/issues/8068)) ([8c5bff3](https://github.com/Opentrons/opentrons/commit/8c5bff3d3f2e59d0100c8b5d3374c619337bcc0b)), closes [#7979](https://github.com/Opentrons/opentrons/issues/7979)
* **labware-creator:** show whole labware in preview svg ([#8013](https://github.com/Opentrons/opentrons/issues/8013)) ([9b2fc17](https://github.com/Opentrons/opentrons/commit/9b2fc17843187d36746c10f4ba1ac6e551483ef9)), closes [#7164](https://github.com/Opentrons/opentrons/issues/7164)
* **labware-creator:** support multi-channel pipettes ([#8099](https://github.com/Opentrons/opentrons/issues/8099)) ([992f579](https://github.com/Opentrons/opentrons/commit/992f579b0287a572f71683fa744fbf97f8012f1b)), closes [#7965](https://github.com/Opentrons/opentrons/issues/7965)
* **labware-creator:** update bottom & depth section for tubes ([#8066](https://github.com/Opentrons/opentrons/issues/8066)) ([ccdb7d8](https://github.com/Opentrons/opentrons/commit/ccdb7d8ea4bf4fce53a451b707e9f717841054b2)), closes [#7982](https://github.com/Opentrons/opentrons/issues/7982)
* **labware-creator:** Update grid spacing when tiprack is selected ([#7932](https://github.com/Opentrons/opentrons/issues/7932)) ([6123de9](https://github.com/Opentrons/opentrons/commit/6123de96c67aba27fe94c3b6fba64ef3771d47dd)), closes [#7725](https://github.com/Opentrons/opentrons/issues/7725)
* **labware-creator:** Update gridd offset instructions/img when tiprack selected ([#7914](https://github.com/Opentrons/opentrons/issues/7914)) ([c314ad7](https://github.com/Opentrons/opentrons/commit/c314ad7e3eaa5c2484483c944d62d836a090d581)), closes [#7726](https://github.com/Opentrons/opentrons/issues/7726)
* **labware-creator:** update shape+size section for tube rack ([#8074](https://github.com/Opentrons/opentrons/issues/8074)) ([9b89ad9](https://github.com/Opentrons/opentrons/commit/9b89ad99535439d9f758b130383fcdaa3f1b5923)), closes [#7981](https://github.com/Opentrons/opentrons/issues/7981)
* **labware-creator:** update spacing section for custom tube racks ([#8063](https://github.com/Opentrons/opentrons/issues/8063)) ([03db137](https://github.com/Opentrons/opentrons/commit/03db13771a5f94fe37764b4def01680397631de7)), closes [#7983](https://github.com/Opentrons/opentrons/issues/7983)
* **labware-creator:** update tiprack recommendation text ([#8036](https://github.com/Opentrons/opentrons/issues/8036)) ([d051e08](https://github.com/Opentrons/opentrons/commit/d051e0813ccf88374794fb24078b33105047d569)), closes [#8035](https://github.com/Opentrons/opentrons/issues/8035)
* **labware-creator:** Update Well Depth Section to show Tip Length ([#7949](https://github.com/Opentrons/opentrons/issues/7949)) ([fe4d6db](https://github.com/Opentrons/opentrons/commit/fe4d6db248b2444506e839005e54bf4475d1bdc8)), closes [#7724](https://github.com/Opentrons/opentrons/issues/7724)
* **labware-creator:** use "tube" not "well" for x/y errors ([#8150](https://github.com/Opentrons/opentrons/issues/8150)) ([d9c7ed2](https://github.com/Opentrons/opentrons/commit/d9c7ed23d13cdb62bd1bc397dc2871d4bd5b77e9)), closes [#8142](https://github.com/Opentrons/opentrons/issues/8142)
* **labware-library:** add tip rack test .py protocol ([#8020](https://github.com/Opentrons/opentrons/issues/8020)) ([174dad9](https://github.com/Opentrons/opentrons/commit/174dad99a92c21218416c1381feb40f0abc856a1)), closes [#7884](https://github.com/Opentrons/opentrons/issues/7884)
* **labware-library:** change default display name for tube racks ([#8130](https://github.com/Opentrons/opentrons/issues/8130)) ([1a485aa](https://github.com/Opentrons/opentrons/commit/1a485aa6ff666407cc3caac9be3b2b270b3bd8e9)), closes [#7987](https://github.com/Opentrons/opentrons/issues/7987)





# [4.4.0](https://github.com/Opentrons/opentrons/compare/v4.3.1...v4.4.0) (2021-06-16)


### Features

* **labware-creator:** add "Tip Racks" to labwareType dropdown ([#7791](https://github.com/Opentrons/opentrons/issues/7791)) ([b53f6b5](https://github.com/Opentrons/opentrons/commit/b53f6b5)), closes [#7160](https://github.com/Opentrons/opentrons/issues/7160)
* **labware-creator:** Add custom tiprack not recommended section ([#7822](https://github.com/Opentrons/opentrons/issues/7822)) ([f7e58f5](https://github.com/Opentrons/opentrons/commit/f7e58f5)), closes [#7712](https://github.com/Opentrons/opentrons/issues/7712)
* **labware-creator:** add dynamic footprint copy for tip racks ([#7861](https://github.com/Opentrons/opentrons/issues/7861)) ([5bb265f](https://github.com/Opentrons/opentrons/commit/5bb265f)), closes [#7715](https://github.com/Opentrons/opentrons/issues/7715)
* **labware-creator:** Add hand placed tip fit section and alerts ([#7832](https://github.com/Opentrons/opentrons/issues/7832)) ([46431d5](https://github.com/Opentrons/opentrons/commit/46431d5)), closes [#7713](https://github.com/Opentrons/opentrons/issues/7713)
* **labware-creator:** Add new errors for too large/small footprint ([#7846](https://github.com/Opentrons/opentrons/issues/7846)) ([dd853de](https://github.com/Opentrons/opentrons/commit/dd853de)), closes [#7163](https://github.com/Opentrons/opentrons/issues/7163) [#7792](https://github.com/Opentrons/opentrons/issues/7792)
* **labware-creator:** autofill homogenousWells for tipRacks ([#7806](https://github.com/Opentrons/opentrons/issues/7806)) ([1594984](https://github.com/Opentrons/opentrons/commit/1594984)), closes [#7712](https://github.com/Opentrons/opentrons/issues/7712)
* **labware-creator:** new errors for wells outside of footprint ([#7784](https://github.com/Opentrons/opentrons/issues/7784)) ([9733697](https://github.com/Opentrons/opentrons/commit/9733697)), closes [#7165](https://github.com/Opentrons/opentrons/issues/7165)
* **labware-creator:** Update well shape and size section when tipRack is selected ([#7864](https://github.com/Opentrons/opentrons/issues/7864)) ([897d84b](https://github.com/Opentrons/opentrons/commit/897d84b)), closes [#7723](https://github.com/Opentrons/opentrons/issues/7723)
* **labware-library:** fix mixpanel id bug ([#7761](https://github.com/Opentrons/opentrons/issues/7761)) ([6a9d611](https://github.com/Opentrons/opentrons/commit/6a9d611)), closes [#7536](https://github.com/Opentrons/opentrons/issues/7536)
* **labware-library:** use correct type import ([#7718](https://github.com/Opentrons/opentrons/issues/7718)) ([dc84710](https://github.com/Opentrons/opentrons/commit/dc84710))





## [4.3.1](https://github.com/Opentrons/opentrons/compare/v4.3.0...v4.3.1) (2021-05-10)

**Note:** Version bump only for package @opentrons/labware-library





# [4.3.0](https://github.com/Opentrons/opentrons/compare/v4.2.1...v4.3.0) (2021-05-06)

**Note:** Version bump only for package @opentrons/labware-library





## [4.2.1](https://github.com/Opentrons/opentrons/compare/v4.2.0...v4.2.1) (2021-04-06)

**Note:** Version bump only for package @opentrons/labware-library



# [4.2.0](https://github.com/Opentrons/opentrons/compare/v4.1.1...v4.2.0) (2021-03-18)

**Note:** Version bump only for package @opentrons/labware-library





## [4.1.1](https://github.com/Opentrons/opentrons/compare/v4.1.0...v4.1.1) (2021-01-25)

**Note:** Version bump only for package @opentrons/labware-library





# [4.1.0](https://github.com/Opentrons/opentrons/compare/v4.0.0...v4.1.0) (2021-01-20)

## Bug Fixes

* **labware-library:** Render custom labware footprint diagram correctly ([#7111](https://github.com/Opentrons/opentrons/issues/7111)) ([33cec5b](https://github.com/Opentrons/opentrons/commit/33cec5b)), closes [#6983](https://github.com/Opentrons/opentrons/issues/6983)





# [4.0.0](https://github.com/Opentrons/opentrons/compare/v3.21.2...v4.0.0) (2020-11-20)


### Features

* **labware-library:** Add labware creator visibility ([#6667](https://github.com/Opentrons/opentrons/issues/6667)) ([eb906a3](https://github.com/Opentrons/opentrons/commit/eb906a3)), closes [#6307](https://github.com/Opentrons/opentrons/issues/6307)





## [3.21.2](https://github.com/Opentrons/opentrons/compare/v3.21.1...v3.21.2) (2020-10-16)

**Note:** Version bump only for package @opentrons/labware-library





## [3.21.1](https://github.com/Opentrons/opentrons/compare/v3.21.0...v3.21.1) (2020-10-14)

**Note:** Version bump only for package @opentrons/labware-library





# [3.21.0](https://github.com/Opentrons/opentrons/compare/v3.20.1...v3.21.0) (2020-09-30)


### Bug Fixes

* **labware-library:** fix test protocol well order bug ([#6393](https://github.com/Opentrons/opentrons/issues/6393)) ([d6c42bf](https://github.com/Opentrons/opentrons/commit/d6c42bf))





## [3.20.1](https://github.com/Opentrons/opentrons/compare/v3.20.0...v3.20.1) (2020-08-25)

**Note:** Version bump only for package @opentrons/labware-library





# [3.20.0](https://github.com/Opentrons/opentrons/compare/v3.19.0...v3.20.0) (2020-08-13)

### Features

* **labware-library:** avoid adding info to 'group' field in LC ([#5975](https://github.com/Opentrons/opentrons/issues/5975)) ([c6f1fa9](https://github.com/Opentrons/opentrons/commit/c6f1fa9)), closes [#5801](https://github.com/Opentrons/opentrons/issues/5801)
* **labware-library:** make LC test protocol go to bottom last ([#5958](https://github.com/Opentrons/opentrons/issues/5958)) ([b1bc683](https://github.com/Opentrons/opentrons/commit/b1bc683)), closes [#4625](https://github.com/Opentrons/opentrons/issues/4625)





# [3.19.0](https://github.com/Opentrons/opentrons/compare/v3.18.1...v3.19.0) (2020-06-29)


### Features

* **js:** update lodash to 4.17.15 ([#5788](https://github.com/Opentrons/opentrons/issues/5788)) ([5a145dc](https://github.com/Opentrons/opentrons/commit/5a145dc))
* **labware-library:** use loadname not displayname for LC file ([#5945](https://github.com/Opentrons/opentrons/issues/5945)) ([3869c63](https://github.com/Opentrons/opentrons/commit/3869c63)), closes [#5722](https://github.com/Opentrons/opentrons/issues/5722)
* **labware-library:** use slot 2 instead of 3 in LC test protocol ([#5950](https://github.com/Opentrons/opentrons/issues/5950)) ([fbd1506](https://github.com/Opentrons/opentrons/commit/fbd1506)), closes [#5019](https://github.com/Opentrons/opentrons/issues/5019)





## [3.18.1](https://github.com/Opentrons/opentrons/compare/v3.18.0...v3.18.1) (2020-05-26)

**Note:** Version bump only for package @opentrons/labware-library





# [3.18.0](https://github.com/Opentrons/opentrons/compare/v3.17.1...v3.18.0) (2020-05-20)


### Bug Fixes

* **protocol-designer:** fix multichannel well selection bug ([#5607](https://github.com/Opentrons/opentrons/issues/5607)) ([e20d645](https://github.com/Opentrons/opentrons/commit/e20d645))





## [3.17.1](https://github.com/Opentrons/opentrons/compare/v3.17.0...v3.17.1) (2020-05-06)

**Note:** Version bump only for package @opentrons/labware-library





### Features

* **components:** add hooks-based tooltip component to library ([#5362](https://github.com/Opentrons/opentrons/issues/5362)) ([7ef3ca9](https://github.com/Opentrons/opentrons/commit/7ef3ca9)), closes [#5120](https://github.com/Opentrons/opentrons/issues/5120)





# [3.17.0](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.1...v3.17.0) (2020-04-23)

**Note:** Version bump only for package @opentrons/labware-library





# [3.17.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.0...v3.17.0-beta.1) (2020-04-14)

**Note:** Version bump only for package @opentrons/labware-library





# [3.17.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.16.1...v3.17.0-beta.0) (2020-04-01)

### Features

* **js:** update Formik to v2 ([#5190](https://github.com/Opentrons/opentrons/issues/5190)) ([b15d360](https://github.com/Opentrons/opentrons/commit/b15d360))
* **labware-library:** Support more pipettes in custom labware test protocol ([#5084](https://github.com/Opentrons/opentrons/issues/5084)), and use opentrons_96_tiprack_20ul instead of 10ul ([19dce65](https://github.com/Opentrons/opentrons/commit/19dce65))





## [3.16.1](https://github.com/opentrons/opentrons/compare/v3.16.0...v3.16.1) (2020-02-25)

**Note:** Version bump only for package @opentrons/labware-library





# [3.16.0](https://github.com/Opentrons/opentrons/compare/v3.15.2...v3.16.0) (2020-02-19)

### Features

* **labware-library:** add decks 1 and 7 to labwareTestProtocol before labware test ([#4647](https://github.com/Opentrons/opentrons/issues/4647)) ([f1e560a](https://github.com/Opentrons/opentrons/commit/f1e560a))
* **shared-data:** add 20uL filter tiprack ([#4532](https://github.com/Opentrons/opentrons/issues/4532)) ([423da87](https://github.com/Opentrons/opentrons/commit/423da87))





## [3.15.2](https://github.com/opentrons/opentrons/compare/v3.15.1...v3.15.2) (2019-12-17)

### Features

* **labware-library:** change test protocol to api v2 ([#4571](https://github.com/Opentrons/opentrons/issues/4571)) ([bd631d4](https://github.com/Opentrons/opentrons/commit/bd631d4))





## [3.15.1](https://github.com/Opentrons/opentrons/compare/v3.15.0...v3.15.1) (2019-12-09)

**Note:** Version bump only for package @opentrons/labware-library





# [3.15.0](https://github.com/Opentrons/opentrons/compare/v3.14.1...v3.15.0) (2019-12-05)

**Note:** Version bump only for package @opentrons/labware-library





## [3.14.1](https://github.com/Opentrons/opentrons/compare/v3.14.0...v3.14.1) (2019-11-11)

**Note:** Version bump only for package @opentrons/labware-library





# [3.14.0](https://github.com/Opentrons/opentrons/compare/v3.13.2...v3.14.0) (2019-10-31)

### Bug Fixes

* **api,shared-data,labware-creator:** do not touch tip on troughs ([#4271](https://github.com/Opentrons/opentrons/issues/4271)) ([d7e76cd](https://github.com/Opentrons/opentrons/commit/d7e76cd)), closes [#4258](https://github.com/Opentrons/opentrons/issues/4258)
* **labware-creator:** fix radio group touched on change in Mac FF ([#4210](https://github.com/Opentrons/opentrons/issues/4210)) ([8c89022](https://github.com/Opentrons/opentrons/commit/8c89022)), closes [#4209](https://github.com/Opentrons/opentrons/issues/4209)
* **labware-library:** Remove global CSS that's breaking filter link styling ([#4239](https://github.com/Opentrons/opentrons/issues/4239)) ([11bdec4](https://github.com/Opentrons/opentrons/commit/11bdec4))


### Features

* **api:** v1: Add version specification to labware.load ([#4218](https://github.com/Opentrons/opentrons/issues/4218)) ([37060ce](https://github.com/Opentrons/opentrons/commit/37060ce)), closes [#4216](https://github.com/Opentrons/opentrons/issues/4216)
* **labware-creator:** add analytics events skeleton ([#4168](https://github.com/Opentrons/opentrons/issues/4168)) ([3593171](https://github.com/Opentrons/opentrons/commit/3593171))
* **labware-creator:** Guide user to labware test ([#4153](https://github.com/Opentrons/opentrons/issues/4153)) ([4bc00c4](https://github.com/Opentrons/opentrons/commit/4bc00c4)), closes [#4118](https://github.com/Opentrons/opentrons/issues/4118)
* **labware-library:** Add link for LC to LL sidebar ([#4154](https://github.com/Opentrons/opentrons/issues/4154)) ([4117e8e](https://github.com/Opentrons/opentrons/commit/4117e8e)), closes [#4147](https://github.com/Opentrons/opentrons/issues/4147)
* **labware-library:** add P20 tip rack image to library ([#4280](https://github.com/Opentrons/opentrons/issues/4280)) ([63032fb](https://github.com/Opentrons/opentrons/commit/63032fb))
* **labware-library:** hook up LC analytics and opt-in ([#4177](https://github.com/Opentrons/opentrons/issues/4177)) ([bad03e1](https://github.com/Opentrons/opentrons/commit/bad03e1)), closes [#4115](https://github.com/Opentrons/opentrons/issues/4115) [#4116](https://github.com/Opentrons/opentrons/issues/4116) [#4117](https://github.com/Opentrons/opentrons/issues/4117)
* **shared-data:** add NEST labware ([#4156](https://github.com/Opentrons/opentrons/issues/4156)) ([0d2491d](https://github.com/Opentrons/opentrons/commit/0d2491d))





## [3.13.2](https://github.com/Opentrons/opentrons/compare/v3.13.1...v3.13.2) (2019-10-10)

**Note:** Version bump only for package @opentrons/labware-library





## [3.13.1](https://github.com/Opentrons/opentrons/compare/v3.13.0...v3.13.1) (2019-10-09)

**Note:** Version bump only for package @opentrons/labware-library





# [3.13.0](https://github.com/Opentrons/opentrons/compare/v3.12.0...v3.13.0) (2019-10-02)

### Bug Fixes

* **app,labware-library:** Upgrade to react-router 5 and fix imports ([#4084](https://github.com/Opentrons/opentrons/issues/4084)) ([5595f8d](https://github.com/Opentrons/opentrons/commit/5595f8d))


### Features

* **labware-library:** add Labware Creator ([#4031](https://github.com/Opentrons/opentrons/issues/4031)) ([0a4aa7c](https://github.com/Opentrons/opentrons/commit/0a4aa7c))





# [3.12.0](https://github.com/Opentrons/opentrons/compare/v3.11.4...v3.12.0) (2019-09-13)

### Bug Fixes

* **labware-library:** Fix incorrect tree hydration with query params ([f9ba169](https://github.com/Opentrons/opentrons/commit/f9ba169))


### Features

* **shared-data:** add 24-well NEST tube racks ([#3916](https://github.com/Opentrons/opentrons/issues/3916)) ([eaa30dc](https://github.com/Opentrons/opentrons/commit/eaa30dc))
* **shared-data:** add NEST 96 PCR well plate 100 uL ([#3827](https://github.com/Opentrons/opentrons/issues/3827)) ([2a9a986](https://github.com/Opentrons/opentrons/commit/2a9a986))
* **shared-data:** add NEST 96 wellplate 200 uL Flat ([#3862](https://github.com/Opentrons/opentrons/issues/3862)) ([39835e9](https://github.com/Opentrons/opentrons/commit/39835e9))
* **shared-data:** add NEST conical tuberacks ([#3906](https://github.com/Opentrons/opentrons/issues/3906)) ([a39c3e7](https://github.com/Opentrons/opentrons/commit/a39c3e7))





## [3.11.4](https://github.com/Opentrons/opentrons/compare/v3.11.3...v3.11.4) (2019-08-29)

**Note:** Version bump only for package @opentrons/labware-library





## [3.11.3](https://github.com/Opentrons/opentrons/compare/v3.11.2...v3.11.3) (2019-08-28)

**Note:** Version bump only for package @opentrons/labware-library





## [3.11.2](https://github.com/Opentrons/opentrons/compare/v3.11.1...v3.11.2) (2019-08-21)

**Note:** Version bump only for package @opentrons/labware-library





## [3.11.1](https://github.com/Opentrons/opentrons/compare/v3.11.0...v3.11.1) (2019-08-21)

**Note:** Version bump only for package @opentrons/labware-library





# [3.11.0](https://github.com/Opentrons/opentrons/compare/v3.10.3...v3.11.0) (2019-08-21)


### Features

* **labware-library:** support static rendering of labware library ([#3791](https://github.com/Opentrons/opentrons/issues/3791)) ([793b624](https://github.com/Opentrons/opentrons/commit/793b624))





<a name="3.10.3"></a>
## [3.10.3](https://github.com/Opentrons/opentrons/compare/v3.10.2...v3.10.3) (2019-07-26)

**Note:** Version bump only for package @opentrons/labware-library




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
