# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.17.1](https://github.com/Opentrons/opentrons/compare/v3.17.0...v3.17.1) (2020-05-06)

### Bug Fixes

* **app:** ensure only one RPC connect request can go out at once ([#5322](https://github.com/Opentrons/opentrons/issues/5322)) ([9465cef](https://github.com/Opentrons/opentrons/commit/9465cef)), closes [#5241](https://github.com/Opentrons/opentrons/issues/5241) [#5307](https://github.com/Opentrons/opentrons/issues/5307)


### Features

* **app:** guide the user through leveling gen2 multis ([#5348](https://github.com/Opentrons/opentrons/issues/5348)) ([185d0ad](https://github.com/Opentrons/opentrons/commit/185d0ad)), closes [#5344](https://github.com/Opentrons/opentrons/issues/5344)





# [3.17.0](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.1...v3.17.0) (2020-04-23)

**Note:** Version bump only for package @opentrons/app





# [3.17.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.0...v3.17.0-beta.1) (2020-04-14)

**Note:** Version bump only for package @opentrons/app





# [3.17.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.16.1...v3.17.0-beta.0) (2020-04-01)

### Bug Fixes

* **app:** alignment and time formatting in thermocycler card ([#5320](https://github.com/Opentrons/opentrons/issues/5320)) ([3c7fcc8](https://github.com/Opentrons/opentrons/commit/3c7fcc8))
* **app:** fix tiprack in tip probe instructions when tipracks are shared ([#5319](https://github.com/Opentrons/opentrons/issues/5319)) ([7d5f4ab](https://github.com/Opentrons/opentrons/commit/7d5f4ab)), closes [#5311](https://github.com/Opentrons/opentrons/issues/5311)
* **app:** accept mixed-case extensions for protocols and custom labware ([#5153](https://github.com/Opentrons/opentrons/issues/5153)) ([12cce54](https://github.com/Opentrons/opentrons/commit/12cce54)), closes [#5151](https://github.com/Opentrons/opentrons/issues/5151)
* **app:** build RPC pipette tip rack list from both containers and instruments ([#5147](https://github.com/Opentrons/opentrons/issues/5147)) ([2c5fc9f](https://github.com/Opentrons/opentrons/commit/2c5fc9f))
* **app:** Deck cal: Tell users to attach an Opentrons tip, not a GEB tip. ([#5048](https://github.com/Opentrons/opentrons/issues/5048)) ([336bb17](https://github.com/Opentrons/opentrons/commit/336bb17))
* **app:** disable module commands when protocol paused ([#5209](https://github.com/Opentrons/opentrons/issues/5209)) ([b313c95](https://github.com/Opentrons/opentrons/commit/b313c95))


### Features

* **api:** updated images for all modules ([#5210](https://github.com/Opentrons/opentrons/issues/5210)) ([7e80a5b](https://github.com/Opentrons/opentrons/commit/7e80a5b)), closes [#4224](https://github.com/Opentrons/opentrons/issues/4224)
* **app:** add Wi-Fi disconnect to app ([#5296](https://github.com/Opentrons/opentrons/issues/5296)) ([f6620ee](https://github.com/Opentrons/opentrons/commit/f6620ee))
* **app:** enable gen2 multi pipettes ([#5297](https://github.com/Opentrons/opentrons/issues/5297)) ([707f0ab](https://github.com/Opentrons/opentrons/commit/707f0ab)), closes [#4698](https://github.com/Opentrons/opentrons/issues/4698)
* **app:** report PAPI version during protocol analytics events ([#5053](https://github.com/Opentrons/opentrons/issues/5053)) ([493a2ea](https://github.com/Opentrons/opentrons/commit/493a2ea)), closes [#4971](https://github.com/Opentrons/opentrons/issues/4971)
* **app, components:** Support gen2 modules ([#5177](https://github.com/Opentrons/opentrons/issues/5177)) ([3a938ff](https://github.com/Opentrons/opentrons/commit/3a938ff)), closes [#4960](https://github.com/Opentrons/opentrons/issues/4960)
* **js:** update Formik to v2 ([#5190](https://github.com/Opentrons/opentrons/issues/5190)) ([b15d360](https://github.com/Opentrons/opentrons/commit/b15d360))





## [3.16.1](https://github.com/opentrons/opentrons/compare/v3.16.0...v3.16.1) (2020-02-25)

**Note:** Version bump only for package @opentrons/app





# [3.16.0](https://github.com/Opentrons/opentrons/compare/v3.15.2...v3.16.0) (2020-02-19)

### Bug Fixes

* **app:** add spinner to "Save" button in Pipette Settings ([#4685](https://github.com/Opentrons/opentrons/issues/4685)) ([b8a9aac](https://github.com/Opentrons/opentrons/commit/b8a9aac)), closes [#4583](https://github.com/Opentrons/opentrons/issues/4583)
* **app:** clear lw calibration state if top level home is called ([#4703](https://github.com/Opentrons/opentrons/issues/4703)) ([8fe7120](https://github.com/Opentrons/opentrons/commit/8fe7120))
* **app:** home all axes after lw calibration to allow deck access ([#4687](https://github.com/Opentrons/opentrons/issues/4687)) ([6e0ad61](https://github.com/Opentrons/opentrons/commit/6e0ad61)), closes [#4034](https://github.com/Opentrons/opentrons/issues/4034)


### Features

* **app:** allow custom labware dir to be opened and reset to default ([#4918](https://github.com/Opentrons/opentrons/issues/4918)) ([03c438a](https://github.com/Opentrons/opentrons/commit/03c438a)), closes [#4878](https://github.com/Opentrons/opentrons/issues/4878) [#4879](https://github.com/Opentrons/opentrons/issues/4879)
* **app:** enable module firmware update button when update available ([#4923](https://github.com/Opentrons/opentrons/issues/4923)) ([1edc587](https://github.com/Opentrons/opentrons/commit/1edc587)), closes [#4575](https://github.com/Opentrons/opentrons/issues/4575)





## [3.15.2](https://github.com/opentrons/opentrons/compare/v3.15.1...v3.15.2) (2019-12-17)


### Bug Fixes

* **app:** disable tip probe for unused pipettes ([#4584](https://github.com/Opentrons/opentrons/issues/4584)) ([9388391](https://github.com/Opentrons/opentrons/commit/9388391)), closes [#4570](https://github.com/Opentrons/opentrons/issues/4570)
* **app:** naïve loading state for tc open lid during lw cal ([#4616](https://github.com/Opentrons/opentrons/issues/4616)) ([c4a4cdf](https://github.com/Opentrons/opentrons/commit/c4a4cdf))


### Features

* **app:** add link to docs in resources card ([#4606](https://github.com/Opentrons/opentrons/issues/4606)) ([21ec9ff](https://github.com/Opentrons/opentrons/commit/21ec9ff))





## [3.15.1](https://github.com/Opentrons/opentrons/compare/v3.15.0...v3.15.1) (2019-12-09)

**Note:** Version bump only for package @opentrons/app





# [3.15.0](https://github.com/Opentrons/opentrons/compare/v3.14.1...v3.15.0) (2019-12-05)



### Features

* **app:** add simple aggregate event tracking for custom labware ([#4544](https://github.com/Opentrons/opentrons/issues/4544)) ([b4fd536](https://github.com/Opentrons/opentrons/commit/b4fd536)), closes [#4537](https://github.com/Opentrons/opentrons/issues/4537)
* **app:** put bundle upload + exec under ff ([#4541](https://github.com/Opentrons/opentrons/issues/4541)) ([9023d95](https://github.com/Opentrons/opentrons/commit/9023d95))
* **app:** enable custom labware management in the app ([#4525](https://github.com/Opentrons/opentrons/issues/4525)) ([e1c9958](https://github.com/Opentrons/opentrons/commit/e1c9958))
* **app:** Display robot and protocol api versions ([#4502](https://github.com/Opentrons/opentrons/issues/4502)) ([00f333e](https://github.com/Opentrons/opentrons/commit/00f333e)), closes [#4362](https://github.com/Opentrons/opentrons/issues/4362)
* **app:** parse subnest out of CIDR-notation IP address ([#4372](https://github.com/Opentrons/opentrons/issues/4372)) ([ac74c12](https://github.com/Opentrons/opentrons/commit/ac74c12)), closes [#4075](https://github.com/Opentrons/opentrons/issues/4075)
* **app,api:** allow rich version specification for python protocols ([#4358](https://github.com/Opentrons/opentrons/issues/4358)) ([b0adef5](https://github.com/Opentrons/opentrons/commit/b0adef5)), closes [#4338](https://github.com/Opentrons/opentrons/issues/4338)
* **protocol-designer:** show special-case warning for north/south ([#4361](https://github.com/Opentrons/opentrons/issues/4361)) ([86912e8](https://github.com/Opentrons/opentrons/commit/86912e8)), closes [#4332](https://github.com/Opentrons/opentrons/issues/4332)


### Bug Fixes

* **api:** ensure load name is attached to RPC "containers" ([#4530](https://github.com/Opentrons/opentrons/issues/4530)) ([4580aa4](https://github.com/Opentrons/opentrons/commit/4580aa4))
* **app:** consolidate nav state to disable calibrate link on file info page ([#4514](https://github.com/Opentrons/opentrons/issues/4514)) ([842f15c](https://github.com/Opentrons/opentrons/commit/842f15c))
* **app:** Call correct create method depending on protocol ([#4509](https://github.com/Opentrons/opentrons/issues/4509)) ([a3ec421](https://github.com/Opentrons/opentrons/commit/a3ec421)), closes [#4202](https://github.com/Opentrons/opentrons/issues/4202)
* **app:** display robot ip not robot ip subnet base ([#4411](https://github.com/Opentrons/opentrons/issues/4411)) ([57cdfee](https://github.com/Opentrons/opentrons/commit/57cdfee)), closes [#4372](https://github.com/Opentrons/opentrons/issues/4372)
* **app:** prevent user from proceeding if uploaded protocol has no steps ([#4381](https://github.com/Opentrons/opentrons/issues/4381)) ([a8344e9](https://github.com/Opentrons/opentrons/commit/a8344e9)), closes [#3121](https://github.com/Opentrons/opentrons/issues/3121)
* **app-shell:** improve context menu and log handling ([#4472](https://github.com/Opentrons/opentrons/issues/4472)) ([de15135](https://github.com/Opentrons/opentrons/commit/de15135)), closes [#4293](https://github.com/Opentrons/opentrons/issues/4293)
* **app,api:** display session error messages in SessionAlert ([#4378](https://github.com/Opentrons/opentrons/issues/4378)) ([19d3e00](https://github.com/Opentrons/opentrons/commit/19d3e00)), closes [#4367](https://github.com/Opentrons/opentrons/issues/4367)



## [3.14.1](https://github.com/Opentrons/opentrons/compare/v3.14.0...v3.14.1) (2019-11-11)

**Note:** Version bump only for package @opentrons/app





# [3.14.0](https://github.com/Opentrons/opentrons/compare/v3.13.2...v3.14.0) (2019-10-31)

### Features

* **app:** allow inexact cross-generational pipette compatibility ([#4311](https://github.com/Opentrons/opentrons/issues/4311)) ([95dae6a](https://github.com/Opentrons/opentrons/commit/95dae6a)), closes [#3598](https://github.com/Opentrons/opentrons/issues/3598)
* **app:** allow p1000 gen2 to fallback to specced p1000 gen1 ([#4316](https://github.com/Opentrons/opentrons/issues/4316)) ([0e33f65](https://github.com/Opentrons/opentrons/commit/0e33f65)), closes [#3598](https://github.com/Opentrons/opentrons/issues/3598)
* **app:** add robot restart alert for FF changes that require restart ([#4285](https://github.com/Opentrons/opentrons/issues/4285)) ([96408a1](https://github.com/Opentrons/opentrons/commit/96408a1))
* **app:** Enable GEN2 pipettes ([#4297](https://github.com/Opentrons/opentrons/issues/4297)) ([f9d2c3b](https://github.com/Opentrons/opentrons/commit/f9d2c3b)), closes [#3601](https://github.com/Opentrons/opentrons/issues/3601)
* **app:** improve modules on run tab, enable module temp control for tc and td ([#4172](https://github.com/Opentrons/opentrons/issues/4172)) ([c11de69](https://github.com/Opentrons/opentrons/commit/c11de69)), closes [#4021](https://github.com/Opentrons/opentrons/issues/4021)
* **app:** restrict calibrate and run on incompatible pipettes ([#4185](https://github.com/Opentrons/opentrons/issues/4185)) ([02fcd4c](https://github.com/Opentrons/opentrons/commit/02fcd4c))





## [3.13.2](https://github.com/Opentrons/opentrons/compare/v3.13.1...v3.13.2) (2019-10-10)


### Bug Fixes

* **app:** fix broken back-compat for pre-3.13.x robots ([#4203](https://github.com/Opentrons/opentrons/issues/4203)) ([9243a8d](https://github.com/Opentrons/opentrons/commit/9243a8d)), closes [#4202](https://github.com/Opentrons/opentrons/issues/4202)





## [3.13.1](https://github.com/Opentrons/opentrons/compare/v3.13.0...v3.13.1) (2019-10-09)

**Note:** Version bump only for package @opentrons/app





# [3.13.0](https://github.com/Opentrons/opentrons/compare/v3.12.0...v3.13.0) (2019-10-02)

### Bug Fixes

* **app:** fix zip mimetype bug ([#4150](https://github.com/Opentrons/opentrons/issues/4150)) ([9f4c357](https://github.com/Opentrons/opentrons/commit/9f4c357))
* **app:** Disable run start button if missing modules ([#3994](https://github.com/Opentrons/opentrons/issues/3994)) ([5c75152](https://github.com/Opentrons/opentrons/commit/5c75152)), closes [#2676](https://github.com/Opentrons/opentrons/issues/2676)
* **app:** ensure gantry not blocking pcr seal placement ([#4071](https://github.com/Opentrons/opentrons/issues/4071)) ([01d6858](https://github.com/Opentrons/opentrons/commit/01d6858)), closes [#4034](https://github.com/Opentrons/opentrons/issues/4034)
* **app,labware-library:** Upgrade to react-router 5 and fix imports ([#4084](https://github.com/Opentrons/opentrons/issues/4084)) ([5595f8d](https://github.com/Opentrons/opentrons/commit/5595f8d))


### Features

* **app:** show spinner while robot logs are downloading ([#4158](https://github.com/Opentrons/opentrons/issues/4158)) ([cd50c42](https://github.com/Opentrons/opentrons/commit/cd50c42))
* **api:** support experimental bundle execution ([#4099](https://github.com/Opentrons/opentrons/issues/4099)) ([1c503ed](https://github.com/Opentrons/opentrons/commit/1c503ed))
* **components, app:** add custom pipette select with category support ([#3996](https://github.com/Opentrons/opentrons/issues/3996)) ([47f0713](https://github.com/Opentrons/opentrons/commit/47f0713))





# [3.12.0](https://github.com/Opentrons/opentrons/compare/v3.11.4....v3.12.0) (2019-09-13)

### Bug Fixes

* **api:** remove protocol file size limit and ack immediately ([#4006](https://github.com/Opentrons/opentrons/issues/4006)) ([2a82724](https://github.com/Opentrons/opentrons/commit/2a82724)), closes [#3998](https://github.com/Opentrons/opentrons/issues/3998)
* **app:** Add tip rack name to tip probe wizard instructions ([#3940](https://github.com/Opentrons/opentrons/issues/3940)) ([e053008](https://github.com/Opentrons/opentrons/commit/e053008))
* **app:** compensate for differences in app and robot clocks ([#3875](https://github.com/Opentrons/opentrons/issues/3875)) ([a3ee4eb](https://github.com/Opentrons/opentrons/commit/a3ee4eb)), closes [#3872](https://github.com/Opentrons/opentrons/issues/3872)
* **app:** Improve tip probe wizard state and error handling ([#3959](https://github.com/Opentrons/opentrons/issues/3959)) ([b88c73b](https://github.com/Opentrons/opentrons/commit/b88c73b)), closes [#3948](https://github.com/Opentrons/opentrons/issues/3948) [#3944](https://github.com/Opentrons/opentrons/issues/3944) [#3943](https://github.com/Opentrons/opentrons/issues/3943) [#2008](https://github.com/Opentrons/opentrons/issues/2008)
* **app:** make shell remote check lazier to avoid spurious assertions ([#3895](https://github.com/Opentrons/opentrons/issues/3895)) ([7aaad6d](https://github.com/Opentrons/opentrons/commit/7aaad6d))
* **app:** Remove incorrect data removal warning from change pipette ([#3942](https://github.com/Opentrons/opentrons/issues/3942)) ([27b315c](https://github.com/Opentrons/opentrons/commit/27b315c))


### Features

* **app:** display custom labware on deckmap ([#3891](https://github.com/Opentrons/opentrons/issues/3891)) ([f3ee4b3](https://github.com/Opentrons/opentrons/commit/f3ee4b3)), closes [#3826](https://github.com/Opentrons/opentrons/issues/3826)





## [3.11.4](https://github.com/Opentrons/opentrons/compare/v3.11.3...v3.11.4) (2019-08-29)

**Note:** Version bump only for package @opentrons/app





## [3.11.3](https://github.com/Opentrons/opentrons/compare/v3.11.2...v3.11.3) (2019-08-28)

**Note:** Version bump only for package @opentrons/app





## [3.11.2](https://github.com/Opentrons/opentrons/compare/v3.11.1...v3.11.2) (2019-08-21)


### Bug Fixes

* **app:** Fix regression breaking trash removal modal before tip probe ([f0d1da3](https://github.com/Opentrons/opentrons/commit/f0d1da3))





## [3.11.1](https://github.com/Opentrons/opentrons/compare/v3.11.0...v3.11.1) (2019-08-21)


### Bug Fixes

* **app:** Fix paths to BR premigration wheels on Windows ([0ff8638](https://github.com/Opentrons/opentrons/commit/0ff8638))





# [3.11.0](https://github.com/Opentrons/opentrons/compare/v3.10.3...v3.11.0) (2019-08-21)


### Bug Fixes

* **app:** eagerly fetch modules and instruments on robot connect ([#3854](https://github.com/Opentrons/opentrons/issues/3854)) ([88f5aec](https://github.com/Opentrons/opentrons/commit/88f5aec)), closes [#3844](https://github.com/Opentrons/opentrons/issues/3844)
* **app:** Remove Electron RPC remote objects from Redux state ([#3820](https://github.com/Opentrons/opentrons/issues/3820)) ([d5f3fe3](https://github.com/Opentrons/opentrons/commit/d5f3fe3))


### Features

* **app:** Add robot logging opt-out alert ([#3869](https://github.com/Opentrons/opentrons/issues/3869)) ([9ab6938](https://github.com/Opentrons/opentrons/commit/9ab6938))
* **app:** add control of modules to run cards ([#3841](https://github.com/Opentrons/opentrons/issues/3841)) ([9b34f9f](https://github.com/Opentrons/opentrons/commit/9b34f9f))
* **app:** display TC on Deck Map ([#3786](https://github.com/Opentrons/opentrons/issues/3786)) ([272a6ad](https://github.com/Opentrons/opentrons/commit/272a6ad)), closes [#3553](https://github.com/Opentrons/opentrons/issues/3553) [#3064](https://github.com/Opentrons/opentrons/issues/3064)
* **app:** Enable buildroot updates by default ([#3861](https://github.com/Opentrons/opentrons/issues/3861)) ([bf68ad9](https://github.com/Opentrons/opentrons/commit/bf68ad9)), closes [#3822](https://github.com/Opentrons/opentrons/issues/3822)
* **app:** prompt to open TC lid before labware calibration ([#3853](https://github.com/Opentrons/opentrons/issues/3853)) ([2b7efbc](https://github.com/Opentrons/opentrons/commit/2b7efbc)), closes [#3066](https://github.com/Opentrons/opentrons/issues/3066)
* **app, api:** Key calibration by parent-type/labware-type combo ([#3800](https://github.com/Opentrons/opentrons/issues/3800)) ([ba0df67](https://github.com/Opentrons/opentrons/commit/ba0df67)), closes [#3775](https://github.com/Opentrons/opentrons/issues/3775)





<a name="3.10.3"></a>
## [3.10.3](https://github.com/Opentrons/opentrons/compare/v3.10.2...v3.10.3) (2019-07-26)

**Note:** Version bump only for package @opentrons/app




<a name="3.10.2"></a>
## [3.10.2](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.2) (2019-07-25)


### Features

* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)





<a name="3.10.1"></a>
## [3.10.1](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.1) (2019-07-19)


### Features

* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)





<a name="3.10.0"></a>
# [3.10.0](https://github.com/Opentrons/opentrons/compare/v3.9.0...v3.10.0) (2019-07-15)


### Bug Fixes

* **app:** Add reservior calibration instruction support ([#3704](https://github.com/Opentrons/opentrons/issues/3704)) ([1464772](https://github.com/Opentrons/opentrons/commit/1464772))
* **app:** Do not swallow protocol run errors ([#3723](https://github.com/Opentrons/opentrons/issues/3723)) ([73d06d8](https://github.com/Opentrons/opentrons/commit/73d06d8)), closes [#1828](https://github.com/Opentrons/opentrons/issues/1828)
* **app:** Stop long labware names overflowing calibration screens ([#3715](https://github.com/Opentrons/opentrons/issues/3715)) ([22fd8ad](https://github.com/Opentrons/opentrons/commit/22fd8ad))
* **app,pd:** Truncate long labware names ([#3644](https://github.com/Opentrons/opentrons/issues/3644)) ([abe4bc7](https://github.com/Opentrons/opentrons/commit/abe4bc7)), closes [#3617](https://github.com/Opentrons/opentrons/issues/3617) [#2444](https://github.com/Opentrons/opentrons/issues/2444)


### Features

* **app:** add support for v2 labware ([#3590](https://github.com/Opentrons/opentrons/issues/3590)) ([0b74937](https://github.com/Opentrons/opentrons/commit/0b74937)), closes [#3451](https://github.com/Opentrons/opentrons/issues/3451)
* **app:** Get protocolDisplayData based on protocol schema ([#3531](https://github.com/Opentrons/opentrons/issues/3531)) ([ec69d84](https://github.com/Opentrons/opentrons/commit/ec69d84)), closes [#3494](https://github.com/Opentrons/opentrons/issues/3494)
* **protocol-designer:** load v3 protocols ([#3591](https://github.com/Opentrons/opentrons/issues/3591)) ([8a10ec6](https://github.com/Opentrons/opentrons/commit/8a10ec6)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336)
* **protocol-designer:** save v3 protocols ([#3588](https://github.com/Opentrons/opentrons/issues/3588)) ([40f3a9e](https://github.com/Opentrons/opentrons/commit/40f3a9e)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336) [#3414](https://github.com/Opentrons/opentrons/issues/3414)





<a name="3.9.0"></a>
# [3.9.0](https://github.com/Opentrons/opentrons/compare/v3.8.3...v3.9.0) (2019-05-29)


### Bug Fixes

* **app:** Allow valid pipette+ model names for display images ([#3413](https://github.com/Opentrons/opentrons/issues/3413)) ([1f77a08](https://github.com/Opentrons/opentrons/commit/1f77a08))
* **app:** Re-enable change pipette and pipette settings ([#3475](https://github.com/Opentrons/opentrons/issues/3475)) ([2419110](https://github.com/Opentrons/opentrons/commit/2419110))
* **app:** Verify attached/protocol pipettes ([#3458](https://github.com/Opentrons/opentrons/issues/3458)) ([20988b8](https://github.com/Opentrons/opentrons/commit/20988b8))


### Features

* **api:** Add G Code for pipette config in driver ([#3388](https://github.com/Opentrons/opentrons/issues/3388)) ([77fffa6](https://github.com/Opentrons/opentrons/commit/77fffa6))
* **app:** Enable pipette quirks in pipette config ([#3488](https://github.com/Opentrons/opentrons/issues/3488)) ([b17f568](https://github.com/Opentrons/opentrons/commit/b17f568))


<a name="3.8.3"></a>
## [3.8.3](https://github.com/Opentrons/opentrons/compare/v3.8.2...v3.8.3) (2019-04-30)

**Note:** Version bump only for package @opentrons/app

<a name="3.8.2"></a>
## [3.8.2](https://github.com/Opentrons/opentrons/compare/v3.8.1...v3.8.2) (2019-04-23)


### Bug Fixes

* **app:** Clear deck cal request states on wizard exit ([#3378](https://github.com/Opentrons/opentrons/issues/3378)) ([408b8aa](https://github.com/Opentrons/opentrons/commit/408b8aa))
* **app:** Disable manual ip double submit on enter keypress ([#3376](https://github.com/Opentrons/opentrons/issues/3376)) ([81291ca](https://github.com/Opentrons/opentrons/commit/81291ca))
* **app:** render correct image for vial and tube racks ([#3298](https://github.com/Opentrons/opentrons/issues/3298)) ([b9e1ebb](https://github.com/Opentrons/opentrons/commit/b9e1ebb)), closes [#3294](https://github.com/Opentrons/opentrons/issues/3294)


### Features

* **app:** Enable adding manual robot IP addresses in app settings ([#3284](https://github.com/Opentrons/opentrons/issues/3284)) ([c34fcfa](https://github.com/Opentrons/opentrons/commit/c34fcfa)), closes [#2741](https://github.com/Opentrons/opentrons/issues/2741)





<a name="3.8.1"></a>
## [3.8.1](https://github.com/Opentrons/opentrons/compare/v3.8.0...v3.8.1) (2019-03-29)


### Bug Fixes

* **app:** Fix modules not populating the modules card ([#3278](https://github.com/Opentrons/opentrons/issues/3278)) ([1fd936d](https://github.com/Opentrons/opentrons/commit/1fd936d))


### Features

* **protocol-designer:** update transfer form design ([#3221](https://github.com/Opentrons/opentrons/issues/3221)) ([775ec4b](https://github.com/Opentrons/opentrons/commit/775ec4b))





<a name="3.8.0"></a>
# [3.8.0](https://github.com/Opentrons/opentrons/compare/v3.7.0...v3.8.0) (2019-03-19)


### Features

* **app:** Enable pipette config modal and form ([#3202](https://github.com/Opentrons/opentrons/issues/3202)) ([49c1fe9](https://github.com/Opentrons/opentrons/commit/49c1fe9)), closes [#3112](https://github.com/Opentrons/opentrons/issues/3112)





<a name="3.7.0"></a>
# [3.7.0](https://github.com/Opentrons/opentrons/compare/v3.6.5...v3.7.0) (2019-02-19)


### Features

* **api:** pipette config plunger position ([#2999](https://github.com/Opentrons/opentrons/issues/2999)) ([cbd559a](https://github.com/Opentrons/opentrons/commit/cbd559a))
* **app:** Add robot pipettes, versions, FFs to mixpanel and intercom ([#3059](https://github.com/Opentrons/opentrons/issues/3059)) ([de4a15f](https://github.com/Opentrons/opentrons/commit/de4a15f)), closes [#3009](https://github.com/Opentrons/opentrons/issues/3009) [#3010](https://github.com/Opentrons/opentrons/issues/3010)
* **app:** Configure analytics to send Python and JSON protocol info ([#2946](https://github.com/Opentrons/opentrons/issues/2946)) ([22f419d](https://github.com/Opentrons/opentrons/commit/22f419d)), closes [#2615](https://github.com/Opentrons/opentrons/issues/2615) [#2618](https://github.com/Opentrons/opentrons/issues/2618)
* **app:** Enable new app update modal ([#3044](https://github.com/Opentrons/opentrons/issues/3044)) ([d36071e](https://github.com/Opentrons/opentrons/commit/d36071e))
* **app:** Replace P10 update warning with one for all pipettes ([#3043](https://github.com/Opentrons/opentrons/issues/3043)) ([9bd3eb2](https://github.com/Opentrons/opentrons/commit/9bd3eb2)), closes [#3011](https://github.com/Opentrons/opentrons/issues/3011)
* **protocol-designer:** use SelectField for change tip ([#3001](https://github.com/Opentrons/opentrons/issues/3001)) ([b477f34](https://github.com/Opentrons/opentrons/commit/b477f34)), closes [#2915](https://github.com/Opentrons/opentrons/issues/2915)





<a name="3.6.5"></a>
## [3.6.5](https://github.com/Opentrons/opentrons/compare/v3.6.4...v3.6.5) (2018-12-18)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.4"></a>
## [3.6.4](https://github.com/Opentrons/opentrons/compare/v3.6.3...v3.6.4) (2018-12-17)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.3"></a>
## [3.6.3](https://github.com/Opentrons/opentrons/compare/v3.6.2...v3.6.3) (2018-12-13)


### Features

* **app:** Add opt-in modal for new p10s ([#2816](https://github.com/Opentrons/opentrons/issues/2816)) ([cd69e19](https://github.com/Opentrons/opentrons/commit/cd69e19)), closes [#2793](https://github.com/Opentrons/opentrons/issues/2793)
* **app:** Display Python protocol metadata in the app ([#2805](https://github.com/Opentrons/opentrons/issues/2805)) ([f854953](https://github.com/Opentrons/opentrons/commit/f854953)), closes [#2617](https://github.com/Opentrons/opentrons/issues/2617)
* **app:** Implement clearer robot server upgrade/downgrade information ([#2807](https://github.com/Opentrons/opentrons/issues/2807)) ([d37e3aa](https://github.com/Opentrons/opentrons/commit/d37e3aa)), closes [#2401](https://github.com/Opentrons/opentrons/issues/2401)





<a name="3.6.2"></a>
## [3.6.2](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.2) (2018-12-11)


### Bug Fixes

* **app:** Show main nav notification dot for updatable connected robot ([#2801](https://github.com/Opentrons/opentrons/issues/2801)) ([6a67c86](https://github.com/Opentrons/opentrons/commit/6a67c86)), closes [#2642](https://github.com/Opentrons/opentrons/issues/2642)


### Features

* **protocol-designer:** enable sharing tip racks between pipettes ([#2753](https://github.com/Opentrons/opentrons/issues/2753)) ([45db100](https://github.com/Opentrons/opentrons/commit/45db100))





<a name="3.6.1"></a>
## [3.6.1](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.1) (2018-12-05)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0"></a>
# [3.6.0](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.1...v3.6.0) (2018-11-29)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0-beta.1"></a>
# [3.6.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.0...v3.6.0-beta.1) (2018-11-27)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0-beta.0"></a>
# [3.6.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.5.1...v3.6.0-beta.0) (2018-11-13)


### Features

* **app:** Home pipette after tip probe confirmed ([#2586](https://github.com/Opentrons/opentrons/issues/2586)) ([3119379](https://github.com/Opentrons/opentrons/commit/3119379)), closes [#2544](https://github.com/Opentrons/opentrons/issues/2544)
* **app:** Implement new connectivity card ([#2608](https://github.com/Opentrons/opentrons/issues/2608)) ([a4b26a2](https://github.com/Opentrons/opentrons/commit/a4b26a2)), closes [#2555](https://github.com/Opentrons/opentrons/issues/2555)
* **app:** Track restart status in discovery state for better alerts ([#2639](https://github.com/Opentrons/opentrons/issues/2639)) ([b4ba600](https://github.com/Opentrons/opentrons/commit/b4ba600)), closes [#2516](https://github.com/Opentrons/opentrons/issues/2516)
* **shared-data:** support unversioned pipettes in JSON protocols ([#2605](https://github.com/Opentrons/opentrons/issues/2605)) ([9e84ff6](https://github.com/Opentrons/opentrons/commit/9e84ff6))





<a name="3.5.1"></a>
# [3.5.1](https://github.com/Opentrons/opentrons/compare/v3.5.0...v3.5.1) (2018-10-26)


### Bug Fixes

* **app:** Show the correct release notes for robot update ([#2560](https://github.com/Opentrons/opentrons/issues/2560)) ([7b0279c](https://github.com/Opentrons/opentrons/commit/7b0279c))


<a name="3.5.0"></a>
# [3.5.0](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.1...v3.5.0) (2018-10-25)


### Features

* **app:** Show all labware of same type as confirmed ([#2525](https://github.com/Opentrons/opentrons/issues/2525)) ([ab8fdd9](https://github.com/Opentrons/opentrons/commit/ab8fdd9)), closes [#2523](https://github.com/Opentrons/opentrons/issues/2523)





<a name="3.5.0-beta.1"></a>
# [3.5.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.0...v3.5.0-beta.1) (2018-10-16)


### Bug Fixes

* **app:** Check semver validity of API returned version strings ([#2492](https://github.com/Opentrons/opentrons/issues/2492)) ([d9a48bf](https://github.com/Opentrons/opentrons/commit/d9a48bf))


### Features

* **app:** Move deck calibration to robot controls ([#2470](https://github.com/Opentrons/opentrons/issues/2470)) ([b6ef29c](https://github.com/Opentrons/opentrons/commit/b6ef29c)), closes [#2377](https://github.com/Opentrons/opentrons/issues/2377)





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Bug Fixes

* **app:** Allow portal to re-check for root element ([#2440](https://github.com/Opentrons/opentrons/issues/2440)) ([5930a34](https://github.com/Opentrons/opentrons/commit/5930a34))
* **app:** Use type for labware table, not name ([#2441](https://github.com/Opentrons/opentrons/issues/2441)) ([cf91003](https://github.com/Opentrons/opentrons/commit/cf91003)), closes [#2407](https://github.com/Opentrons/opentrons/issues/2407)
* **discovery-client:** Ensure IPs are actually de-duped ([#2404](https://github.com/Opentrons/opentrons/issues/2404)) ([928dcab](https://github.com/Opentrons/opentrons/commit/928dcab))


### Features

* **app:** Add release notes to robot update modals ([#2397](https://github.com/Opentrons/opentrons/issues/2397)) ([f5e5fd9](https://github.com/Opentrons/opentrons/commit/f5e5fd9)), closes [#2353](https://github.com/Opentrons/opentrons/issues/2353)
* **app:** Add upgrade and downgrade logic to robot updates ([#2376](https://github.com/Opentrons/opentrons/issues/2376)) ([d44386a](https://github.com/Opentrons/opentrons/commit/d44386a))
* **app:** Display reachable but non-connectable robots ([#2455](https://github.com/Opentrons/opentrons/issues/2455)) ([8785ea8](https://github.com/Opentrons/opentrons/commit/8785ea8)), closes [#2345](https://github.com/Opentrons/opentrons/issues/2345)
* **app:** Display unreachable robots in list ([#2434](https://github.com/Opentrons/opentrons/issues/2434)) ([9b47f2d](https://github.com/Opentrons/opentrons/commit/9b47f2d)), closes [#2344](https://github.com/Opentrons/opentrons/issues/2344)
* **app:** Only display instrument settings for selected robot ([#2406](https://github.com/Opentrons/opentrons/issues/2406)) ([9150e21](https://github.com/Opentrons/opentrons/commit/9150e21)), closes [#2362](https://github.com/Opentrons/opentrons/issues/2362)
* **app:** Prompt user to update app in robot update modal ([#2386](https://github.com/Opentrons/opentrons/issues/2386)) ([c389750](https://github.com/Opentrons/opentrons/commit/c389750)), closes [#2354](https://github.com/Opentrons/opentrons/issues/2354)
* **app:** Remove 'opentrons-' prefix in robot displayNames ([#2459](https://github.com/Opentrons/opentrons/issues/2459)) ([06f158a](https://github.com/Opentrons/opentrons/commit/06f158a)), closes [#2357](https://github.com/Opentrons/opentrons/issues/2357)
* **discovery-client:** Add mdns flag and health responses to services ([#2420](https://github.com/Opentrons/opentrons/issues/2420)) ([0c06d32](https://github.com/Opentrons/opentrons/commit/0c06d32))


### Performance Improvements

* **app:** Upgrade Electron to v3 and remove Node in renderer ([#2374](https://github.com/Opentrons/opentrons/issues/2374)) ([778b9af](https://github.com/Opentrons/opentrons/commit/778b9af))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)


### Bug Fixes

* **app:** Fix robot list scroll clipping ([#2288](https://github.com/Opentrons/opentrons/issues/2288)) ([28556ef](https://github.com/Opentrons/opentrons/commit/28556ef)), closes [#2046](https://github.com/Opentrons/opentrons/issues/2046)
* **app:** Open external links in browser instead of app window ([#2327](https://github.com/Opentrons/opentrons/issues/2327)) ([5bf5d5f](https://github.com/Opentrons/opentrons/commit/5bf5d5f))
* **app:** Prevent keypresses from changing jog jump size ([#2315](https://github.com/Opentrons/opentrons/issues/2315)) ([1b32d6d](https://github.com/Opentrons/opentrons/commit/1b32d6d))
* **app:** Wrap runscreen modals in portal ([#2308](https://github.com/Opentrons/opentrons/issues/2308)) ([aefad0a](https://github.com/Opentrons/opentrons/commit/aefad0a))


### Features

* **app:** Add release notes to app update modal ([#2316](https://github.com/Opentrons/opentrons/issues/2316)) ([745a1f8](https://github.com/Opentrons/opentrons/commit/745a1f8))
* **app:** Enable autoupdate on Linux by switching to AppImage builds ([#2329](https://github.com/Opentrons/opentrons/issues/2329)) ([caade74](https://github.com/Opentrons/opentrons/commit/caade74)), closes [#2303](https://github.com/Opentrons/opentrons/issues/2303)





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Features

* **app:** Add protocol file info page ([#2221](https://github.com/Opentrons/opentrons/issues/2221)) ([e861365](https://github.com/Opentrons/opentrons/commit/e861365))
* **app:** Parse JSON protocols into state ([#2231](https://github.com/Opentrons/opentrons/issues/2231)) ([b5f3666](https://github.com/Opentrons/opentrons/commit/b5f3666))
* **app:** Populate FileInfo page with JSON protocol metadata ([#2278](https://github.com/Opentrons/opentrons/issues/2278)) ([995038a](https://github.com/Opentrons/opentrons/commit/995038a)), closes [#2129](https://github.com/Opentrons/opentrons/issues/2129)





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)


### Bug Fixes

* **app:** Grab intercom handler from window on every call ([#2179](https://github.com/Opentrons/opentrons/issues/2179)) ([a90aaae](https://github.com/Opentrons/opentrons/commit/a90aaae))


### Features

* **app:** Add attached pipette info to intercom support ([#2140](https://github.com/Opentrons/opentrons/issues/2140)) ([b06e845](https://github.com/Opentrons/opentrons/commit/b06e845)), closes [#2019](https://github.com/Opentrons/opentrons/issues/2019)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Bug Fixes

* **app:** Fix copy typos in update error modal ([#2027](https://github.com/Opentrons/opentrons/issues/2027)) ([37795ce](https://github.com/Opentrons/opentrons/commit/37795ce))


### Features

* **api:** publish module commands and make module data endpoint ([#2053](https://github.com/Opentrons/opentrons/issues/2053)) ([c25c081](https://github.com/Opentrons/opentrons/commit/c25c081)), closes [#1653](https://github.com/Opentrons/opentrons/issues/1653)
* **app:** Add persistent unique user ID to intercom data ([#2004](https://github.com/Opentrons/opentrons/issues/2004)) ([0a47d64](https://github.com/Opentrons/opentrons/commit/0a47d64)), closes [#1999](https://github.com/Opentrons/opentrons/issues/1999)
* **app:** Add robot name to intercom on connect ([#2069](https://github.com/Opentrons/opentrons/issues/2069)) ([f5be08d](https://github.com/Opentrons/opentrons/commit/f5be08d))
* **app:** Add update channel selector to advanced settings ([#2010](https://github.com/Opentrons/opentrons/issues/2010)) ([f7fb865](https://github.com/Opentrons/opentrons/commit/f7fb865))
* **app:** Add upload protocol warning modal ([#1988](https://github.com/Opentrons/opentrons/issues/1988)) ([8e010cf](https://github.com/Opentrons/opentrons/commit/8e010cf)), closes [#1032](https://github.com/Opentrons/opentrons/issues/1032)
* **app:** Enable download robot logs in advanced settings ([#2014](https://github.com/Opentrons/opentrons/issues/2014)) ([6e51ba0](https://github.com/Opentrons/opentrons/commit/6e51ba0)), closes [#1727](https://github.com/Opentrons/opentrons/issues/1727)
* **app:** Enable support for IPv4 wired robots by default ([#2090](https://github.com/Opentrons/opentrons/issues/2090)) ([d3a3afa](https://github.com/Opentrons/opentrons/commit/d3a3afa)), closes [#990](https://github.com/Opentrons/opentrons/issues/990) [#1964](https://github.com/Opentrons/opentrons/issues/1964)
* **app:** Persist known robots to file-system when using new discovery ([#2065](https://github.com/Opentrons/opentrons/issues/2065)) ([55b4000](https://github.com/Opentrons/opentrons/commit/55b4000))
* **app,api:** Add opt-in ping/pong monitoring to RPC websocket ([#2083](https://github.com/Opentrons/opentrons/issues/2083)) ([a9b3f0e](https://github.com/Opentrons/opentrons/commit/a9b3f0e)), closes [#2052](https://github.com/Opentrons/opentrons/issues/2052)





<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)


### Bug Fixes

* **app:** Check if modulesRequired when displaying review modals ([#1940](https://github.com/Opentrons/opentrons/issues/1940)) ([14a54a5](https://github.com/Opentrons/opentrons/commit/14a54a5))


### Features

* **app:** Add and implement module selectors in calibration ([#1895](https://github.com/Opentrons/opentrons/issues/1895)) ([2cf1b4d](https://github.com/Opentrons/opentrons/commit/2cf1b4d))
* **app:** Add continuous polling to modules during run ([#1961](https://github.com/Opentrons/opentrons/issues/1961)) ([5f7d6f4](https://github.com/Opentrons/opentrons/commit/5f7d6f4))
* **app:** Add deck map to module review modal ([#1910](https://github.com/Opentrons/opentrons/issues/1910)) ([f2e63e3](https://github.com/Opentrons/opentrons/commit/f2e63e3)), closes [#1737](https://github.com/Opentrons/opentrons/issues/1737)
* **app:** Add realtime status TempDeck card to run panel ([#1932](https://github.com/Opentrons/opentrons/issues/1932)) ([75c8df4](https://github.com/Opentrons/opentrons/commit/75c8df4)), closes [#1740](https://github.com/Opentrons/opentrons/issues/1740)
* **app:** Add support for modules to RPC API client ([#1891](https://github.com/Opentrons/opentrons/issues/1891)) ([331305f](https://github.com/Opentrons/opentrons/commit/331305f))
* **app:** Render calibrate to bottom instructions when enabled ([#1865](https://github.com/Opentrons/opentrons/issues/1865)) ([c427599](https://github.com/Opentrons/opentrons/commit/c427599))
* **app:** Show connect modules modal when session modules detected ([#1897](https://github.com/Opentrons/opentrons/issues/1897)) ([8306130](https://github.com/Opentrons/opentrons/commit/8306130)), closes [#1738](https://github.com/Opentrons/opentrons/issues/1738)
* **app:** Show module name over labware on deckmaps ([#1913](https://github.com/Opentrons/opentrons/issues/1913)) ([c40905b](https://github.com/Opentrons/opentrons/commit/c40905b)), closes [#1739](https://github.com/Opentrons/opentrons/issues/1739)
* **app:** Show modules on review and calibration deckmaps ([#1898](https://github.com/Opentrons/opentrons/issues/1898)) ([5917a2b](https://github.com/Opentrons/opentrons/commit/5917a2b))
* **app:** Wire modules card to API calls (and keep stubbed response) ([#1860](https://github.com/Opentrons/opentrons/issues/1860)) ([a30912f](https://github.com/Opentrons/opentrons/commit/a30912f))





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Bug Fixes

* **app:** Call GET /pipettes before starting calibration ([#1830](https://github.com/Opentrons/opentrons/issues/1830)) ([011a3a8](https://github.com/Opentrons/opentrons/commit/011a3a8))
* **app:** Disable calibration page unless protocol is fresh ([#1821](https://github.com/Opentrons/opentrons/issues/1821)) ([c9168c8](https://github.com/Opentrons/opentrons/commit/c9168c8)), closes [#1817](https://github.com/Opentrons/opentrons/issues/1817)
* **app:** Make WiFi card more lenient and understandable ([#1771](https://github.com/Opentrons/opentrons/issues/1771)) ([6f2f37d](https://github.com/Opentrons/opentrons/commit/6f2f37d))
* **app:** Remove holdover /calibrate/instruments missed by [#1765](https://github.com/Opentrons/opentrons/issues/1765) ([#1787](https://github.com/Opentrons/opentrons/issues/1787)) ([03dd305](https://github.com/Opentrons/opentrons/commit/03dd305))
* **app:** Remove tip-probed check in calibrator selector ([#1847](https://github.com/Opentrons/opentrons/issues/1847)) ([bb50677](https://github.com/Opentrons/opentrons/commit/bb50677))
* **app:** Show spinner during home on deck calibration exit ([#1760](https://github.com/Opentrons/opentrons/issues/1760)) ([b6999a8](https://github.com/Opentrons/opentrons/commit/b6999a8)), closes [#1613](https://github.com/Opentrons/opentrons/issues/1613)
* **components:** fix Deck component viewBox ([#1807](https://github.com/Opentrons/opentrons/issues/1807)) ([bff921f](https://github.com/Opentrons/opentrons/commit/bff921f))
* **components:** Make preventDefault call in HandleKeypress opt-in ([#1768](https://github.com/Opentrons/opentrons/issues/1768)) ([9e64fb2](https://github.com/Opentrons/opentrons/commit/9e64fb2)), closes [#1764](https://github.com/Opentrons/opentrons/issues/1764)


### Features

* **app:** Add advanced settings card to robot settings page ([#1762](https://github.com/Opentrons/opentrons/issues/1762)) ([b70f9b8](https://github.com/Opentrons/opentrons/commit/b70f9b8)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Add attached modules card UI to instrument settings page ([#1854](https://github.com/Opentrons/opentrons/issues/1854)) ([3a57807](https://github.com/Opentrons/opentrons/commit/3a57807)), closes [#1735](https://github.com/Opentrons/opentrons/issues/1735)
* **app:** Add GET /modules to API client ([#1837](https://github.com/Opentrons/opentrons/issues/1837)) ([da88936](https://github.com/Opentrons/opentrons/commit/da88936))
* **app:** Add keyboard shortcuts to jog controls ([#1761](https://github.com/Opentrons/opentrons/issues/1761)) ([7c51e98](https://github.com/Opentrons/opentrons/commit/7c51e98)), closes [#1476](https://github.com/Opentrons/opentrons/issues/1476)
* **app:** Add modules and pipettes settings page ([#1785](https://github.com/Opentrons/opentrons/issues/1785)) ([7ce12b3](https://github.com/Opentrons/opentrons/commit/7ce12b3))
* **app:** Add robot settings toggles to Advanced Settings card ([#1795](https://github.com/Opentrons/opentrons/issues/1795)) ([73f7528](https://github.com/Opentrons/opentrons/commit/73f7528)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Log tracebacks from failed RPC calls  ([#1846](https://github.com/Opentrons/opentrons/issues/1846)) ([0c07c52](https://github.com/Opentrons/opentrons/commit/0c07c52)), closes [#1841](https://github.com/Opentrons/opentrons/issues/1841)




<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package @opentrons/app





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)


### Bug Fixes

* **app:** Fix overlay and redirect duplication in robot settings page ([#1759](https://github.com/Opentrons/opentrons/issues/1759)) ([ce94b22](https://github.com/Opentrons/opentrons/commit/ce94b22))
* **components:** Resize main navbar and title bar to match designs ([#1757](https://github.com/Opentrons/opentrons/issues/1757)) ([4d46011](https://github.com/Opentrons/opentrons/commit/4d46011)), closes [#1285](https://github.com/Opentrons/opentrons/issues/1285)





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)


### Features

* **app:** Connect home button to API on robot settings ([#1726](https://github.com/Opentrons/opentrons/issues/1726)) ([103d8c0](https://github.com/Opentrons/opentrons/commit/103d8c0)), closes [#856](https://github.com/Opentrons/opentrons/issues/856)





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)


### Bug Fixes

* **app:** Enable robot update even if API reports up-to-date ([#1721](https://github.com/Opentrons/opentrons/issues/1721)) ([16bb8eb](https://github.com/Opentrons/opentrons/commit/16bb8eb))
* **app:** Fix alignment issues in modals, fix titlebar on page ([#1719](https://github.com/Opentrons/opentrons/issues/1719)) ([ccf4881](https://github.com/Opentrons/opentrons/commit/ccf4881))
* **app:** Switch to hash routes to enable goBack in prod ([#1722](https://github.com/Opentrons/opentrons/issues/1722)) ([9bf2398](https://github.com/Opentrons/opentrons/commit/9bf2398))


### Features

* **app:** Add toggle to turn on/off robot rail lights ([#1710](https://github.com/Opentrons/opentrons/issues/1710)) ([d2c182c](https://github.com/Opentrons/opentrons/commit/d2c182c)), closes [#1684](https://github.com/Opentrons/opentrons/issues/1684)
* **app:** Show connect alert banner on successful connection ([#1700](https://github.com/Opentrons/opentrons/issues/1700)) ([70cd8b2](https://github.com/Opentrons/opentrons/commit/70cd8b2)), closes [#1314](https://github.com/Opentrons/opentrons/issues/1314)





<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)


### Bug Fixes

* **app:** Add priority 2 analytics events ([#1627](https://github.com/Opentrons/opentrons/issues/1627)) ([08e622e](https://github.com/Opentrons/opentrons/commit/08e622e)), closes [#1553](https://github.com/Opentrons/opentrons/issues/1553)
* **app:** Hide modal title in pick up tip spinner ([#1635](https://github.com/Opentrons/opentrons/issues/1635)) ([1509f1a](https://github.com/Opentrons/opentrons/commit/1509f1a)), closes [#1630](https://github.com/Opentrons/opentrons/issues/1630)
* **app:** Reset calibration state on reset run ([#1682](https://github.com/Opentrons/opentrons/issues/1682)) ([689e586](https://github.com/Opentrons/opentrons/commit/689e586)), closes [#1597](https://github.com/Opentrons/opentrons/issues/1597)
* **app:** Tip probe clears labware calibration progress ([#1634](https://github.com/Opentrons/opentrons/issues/1634)) ([9d216a4](https://github.com/Opentrons/opentrons/commit/9d216a4)), closes [#1620](https://github.com/Opentrons/opentrons/issues/1620)
* **app:** Update cancel button text ([#1644](https://github.com/Opentrons/opentrons/issues/1644)) ([c0870d8](https://github.com/Opentrons/opentrons/commit/c0870d8)), closes [#1639](https://github.com/Opentrons/opentrons/issues/1639)
* **app:** Update Z calibration slot 5 diagram ([#1638](https://github.com/Opentrons/opentrons/issues/1638)) ([35e50cb](https://github.com/Opentrons/opentrons/commit/35e50cb)), closes [#1608](https://github.com/Opentrons/opentrons/issues/1608)


### Features

* **app:** Add firmware version to robot settings page ([#1633](https://github.com/Opentrons/opentrons/issues/1633)) ([9a32383](https://github.com/Opentrons/opentrons/commit/9a32383))
* **app:** Add resources page to more section ([#1631](https://github.com/Opentrons/opentrons/issues/1631)) ([443afc0](https://github.com/Opentrons/opentrons/commit/443afc0)), closes [#1607](https://github.com/Opentrons/opentrons/issues/1607)
* **app:** Capture and display errors during deck calibration ([#1680](https://github.com/Opentrons/opentrons/issues/1680)) ([4f75ed7](https://github.com/Opentrons/opentrons/commit/4f75ed7)), closes [#1641](https://github.com/Opentrons/opentrons/issues/1641)
* **app:** Pass server-lib and firmware to /server/update ([#1679](https://github.com/Opentrons/opentrons/issues/1679)) ([4dc8a76](https://github.com/Opentrons/opentrons/commit/4dc8a76)), closes [#1115](https://github.com/Opentrons/opentrons/issues/1115)
* **app:** Toggle devtools feature flag in app settings ([#1678](https://github.com/Opentrons/opentrons/issues/1678)) ([6676903](https://github.com/Opentrons/opentrons/commit/6676903)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
