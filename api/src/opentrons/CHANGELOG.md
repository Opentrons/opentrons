# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.11.0-alpha.5](https://github.com/Opentrons/opentrons/compare/v3.11.0-alpha.4...v3.11.0-alpha.5) (2019-08-19)

**Note:** Version bump only for package @opentrons/api-server





# [3.11.0-alpha.4](https://github.com/Opentrons/opentrons/compare/v3.11.0-alpha.3...v3.11.0-alpha.4) (2019-08-19)

**Note:** Version bump only for package @opentrons/api-server





# [3.11.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v3.10.3...v3.11.0-alpha.2) (2019-08-16)


### Bug Fixes

* **api:** apiv1: fix transfer volume ([#3792](https://github.com/Opentrons/opentrons/issues/3792)) ([e3099af](https://github.com/Opentrons/opentrons/commit/e3099af))
* **api:** apiv2: fix mix, blowout in advanced steps ([#3799](https://github.com/Opentrons/opentrons/issues/3799)) ([48fc442](https://github.com/Opentrons/opentrons/commit/48fc442)), closes [#3719](https://github.com/Opentrons/opentrons/issues/3719)
* **api:** apiv2: fix overaspiration after blowout ([#3801](https://github.com/Opentrons/opentrons/issues/3801)) ([61e82c3](https://github.com/Opentrons/opentrons/commit/61e82c3)), closes [#3797](https://github.com/Opentrons/opentrons/issues/3797)
* **api:** Do not publish commands for RPC pause/resume in APIv1 ([#3850](https://github.com/Opentrons/opentrons/issues/3850)) ([72952ba](https://github.com/Opentrons/opentrons/commit/72952ba))
* **api:** duplicate mix with blowout during transfer ([#3810](https://github.com/Opentrons/opentrons/issues/3810)) ([9a70c36](https://github.com/Opentrons/opentrons/commit/9a70c36)), closes [#2607](https://github.com/Opentrons/opentrons/issues/2607)
* **api:** force nmcli to actively check for connectivity ([#3811](https://github.com/Opentrons/opentrons/issues/3811)) ([c200de3](https://github.com/Opentrons/opentrons/commit/c200de3)), closes [#3768](https://github.com/Opentrons/opentrons/issues/3768)


### Features

* **api:** Add a log aggregation optout ([#3868](https://github.com/Opentrons/opentrons/issues/3868)) ([ccb0b94](https://github.com/Opentrons/opentrons/commit/ccb0b94)), closes [#3866](https://github.com/Opentrons/opentrons/issues/3866)
* **api:** apiv2: prevent over-aspiration with filter tips ([#3781](https://github.com/Opentrons/opentrons/issues/3781)) ([4cc3023](https://github.com/Opentrons/opentrons/commit/4cc3023))
* **api:** cycle temperatures, pause, cancel, and resume to TC control ([#3839](https://github.com/Opentrons/opentrons/issues/3839)) ([6841419](https://github.com/Opentrons/opentrons/commit/6841419)), closes [#3581](https://github.com/Opentrons/opentrons/issues/3581)
* **api:** move gantry to safe spot while TC lid moves ([#3807](https://github.com/Opentrons/opentrons/issues/3807)) ([752295c](https://github.com/Opentrons/opentrons/commit/752295c))
* **app:** display TC on Deck Map ([#3786](https://github.com/Opentrons/opentrons/issues/3786)) ([272a6ad](https://github.com/Opentrons/opentrons/commit/272a6ad)), closes [#3553](https://github.com/Opentrons/opentrons/issues/3553) [#3064](https://github.com/Opentrons/opentrons/issues/3064)
* **app, api:** Key calibration by parent-type/labware-type combo ([#3800](https://github.com/Opentrons/opentrons/issues/3800)) ([ba0df67](https://github.com/Opentrons/opentrons/commit/ba0df67)), closes [#3775](https://github.com/Opentrons/opentrons/issues/3775)





<a name="3.10.3"></a>
## [3.10.3](https://github.com/Opentrons/opentrons/compare/v3.10.2...v3.10.3) (2019-07-26)


### Bug Fixes

* **api:** revert: "feat(api): prevent over-aspiration with filter tips in v1 ([#3692](https://github.com/opentrons/opentrons/issues/3692)) ([bd0808d](https://github.com/Opentrons/opentrons/commit/bd0808d726b7b17c35fa0116638b28f143d140e0))



<a name="3.10.2"></a>
## [3.10.2](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.2) (2019-07-25)


### Bug Fixes

* **api:** Allow gen2 reference in protocol without pipette attached ([#3760](https://github.com/Opentrons/opentrons/issues/3760)) ([e6c0b48](https://github.com/Opentrons/opentrons/commit/e6c0b48))
* **api:** apiv1: handle partial db schema changes ([#3783](https://github.com/Opentrons/opentrons/issues/3783)) ([5d52cd7](https://github.com/Opentrons/opentrons/commit/5d52cd7))
* **api:** Save the difference between offsets in labwarev2 cal ([#3782](https://github.com/Opentrons/opentrons/commit/35a095aa5d74e02a183c71ddf58ad7ee97360a6a))
* **api:** apiv2: Correctly handle flow rates and plunger speeds ([#3739](https://github.com/Opentrons/opentrons/issues/3739)) ([01c0fcb](https://github.com/Opentrons/opentrons/commit/01c0fcb)), closes [#3737](https://github.com/Opentrons/opentrons/issues/3737) [#3270](https://github.com/Opentrons/opentrons/issues/3270)
* **api:** apiv2: Display locs for drop/pickup from implicit locs ([#3774](https://github.com/Opentrons/opentrons/issues/3774)) ([cf7710f](https://github.com/Opentrons/opentrons/commit/cf7710f)), closes [#3364](https://github.com/Opentrons/opentrons/issues/3364)
* **api:** apiv2: fix protocol cancel ([#3725](https://github.com/Opentrons/opentrons/issues/3725)) ([b2b8c46](https://github.com/Opentrons/opentrons/commit/b2b8c46))
* **api:** apiv2: simulator should find pipettes by name versus model ([#3779](https://github.com/Opentrons/opentrons/issues/3779)) ([a0fd72b](https://github.com/Opentrons/opentrons/commit/a0fd72b))
* **api:** fix blow out logic ([#3764](https://github.com/Opentrons/opentrons/issues/3764)) ([fb99bf0](https://github.com/Opentrons/opentrons/commit/fb99bf0))
* **api:** Modify delay and motors which are disengaged ([#3770](https://github.com/Opentrons/opentrons/issues/3770)) ([1eb760c](https://github.com/Opentrons/opentrons/commit/1eb760c))
* **api:** Remove model name check for non-gen2 pipettes ([#3761](https://github.com/Opentrons/opentrons/issues/3761)) ([263b536](https://github.com/Opentrons/opentrons/commit/263b536))
* **api:** Use pip config presses by default ([#3778](https://github.com/Opentrons/opentrons/issues/3778)) ([8fce1a9](https://github.com/Opentrons/opentrons/commit/8fce1a9))
* **factory_scripts:** Remove old func name and refactor IP look-up ([#3763](https://github.com/Opentrons/opentrons/issues/3763)) ([2847cad](https://github.com/Opentrons/opentrons/commit/2847cad))


### Features

* **api:** Make blow out flow rate settable ([#3735](https://github.com/Opentrons/opentrons/issues/3735)) ([e12b4fd](https://github.com/Opentrons/opentrons/commit/e12b4fd)), closes [#3733](https://github.com/Opentrons/opentrons/issues/3733)
* **api:** prevent over-aspiration with filter tips in v1  ([#3692](https://github.com/Opentrons/opentrons/issues/3692)) ([487927a](https://github.com/Opentrons/opentrons/commit/487927a))
* **shared-data:** add displayCategory to pipetteNameSpecs and schema ([#3731](https://github.com/Opentrons/opentrons/issues/3731)) ([3b39dea](https://github.com/Opentrons/opentrons/commit/3b39dea))





<a name="3.10.1"></a>
## [3.10.1](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.1) (2019-07-19)


### Bug Fixes

* **api:** apiv2: Correctly handle flow rates and plunger speeds ([#3739](https://github.com/Opentrons/opentrons/issues/3739)) ([01c0fcb](https://github.com/Opentrons/opentrons/commit/01c0fcb)), closes [#3737](https://github.com/Opentrons/opentrons/issues/3737) [#3270](https://github.com/Opentrons/opentrons/issues/3270)
* **api:** apiv2: fix protocol cancel ([#3725](https://github.com/Opentrons/opentrons/issues/3725)) ([b2b8c46](https://github.com/Opentrons/opentrons/commit/b2b8c46))


### Features

* **api:** Make blow out flow rate settable ([#3735](https://github.com/Opentrons/opentrons/issues/3735)) ([e12b4fd](https://github.com/Opentrons/opentrons/commit/e12b4fd)), closes [#3733](https://github.com/Opentrons/opentrons/issues/3733)
* **shared-data:** add displayCategory to pipetteNameSpecs and schema ([#3731](https://github.com/Opentrons/opentrons/issues/3731)) ([3b39dea](https://github.com/Opentrons/opentrons/commit/3b39dea))





<a name="3.10.0"></a>
# [3.10.0](https://github.com/Opentrons/opentrons/compare/v3.9.0...v3.10.0) (2019-07-15)


### Bug Fixes

* **api:** Account for tip length in deck cal move-to-front ([#3495](https://github.com/Opentrons/opentrons/issues/3495)) ([01dfaa8](https://github.com/Opentrons/opentrons/commit/01dfaa8))
* **api:** Add new biorad def name to engage height list ([#3717](https://github.com/Opentrons/opentrons/issues/3717)) ([9b8ce91](https://github.com/Opentrons/opentrons/commit/9b8ce91))
* **api:** always ensure labware db is up to date ([#3713](https://github.com/Opentrons/opentrons/issues/3713)) ([e0a5cc1](https://github.com/Opentrons/opentrons/commit/e0a5cc1))
* **api:** Correct labwarev2 reservoirs on apiv1 ([#3706](https://github.com/Opentrons/opentrons/issues/3706)) ([397f17e](https://github.com/Opentrons/opentrons/commit/397f17e))
* **api:** do not handle smoothie alarms from halt() ([#3721](https://github.com/Opentrons/opentrons/issues/3721)) ([1e72261](https://github.com/Opentrons/opentrons/commit/1e72261))
* **api:** Fix api v2 deck cal ([#3550](https://github.com/Opentrons/opentrons/issues/3550)) ([953abad](https://github.com/Opentrons/opentrons/commit/953abad))
* **api:** Fix first-boot smoothie updates for apiv2 ([#3519](https://github.com/Opentrons/opentrons/issues/3519)) ([2c0800d](https://github.com/Opentrons/opentrons/commit/2c0800d)), closes [#3501](https://github.com/Opentrons/opentrons/issues/3501)
* **api:** Fix module calibration in API V2 ([#3675](https://github.com/Opentrons/opentrons/issues/3675)) ([d214c5a](https://github.com/Opentrons/opentrons/commit/d214c5a))
* **api:** increase serial response timeout for thermocycler ([#3711](https://github.com/Opentrons/opentrons/issues/3711)) ([4018870](https://github.com/Opentrons/opentrons/commit/4018870))
* **api:** Make BCRobot fw_version sync again ([#3688](https://github.com/Opentrons/opentrons/issues/3688)) ([067fe4c](https://github.com/Opentrons/opentrons/commit/067fe4c))
* **api:** Remove usage of time.clock() ([#3635](https://github.com/Opentrons/opentrons/issues/3635)) ([a9c7237](https://github.com/Opentrons/opentrons/commit/a9c7237))
* **api:** Synchronize access to the smoothie and rpc ([#3528](https://github.com/Opentrons/opentrons/issues/3528)) ([628c6c4](https://github.com/Opentrons/opentrons/commit/628c6c4)), closes [#3527](https://github.com/Opentrons/opentrons/issues/3527)
* **api:** unrestrict thermocycler lid at api level for testing ([#3705](https://github.com/Opentrons/opentrons/issues/3705)) ([f46ad49](https://github.com/Opentrons/opentrons/commit/f46ad49))


### Features

* **api:** Add a quirk for return tip height ([#3687](https://github.com/Opentrons/opentrons/issues/3687)) ([3a89b69](https://github.com/Opentrons/opentrons/commit/3a89b69))
* **api:** Add Gen2 multichannel pipette api support ([#3691](https://github.com/Opentrons/opentrons/issues/3691)) ([d1ae1ed](https://github.com/Opentrons/opentrons/commit/d1ae1ed))
* **api:** Add hardware control socket server ([#3633](https://github.com/Opentrons/opentrons/issues/3633)) ([6cac0b5](https://github.com/Opentrons/opentrons/commit/6cac0b5)), closes [#3544](https://github.com/Opentrons/opentrons/issues/3544)
* **api:** add missing TC stuff for science testing ([#3348](https://github.com/Opentrons/opentrons/issues/3348)) ([0640c7a](https://github.com/Opentrons/opentrons/commit/0640c7a))
* **api:** Add speed settings to apiv2 ([#3708](https://github.com/Opentrons/opentrons/issues/3708)) ([45ec246](https://github.com/Opentrons/opentrons/commit/45ec246))
* **api:** Always remove v2 calibration ([#3701](https://github.com/Opentrons/opentrons/issues/3701)) ([dea5d40](https://github.com/Opentrons/opentrons/commit/dea5d40)), closes [#3700](https://github.com/Opentrons/opentrons/issues/3700)
* **api:** default to labware version 1, not latest ([#3667](https://github.com/Opentrons/opentrons/issues/3667)) ([53b48ba](https://github.com/Opentrons/opentrons/commit/53b48ba)), closes [#3664](https://github.com/Opentrons/opentrons/issues/3664)
* **api:** do not use labware otId ([#3515](https://github.com/Opentrons/opentrons/issues/3515)) ([744075f](https://github.com/Opentrons/opentrons/commit/744075f))
* **api:** reference calibration data via hash of labware def ([#3498](https://github.com/Opentrons/opentrons/issues/3498)) ([0475586](https://github.com/Opentrons/opentrons/commit/0475586)), closes [#3493](https://github.com/Opentrons/opentrons/issues/3493)
* **api:** save labware under namespace/load_name/version ([#3487](https://github.com/Opentrons/opentrons/issues/3487)) ([400d6e6](https://github.com/Opentrons/opentrons/commit/400d6e6)), closes [#3474](https://github.com/Opentrons/opentrons/issues/3474)
* **app:** add support for v2 labware ([#3590](https://github.com/Opentrons/opentrons/issues/3590)) ([0b74937](https://github.com/Opentrons/opentrons/commit/0b74937)), closes [#3451](https://github.com/Opentrons/opentrons/issues/3451)
* **labware:** update labware mapping ([#3636](https://github.com/Opentrons/opentrons/issues/3636)) ([a1e6005](https://github.com/Opentrons/opentrons/commit/a1e6005)), closes [#3605](https://github.com/Opentrons/opentrons/issues/3605)
* **protocol-designer:** save v3 protocols ([#3588](https://github.com/Opentrons/opentrons/issues/3588)) ([40f3a9e](https://github.com/Opentrons/opentrons/commit/40f3a9e)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336) [#3414](https://github.com/Opentrons/opentrons/issues/3414)





<a name="3.9.0"></a>
# [3.9.0](https://github.com/Opentrons/opentrons/compare/v3.8.3...v3.9.0) (2019-05-29)


### Bug Fixes

* **api:** Add separate key for new steps per mm shape ([#3499](https://github.com/Opentrons/opentrons/issues/3499)) ([50bb2a9](https://github.com/Opentrons/opentrons/commit/50bb2a9))
* **api:** Don't talk about apiv2 if you can't find a labware ([#3435](https://github.com/Opentrons/opentrons/issues/3435)) ([d31f1a5](https://github.com/Opentrons/opentrons/commit/d31f1a5))
* **api:** Fix default transfer tip behavior ([#3486](https://github.com/Opentrons/opentrons/issues/3486)) ([4534e6f](https://github.com/Opentrons/opentrons/commit/4534e6f))
* **api:** Handle smoothie update better ([#3437](https://github.com/Opentrons/opentrons/issues/3437)) ([d2569d8](https://github.com/Opentrons/opentrons/commit/d2569d8))


### Features

* **api:** Add backwards compatibility to old pipette constructors ([#3438](https://github.com/Opentrons/opentrons/issues/3438)) ([25cf5fe](https://github.com/Opentrons/opentrons/commit/25cf5fe))
* **api:** Add G Code for pipette config in driver ([#3388](https://github.com/Opentrons/opentrons/issues/3388)) ([77fffa6](https://github.com/Opentrons/opentrons/commit/77fffa6))
* **api:** add pipette plus constructors ([#3407](https://github.com/Opentrons/opentrons/issues/3407)) ([f4feee9](https://github.com/Opentrons/opentrons/commit/f4feee9))
* **api:** Add pipette+ to write_pipette_memory ([#3405](https://github.com/Opentrons/opentrons/issues/3405)) ([1b35ed1](https://github.com/Opentrons/opentrons/commit/1b35ed1))
* **api:** Allow loading labware v2 definitions directly into apiv1 ([#3466](https://github.com/Opentrons/opentrons/issues/3466)) ([a3201fb](https://github.com/Opentrons/opentrons/commit/a3201fb))
* **api:** apiv2: allow returning tips to the tip tracker ([#3470](https://github.com/Opentrons/opentrons/issues/3470)) ([0c73aa1](https://github.com/Opentrons/opentrons/commit/0c73aa1))
* **api:** buildroot: allow separate setting of upstream log level ([#3436](https://github.com/Opentrons/opentrons/issues/3436)) ([ebc41a4](https://github.com/Opentrons/opentrons/commit/ebc41a4)), closes [#3422](https://github.com/Opentrons/opentrons/issues/3422)
* **api:** Detect and change behavior for buildroot system ([#3367](https://github.com/Opentrons/opentrons/issues/3367)) ([a439f5b](https://github.com/Opentrons/opentrons/commit/a439f5b))
* **api:** Enable Double Drop Quirk ([#3485](https://github.com/Opentrons/opentrons/issues/3485)) ([e864150](https://github.com/Opentrons/opentrons/commit/e864150))
* **api:** Make pipette quirks configurable ([#3463](https://github.com/Opentrons/opentrons/issues/3463)) ([3513794](https://github.com/Opentrons/opentrons/commit/3513794))
* **api:** support running v3 protocols in APIv1 ([#3468](https://github.com/Opentrons/opentrons/issues/3468)) ([0ff1ab6](https://github.com/Opentrons/opentrons/commit/0ff1ab6)), closes [#3449](https://github.com/Opentrons/opentrons/issues/3449)
* **repo:** change v2 labware len/width fields ([#3410](https://github.com/Opentrons/opentrons/issues/3410)) ([0ef0bd5](https://github.com/Opentrons/opentrons/commit/0ef0bd5))


<a name="3.8.3"></a>
## [3.8.3](https://github.com/Opentrons/opentrons/compare/v3.8.2...v3.8.3) (2019-04-30)


### Features

* **api:** Add new 10ul tiprack ([#3393](https://github.com/Opentrons/opentrons/issues/3393)) ([a7c15cc](https://github.com/Opentrons/opentrons/commit/a7c15cc))


<a name="3.8.2"></a>
## [3.8.2](https://github.com/Opentrons/opentrons/compare/v3.8.1...v3.8.2) (2019-04-23)


### Bug Fixes

* **api:** Do not sleep in simulated delays ([#3347](https://github.com/Opentrons/opentrons/issues/3347)) ([e12e200](https://github.com/Opentrons/opentrons/commit/e12e200)), closes [#3346](https://github.com/Opentrons/opentrons/issues/3346)
* **api:** Remove module load regression in V2 ([#3288](https://github.com/Opentrons/opentrons/issues/3288)) ([7fe143a](https://github.com/Opentrons/opentrons/commit/7fe143a))


### Features

* **api:** Add Geometry Logic For Thermocycler Configurations ([#3266](https://github.com/Opentrons/opentrons/issues/3266)) ([4d8e463](https://github.com/Opentrons/opentrons/commit/4d8e463))
* **api:** define & execute v3 json protocols ([#3312](https://github.com/Opentrons/opentrons/issues/3312)) ([988407d](https://github.com/Opentrons/opentrons/commit/988407d)), closes [#3110](https://github.com/Opentrons/opentrons/issues/3110)
* **api:** publish pause and delay commands in python and JSON ([#3310](https://github.com/Opentrons/opentrons/issues/3310)) ([5656d65](https://github.com/Opentrons/opentrons/commit/5656d65)), closes [#3308](https://github.com/Opentrons/opentrons/issues/3308)
* **api:** validate JSON protocols before executing ([#3318](https://github.com/Opentrons/opentrons/issues/3318)) ([9c15f7d](https://github.com/Opentrons/opentrons/commit/9c15f7d)), closes [#3250](https://github.com/Opentrons/opentrons/issues/3250)
* **api:** wire up TC deactivate, and add module cmd exec endpoint ([#3264](https://github.com/Opentrons/opentrons/issues/3264)) ([483122a](https://github.com/Opentrons/opentrons/commit/483122a)), closes [#2981](https://github.com/Opentrons/opentrons/issues/2981)
* **update-server:** add buildroot migration ([#3321](https://github.com/Opentrons/opentrons/issues/3321)) ([76d6b28](https://github.com/Opentrons/opentrons/commit/76d6b28)), closes [#2880](https://github.com/Opentrons/opentrons/issues/2880) [#2881](https://github.com/Opentrons/opentrons/issues/2881)





<a name="3.8.1"></a>
## [3.8.1](https://github.com/Opentrons/opentrons/compare/v3.8.0...v3.8.1) (2019-03-29)


### Bug Fixes

* **api:** Correctly migrate probe center settings ([#3246](https://github.com/Opentrons/opentrons/issues/3246)) ([84d3b00](https://github.com/Opentrons/opentrons/commit/84d3b00))
* **api:** simulate needs to set loglevel ([#3268](https://github.com/Opentrons/opentrons/issues/3268)) ([37c00fb](https://github.com/Opentrons/opentrons/commit/37c00fb))
* **api,shared-data:** Lowercase labware names and camelCase categories ([#3234](https://github.com/Opentrons/opentrons/issues/3234)) ([55e332e](https://github.com/Opentrons/opentrons/commit/55e332e)), closes [#3231](https://github.com/Opentrons/opentrons/issues/3231)
* **app:** Fix modules not populating the modules card ([#3278](https://github.com/Opentrons/opentrons/issues/3278)) ([1fd936d](https://github.com/Opentrons/opentrons/commit/1fd936d))


### Features

* **api:** Add more pick up tip config elements to pipette config ([#3237](https://github.com/Opentrons/opentrons/issues/3237)) ([f69da42](https://github.com/Opentrons/opentrons/commit/f69da42))
* **api:** Add support for (p300m,p50m,p10s,p1000s)v1.5 ([#3265](https://github.com/Opentrons/opentrons/issues/3265)) ([9dfc127](https://github.com/Opentrons/opentrons/commit/9dfc127))
* **api:** add z margin override ([#3235](https://github.com/Opentrons/opentrons/issues/3235)) ([341385c](https://github.com/Opentrons/opentrons/commit/341385c))
* **api:** allow robot to discover thermocycler and return live data ([#3239](https://github.com/Opentrons/opentrons/issues/3239)) ([34af269](https://github.com/Opentrons/opentrons/commit/34af269)), closes [#2958](https://github.com/Opentrons/opentrons/issues/2958)
* **api:** move-to-slot JSON protocol command ([#3242](https://github.com/Opentrons/opentrons/issues/3242)) ([cef5123](https://github.com/Opentrons/opentrons/commit/cef5123))
* **api:** Print out the runlog in the simulate script ([#3251](https://github.com/Opentrons/opentrons/issues/3251)) ([73d755f](https://github.com/Opentrons/opentrons/commit/73d755f))





<a name="3.8.0"></a>
# [3.8.0](https://github.com/Opentrons/opentrons/compare/v3.7.0...v3.8.0) (2019-03-19)


### Bug Fixes

* **api:** Access wells in calibration so 1-well containers are ok ([#3187](https://github.com/Opentrons/opentrons/issues/3187)) ([05ad4b1](https://github.com/Opentrons/opentrons/commit/05ad4b1))
* **api:** force update tempdeck target temp cache ([#3223](https://github.com/Opentrons/opentrons/issues/3223)) ([175461b](https://github.com/Opentrons/opentrons/commit/175461b)), closes [#3218](https://github.com/Opentrons/opentrons/issues/3218)
* **api:** cache modules in singleton for apiV1 protocols ([#3219](https://github.com/Opentrons/opentrons/issues/3219)) ([058319f](https://github.com/Opentrons/opentrons/commit/058319f)), closes [#3205](https://github.com/Opentrons/opentrons/issues/3205)
* **api:** Clear globals in simulate script thing ([#3156](https://github.com/Opentrons/opentrons/issues/3156)) ([58ddfb6](https://github.com/Opentrons/opentrons/commit/58ddfb6))
* **api:** cli deck cal pipette control and tests ([#3222](https://github.com/Opentrons/opentrons/issues/3222)) ([0e95e08](https://github.com/Opentrons/opentrons/commit/0e95e08))
* **api:** Fix the mount calibration pipette control ([#3228](https://github.com/Opentrons/opentrons/issues/3228)) ([962b0a7](https://github.com/Opentrons/opentrons/commit/962b0a7))
* **api:** Manually publish to broker in param-mangling commands ([#3159](https://github.com/Opentrons/opentrons/issues/3159)) ([17e86bf](https://github.com/Opentrons/opentrons/commit/17e86bf)), closes [#3105](https://github.com/Opentrons/opentrons/issues/3105)


### Features

* **api:** Add interruptable poller to Thermocycler driver & API with lid open/close ([#3118](https://github.com/Opentrons/opentrons/issues/3118)) ([b04add2](https://github.com/Opentrons/opentrons/commit/b04add2))
* **api:** add pipette config endpoint ([#3128](https://github.com/Opentrons/opentrons/issues/3128)) ([b6b958b](https://github.com/Opentrons/opentrons/commit/b6b958b))
* **api:** Add set_temperature command to API and driver ([#3152](https://github.com/Opentrons/opentrons/issues/3152)) ([bde3b1c](https://github.com/Opentrons/opentrons/commit/bde3b1c)), closes [#2979](https://github.com/Opentrons/opentrons/issues/2979)
* **api:** add udev rule for thermocycler board, include rule file in makefile ([#3203](https://github.com/Opentrons/opentrons/issues/3203)) ([d47fee0](https://github.com/Opentrons/opentrons/commit/d47fee0)), closes [#3144](https://github.com/Opentrons/opentrons/issues/3144)





<a name="3.7.0"></a>
# [3.7.0](https://github.com/Opentrons/opentrons/compare/v3.6.5...v3.7.0) (2019-02-19)


### Bug Fixes

* **api:** Add gpio.set_button_light() to QC tools scripts, so they work with 3.6 changes ([#2890](https://github.com/Opentrons/opentrons/issues/2890)) ([aca6931](https://github.com/Opentrons/opentrons/commit/aca6931))
* **api:** api2: Do not do a "safety move" when homing the plunger ([#2965](https://github.com/Opentrons/opentrons/issues/2965)) ([28edc68](https://github.com/Opentrons/opentrons/commit/28edc68))
* **api:** Avoid resource contention on smoothie serial during boot ([#3035](https://github.com/Opentrons/opentrons/issues/3035)) ([3f9a4e3](https://github.com/Opentrons/opentrons/commit/3f9a4e3))
* **api:** Correctly format acceleration from settings as dict ([#2964](https://github.com/Opentrons/opentrons/issues/2964)) ([45a49e0](https://github.com/Opentrons/opentrons/commit/45a49e0))
* **api:** Flush and sync config file writes immediately ([#2899](https://github.com/Opentrons/opentrons/issues/2899)) ([3905e72](https://github.com/Opentrons/opentrons/commit/3905e72))


### Features

* **api:** Add ability to use papi2 in protocol ([#2803](https://github.com/Opentrons/opentrons/issues/2803)) ([6bbb83c](https://github.com/Opentrons/opentrons/commit/6bbb83c))
* **api:** Add calibrate labware and tip probe with new protocol API ([#2846](https://github.com/Opentrons/opentrons/issues/2846)) ([3264cff](https://github.com/Opentrons/opentrons/commit/3264cff)), closes [#2719](https://github.com/Opentrons/opentrons/issues/2719)
* **api:** Add json protocol execution to new protocol API ([#2854](https://github.com/Opentrons/opentrons/issues/2854)) ([48bbcb1](https://github.com/Opentrons/opentrons/commit/48bbcb1)), closes [#2248](https://github.com/Opentrons/opentrons/issues/2248)
* **api:** Add set_temperature command to Thermocycler ([#3017](https://github.com/Opentrons/opentrons/issues/3017)) ([e78238d](https://github.com/Opentrons/opentrons/commit/e78238d)), closes [#2960](https://github.com/Opentrons/opentrons/issues/2960)
* **api:** Add skeleton of Thermocycler API class ([#3015](https://github.com/Opentrons/opentrons/issues/3015)) ([b42f318](https://github.com/Opentrons/opentrons/commit/b42f318)), closes [#2992](https://github.com/Opentrons/opentrons/issues/2992)
* **api:** add thermocycler driver connect/disconnect methods ([#2996](https://github.com/Opentrons/opentrons/issues/2996)) ([6d3e41e](https://github.com/Opentrons/opentrons/commit/6d3e41e)), closes [#2984](https://github.com/Opentrons/opentrons/issues/2984)
* **api:** Allow advanced settings to be null (unset) ([#3029](https://github.com/Opentrons/opentrons/issues/3029)) ([256d736](https://github.com/Opentrons/opentrons/commit/256d736)), closes [#3026](https://github.com/Opentrons/opentrons/issues/3026)
* **api:** api2: Move multichannel center for certain labwares ([#2900](https://github.com/Opentrons/opentrons/issues/2900)) ([dfb60a5](https://github.com/Opentrons/opentrons/commit/dfb60a5)), closes [#2892](https://github.com/Opentrons/opentrons/issues/2892)
* **api:** decrease plunger acceleration and add drop tip speed to config ([#2904](https://github.com/Opentrons/opentrons/issues/2904)) ([dc64b0d](https://github.com/Opentrons/opentrons/commit/dc64b0d))
* **api:** Limit config settings to single directory ([#3000](https://github.com/Opentrons/opentrons/issues/3000)) ([a52e6f0](https://github.com/Opentrons/opentrons/commit/a52e6f0)), closes [#2970](https://github.com/Opentrons/opentrons/issues/2970) [#2969](https://github.com/Opentrons/opentrons/issues/2969)
* **api:** Load and save per-pipette-id config overrides ([#3018](https://github.com/Opentrons/opentrons/issues/3018)) ([9459010](https://github.com/Opentrons/opentrons/commit/9459010)), closes [#2936](https://github.com/Opentrons/opentrons/issues/2936)
* **api:** pipette config plunger position ([#2999](https://github.com/Opentrons/opentrons/issues/2999)) ([cbd559a](https://github.com/Opentrons/opentrons/commit/cbd559a))
* **api:** top-level simulate script and entrypoint ([#3005](https://github.com/Opentrons/opentrons/issues/3005)) ([5969748](https://github.com/Opentrons/opentrons/commit/5969748)), closes [#2971](https://github.com/Opentrons/opentrons/issues/2971)


### Performance Improvements

* **api:** New aspiration functions for all pipettes ([#3014](https://github.com/Opentrons/opentrons/issues/3014)) ([ae850ce](https://github.com/Opentrons/opentrons/commit/ae850ce)), closes [#3012](https://github.com/Opentrons/opentrons/issues/3012)





<a name="3.6.5"></a>
## [3.6.5](https://github.com/Opentrons/opentrons/compare/v3.6.4...v3.6.5) (2018-12-18)


### Bug Fixes

* **api:** Fix extract metadata ([#2833](https://github.com/Opentrons/opentrons/issues/2833)) ([0930915](https://github.com/Opentrons/opentrons/commit/0930915))
* **api:** Remove the intermingled old aspirate function from p10s ([#2839](https://github.com/Opentrons/opentrons/issues/2839)) ([696184c](https://github.com/Opentrons/opentrons/commit/696184c))





<a name="3.6.4"></a>
## [3.6.4](https://github.com/Opentrons/opentrons/compare/v3.6.3...v3.6.4) (2018-12-17)


### Features

* **api:** Adds optional arg to QC scripts to specify UART port ([#2825](https://github.com/Opentrons/opentrons/issues/2825)) ([5d622ad](https://github.com/Opentrons/opentrons/commit/5d622ad))





<a name="3.6.3"></a>
## [3.6.3](https://github.com/Opentrons/opentrons/compare/v3.6.2...v3.6.3) (2018-12-13)

**Note:** Version bump only for package @opentrons/api-server





<a name="3.6.2"></a>
## [3.6.2](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.2) (2018-12-11)


### Bug Fixes

* **api:** Do not overwrite settings every time we get config files ([#2802](https://github.com/Opentrons/opentrons/issues/2802)) ([c679c5c](https://github.com/Opentrons/opentrons/commit/c679c5c))


### Features

* **api:** Add metadata to session for Python protocols ([#2799](https://github.com/Opentrons/opentrons/issues/2799)) ([1da19bb](https://github.com/Opentrons/opentrons/commit/1da19bb)), closes [#2616](https://github.com/Opentrons/opentrons/issues/2616)
* **api:** p10 behavior feature flag ([#2794](https://github.com/Opentrons/opentrons/issues/2794)) ([c468b06](https://github.com/Opentrons/opentrons/commit/c468b06)), closes [#2792](https://github.com/Opentrons/opentrons/issues/2792)





<a name="3.6.1"></a>
## [3.6.1](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.1) (2018-12-05)

### Bug Fixes

* **api:** Fix bad P10S config causing under-aspirations ([#2774](https://github.com/Opentrons/opentrons/issues/2774)) ([9c5e0a2](https://github.com/Opentrons/opentrons/commit/9c5e0a2))





<a name="3.6.0"></a>
# [3.6.0](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.1...v3.6.0) (2018-11-29)


### Bug Fixes

* **shared-data:** fix total-liquid-volume of opentrons-tuberack-50ml ([#2744](https://github.com/Opentrons/opentrons/issues/2744)) ([aef8cc8](https://github.com/Opentrons/opentrons/commit/aef8cc8)), closes [#2743](https://github.com/Opentrons/opentrons/issues/2743)





<a name="3.6.0-beta.1"></a>
# [3.6.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.0...v3.6.0-beta.1) (2018-11-27)


### Features

* **api:** Add 1.5ml tuberack to old labware definition section ([#2679](https://github.com/Opentrons/opentrons/issues/2679)) ([2739038](https://github.com/Opentrons/opentrons/commit/2739038))
* **api:** Adds pipette models v1.4 to robot config ([#2689](https://github.com/Opentrons/opentrons/issues/2689)) ([fd9c38a](https://github.com/Opentrons/opentrons/commit/fd9c38a))


### Performance Improvements

* **api:** Decrease plunger motor max speed by 20% ([#2682](https://github.com/Opentrons/opentrons/issues/2682)) ([f8b7ccf](https://github.com/Opentrons/opentrons/commit/f8b7ccf))





<a name="3.6.0-beta.0"></a>
# [3.6.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.5.1...v3.6.0-beta.0) (2018-11-13)


### Bug Fixes

* **api:** Correct well ordering for custom labware ([#2633](https://github.com/Opentrons/opentrons/issues/2633)) ([8e7530c](https://github.com/Opentrons/opentrons/commit/8e7530c)), closes [#2631](https://github.com/Opentrons/opentrons/issues/2631)
* **api:** Fix bug where drop-tip current is not used while actually dropping tip ([#2572](https://github.com/Opentrons/opentrons/issues/2572)) ([d7c7f60](https://github.com/Opentrons/opentrons/commit/d7c7f60))


### Features

* **api:** Pipette id included in GET /pipettes ([#2564](https://github.com/Opentrons/opentrons/issues/2564)) ([0a171fe](https://github.com/Opentrons/opentrons/commit/0a171fe)), closes [#2148](https://github.com/Opentrons/opentrons/issues/2148)
* **api:** support offset in json protocol touch-tip command ([#2566](https://github.com/Opentrons/opentrons/issues/2566)) ([d54ee84](https://github.com/Opentrons/opentrons/commit/d54ee84))
* **shared-data:** support unversioned pipettes in JSON protocols ([#2605](https://github.com/Opentrons/opentrons/issues/2605)) ([9e84ff6](https://github.com/Opentrons/opentrons/commit/9e84ff6))





<a name="3.5.1"></a>
# [3.5.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.1...v3.5.1) (2018-10-26)


### Bug Fixes

* **api:** Correct GET /wifi/keys response to match documentation ([#2532](https://github.com/Opentrons/opentrons/issues/2532)) ([9e577b2](https://github.com/Opentrons/opentrons/commit/9e577b2))
* **api:** Fix height of p1000 tip rack definition ([#2547](https://github.com/Opentrons/opentrons/issues/2547)) ([8a92e82](https://github.com/Opentrons/opentrons/commit/8a92e82))


### Features

* **api:** Add ability to save new delta from calibrating labware ([#2503](https://github.com/Opentrons/opentrons/issues/2503)) ([a6e3a24](https://github.com/Opentrons/opentrons/commit/a6e3a24))
* **api:** Clear labware calibrations in new labware system ([#2513](https://github.com/Opentrons/opentrons/issues/2513)) ([cb3d12e](https://github.com/Opentrons/opentrons/commit/cb3d12e)), closes [#2276](https://github.com/Opentrons/opentrons/issues/2276)
* **api:** Use deck-absolute coords in hardware_control ([#2502](https://github.com/Opentrons/opentrons/issues/2502)) ([36c9f73](https://github.com/Opentrons/opentrons/commit/36c9f73)), closes [#2238](https://github.com/Opentrons/opentrons/issues/2238)





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Bug Fixes

* **api:** Bind jupyter notebook to 0.0.0.0 ([#2398](https://github.com/Opentrons/opentrons/issues/2398)) ([be24335](https://github.com/Opentrons/opentrons/commit/be24335)), closes [#2394](https://github.com/Opentrons/opentrons/issues/2394)
* **api:** Change api update ignore route to be accessible to client ([#2368](https://github.com/Opentrons/opentrons/issues/2368)) ([b581f2a](https://github.com/Opentrons/opentrons/commit/b581f2a)), closes [#2367](https://github.com/Opentrons/opentrons/issues/2367)
* **api:** Remove unnecessary return in hardware controller ([#2450](https://github.com/Opentrons/opentrons/issues/2450)) ([5e28aff](https://github.com/Opentrons/opentrons/commit/5e28aff))


### Features

* **api:** Add a displayName field to EAP types in /wifi/eap-options ([#2448](https://github.com/Opentrons/opentrons/issues/2448)) ([1232448](https://github.com/Opentrons/opentrons/commit/1232448)), closes [#2439](https://github.com/Opentrons/opentrons/issues/2439)
* **api:** Add accessor functions in new labware class ([#2418](https://github.com/Opentrons/opentrons/issues/2418)) ([d963cfc](https://github.com/Opentrons/opentrons/commit/d963cfc))
* **api:** Add function for p1000 ul-to-millimeter conversions ([#2425](https://github.com/Opentrons/opentrons/issues/2425)) ([4a26340](https://github.com/Opentrons/opentrons/commit/4a26340))
* **api:** add hardware control move_to(), move_rel() ([#2389](https://github.com/Opentrons/opentrons/issues/2389)) ([c14ca14](https://github.com/Opentrons/opentrons/commit/c14ca14)), closes [#2234](https://github.com/Opentrons/opentrons/issues/2234)
* **api:** Add hardware_control submodule ([#2349](https://github.com/Opentrons/opentrons/issues/2349)) ([ea25b15](https://github.com/Opentrons/opentrons/commit/ea25b15)), closes [#2232](https://github.com/Opentrons/opentrons/issues/2232)
* **api:** add instrument cache to hardware control ([#2402](https://github.com/Opentrons/opentrons/issues/2402)) ([bcc7040](https://github.com/Opentrons/opentrons/commit/bcc7040)), closes [#2236](https://github.com/Opentrons/opentrons/issues/2236)
* **api:** add module firmware update endpoint ([#2173](https://github.com/Opentrons/opentrons/issues/2173)) ([19f9a0d](https://github.com/Opentrons/opentrons/commit/19f9a0d)), closes [#1654](https://github.com/Opentrons/opentrons/issues/1654)
* **api:** Add new protocol API stubs ([#2375](https://github.com/Opentrons/opentrons/issues/2375)) ([82d28c5](https://github.com/Opentrons/opentrons/commit/82d28c5)), closes [#2233](https://github.com/Opentrons/opentrons/issues/2233)
* **api:** Add skeleton of new Labware class ([#2363](https://github.com/Opentrons/opentrons/issues/2363)) ([3488612](https://github.com/Opentrons/opentrons/commit/3488612)), closes [#2261](https://github.com/Opentrons/opentrons/issues/2261)
* **api:** Add top, bottom, and center methods to Well ([#2379](https://github.com/Opentrons/opentrons/issues/2379)) ([9ef7dd1](https://github.com/Opentrons/opentrons/commit/9ef7dd1)), closes [#2369](https://github.com/Opentrons/opentrons/issues/2369)
* **api:** change tempdeck temperature resolution,fix temp in docs ([#2359](https://github.com/Opentrons/opentrons/issues/2359)) ([343e845](https://github.com/Opentrons/opentrons/commit/343e845)), closes [#2358](https://github.com/Opentrons/opentrons/issues/2358)





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)


### Bug Fixes

* **api:** Patch resources/scripts to always be executable ([#2314](https://github.com/Opentrons/opentrons/issues/2314)) ([7db14bc](https://github.com/Opentrons/opentrons/commit/7db14bc)), closes [#2313](https://github.com/Opentrons/opentrons/issues/2313)
* **api:** Update definitions for tuberacks ([#2317](https://github.com/Opentrons/opentrons/issues/2317)) ([4ce2595](https://github.com/Opentrons/opentrons/commit/4ce2595)), closes [#2290](https://github.com/Opentrons/opentrons/issues/2290)
* **api:** Update the aluminum block definitions to match drawings ([#2342](https://github.com/Opentrons/opentrons/issues/2342)) ([4c1e4c2](https://github.com/Opentrons/opentrons/commit/4c1e4c2)), closes [#2292](https://github.com/Opentrons/opentrons/issues/2292)
* **api:** When reseting the robot singleton, clear added tips ([#2323](https://github.com/Opentrons/opentrons/issues/2323)) ([710e2d6](https://github.com/Opentrons/opentrons/commit/710e2d6))


### Features

* **api:** Add ability to connect to WPA2-Enterprise networks ([#2283](https://github.com/Opentrons/opentrons/issues/2283)) ([972b501](https://github.com/Opentrons/opentrons/commit/972b501)), closes [#2252](https://github.com/Opentrons/opentrons/issues/2252) [#2251](https://github.com/Opentrons/opentrons/issues/2251) [#2284](https://github.com/Opentrons/opentrons/issues/2284)
* **api:** Flash the smoothie on api boot if versions don't match ([#2325](https://github.com/Opentrons/opentrons/issues/2325)) ([b015f58](https://github.com/Opentrons/opentrons/commit/b015f58))
* **api:** Remove deck calibration from reset options ([#2330](https://github.com/Opentrons/opentrons/issues/2330)) ([f7d0c48](https://github.com/Opentrons/opentrons/commit/f7d0c48))
* **api:** support optional pause message ([#2306](https://github.com/Opentrons/opentrons/issues/2306)) ([e8056ae](https://github.com/Opentrons/opentrons/commit/e8056ae)), closes [#1694](https://github.com/Opentrons/opentrons/issues/1694)





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Bug Fixes

* **api:** Do not bind the api server to localhost if socket specd ([#2258](https://github.com/Opentrons/opentrons/issues/2258)) ([d534c6f](https://github.com/Opentrons/opentrons/commit/d534c6f)), closes [#2256](https://github.com/Opentrons/opentrons/issues/2256)
* **api:** Fix pipette volume params and revert change in param order ([#2255](https://github.com/Opentrons/opentrons/issues/2255)) ([55d2cd5](https://github.com/Opentrons/opentrons/commit/55d2cd5))
* **api:** throw early error on bad json delay cmd ([#2219](https://github.com/Opentrons/opentrons/issues/2219)) ([3d907d1](https://github.com/Opentrons/opentrons/commit/3d907d1))


### Features

* **api:** Add wifi key upload endpoints ([#2254](https://github.com/Opentrons/opentrons/issues/2254)) ([250101c](https://github.com/Opentrons/opentrons/commit/250101c)), closes [#2253](https://github.com/Opentrons/opentrons/issues/2253)
* **api:** Added min and max volume keywords to pipette constructors ([#2084](https://github.com/Opentrons/opentrons/issues/2084)) ([f68da5a](https://github.com/Opentrons/opentrons/commit/f68da5a)), closes [#2075](https://github.com/Opentrons/opentrons/issues/2075)





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)


### Bug Fixes

* **api:** delete pipette-config.json ([#2166](https://github.com/Opentrons/opentrons/issues/2166)) ([034edc7](https://github.com/Opentrons/opentrons/commit/034edc7))
* **api:** Delete the labware database journal on reset ([#2098](https://github.com/Opentrons/opentrons/issues/2098)) ([0579fb5](https://github.com/Opentrons/opentrons/commit/0579fb5))
* **api:** Fix container definitions of biorad PCR and 10ul tiprack ([#2191](https://github.com/Opentrons/opentrons/issues/2191)) ([b261dfa](https://github.com/Opentrons/opentrons/commit/b261dfa))
* **api:** opentrons.nmcli security types should be nmcli key-mgmt ([#2190](https://github.com/Opentrons/opentrons/issues/2190)) ([4873dc4](https://github.com/Opentrons/opentrons/commit/4873dc4)), closes [#2178](https://github.com/Opentrons/opentrons/issues/2178)


### Features

* **api:** Add container definitions for opentrons alumnium block setaluminum block ([#2205](https://github.com/Opentrons/opentrons/issues/2205)) ([107d6b0](https://github.com/Opentrons/opentrons/commit/107d6b0))
* **api:** Add definitions for the modular tuberack ([#2167](https://github.com/Opentrons/opentrons/issues/2167)) ([be902f6](https://github.com/Opentrons/opentrons/commit/be902f6))
* **api:** add engage custom height and offset params ([#2171](https://github.com/Opentrons/opentrons/issues/2171)) ([4b1f8bd](https://github.com/Opentrons/opentrons/commit/4b1f8bd)), closes [#2155](https://github.com/Opentrons/opentrons/issues/2155)
* **api:** Add hidden ssid wifi support ([#2193](https://github.com/Opentrons/opentrons/issues/2193)) ([ffc702f](https://github.com/Opentrons/opentrons/commit/ffc702f))
* **api:** Add net config info to /wifi/status ([#2188](https://github.com/Opentrons/opentrons/issues/2188)) ([cb51b86](https://github.com/Opentrons/opentrons/commit/cb51b86))
* **api:** support flow rate (uL/sec) in JSON protocols ([#2123](https://github.com/Opentrons/opentrons/issues/2123)) ([b0f944e](https://github.com/Opentrons/opentrons/commit/b0f944e))
* **protocol-designer:** support mm from bottom offset in JSON protocols ([#2180](https://github.com/Opentrons/opentrons/issues/2180)) ([db22ae8](https://github.com/Opentrons/opentrons/commit/db22ae8)), closes [#2157](https://github.com/Opentrons/opentrons/issues/2157)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Bug Fixes

* **api:** change udev rule to include multiple modules ([#1995](https://github.com/Opentrons/opentrons/issues/1995)) ([91ffc7e](https://github.com/Opentrons/opentrons/commit/91ffc7e))
* **update-server:** Fix issues with 3.2 api on 3.3 system ([#2097](https://github.com/Opentrons/opentrons/issues/2097)) ([bad6e3a](https://github.com/Opentrons/opentrons/commit/bad6e3a))


### Features

* **api:** Add /settings/reset endpoints ([#2082](https://github.com/Opentrons/opentrons/issues/2082)) ([f42ae1b](https://github.com/Opentrons/opentrons/commit/f42ae1b)), closes [#1885](https://github.com/Opentrons/opentrons/issues/1885)
* **api:** Consolidate pipette configuration ([#2055](https://github.com/Opentrons/opentrons/issues/2055)) ([ee39ea3](https://github.com/Opentrons/opentrons/commit/ee39ea3))
* **api:** Handle read-only thumb drive mount on OT2 ([#2037](https://github.com/Opentrons/opentrons/issues/2037)) ([9247392](https://github.com/Opentrons/opentrons/commit/9247392)), closes [#1903](https://github.com/Opentrons/opentrons/issues/1903)
* **api:** publish module commands and make module data endpoint ([#2053](https://github.com/Opentrons/opentrons/issues/2053)) ([c25c081](https://github.com/Opentrons/opentrons/commit/c25c081)), closes [#1653](https://github.com/Opentrons/opentrons/issues/1653)
* **app:** Add upload protocol warning modal ([#1988](https://github.com/Opentrons/opentrons/issues/1988)) ([8e010cf](https://github.com/Opentrons/opentrons/commit/8e010cf)), closes [#1032](https://github.com/Opentrons/opentrons/issues/1032)
* **app,api:** Add opt-in ping/pong monitoring to RPC websocket ([#2083](https://github.com/Opentrons/opentrons/issues/2083)) ([a9b3f0e](https://github.com/Opentrons/opentrons/commit/a9b3f0e)), closes [#2052](https://github.com/Opentrons/opentrons/issues/2052)
* **compute,api,update:** Add sys ver to health, allow resin pull ([#2089](https://github.com/Opentrons/opentrons/issues/2089)) ([7fdce05](https://github.com/Opentrons/opentrons/commit/7fdce05)), closes [#2091](https://github.com/Opentrons/opentrons/issues/2091)
* **compute,api,update-server:** Move system configs out of Dockerfile ([#2073](https://github.com/Opentrons/opentrons/issues/2073)) ([354c740](https://github.com/Opentrons/opentrons/commit/354c740)), closes [#1114](https://github.com/Opentrons/opentrons/issues/1114)





<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)


### Bug Fixes

* **api:** check virtual smoothie before copying udev file on server start ([#1960](https://github.com/Opentrons/opentrons/issues/1960)) ([9a31f3d](https://github.com/Opentrons/opentrons/commit/9a31f3d))
* **api:** Fix pipette.delay() so it does not sleep during protocol simulation ([#1902](https://github.com/Opentrons/opentrons/issues/1902)) ([f63bdba](https://github.com/Opentrons/opentrons/commit/f63bdba))
* **api:** Fix the database migration script geometry logic ([#1959](https://github.com/Opentrons/opentrons/issues/1959)) ([7ae9756](https://github.com/Opentrons/opentrons/commit/7ae9756))
* **api:** Home Z axes before run to guarantee that pipettes will be retracted ([#1914](https://github.com/Opentrons/opentrons/issues/1914)) ([7252a73](https://github.com/Opentrons/opentrons/commit/7252a73))
* **api:** support touch-tip for JSON protocols ([#2000](https://github.com/Opentrons/opentrons/issues/2000)) ([43125b7](https://github.com/Opentrons/opentrons/commit/43125b7)), closes [#1997](https://github.com/Opentrons/opentrons/issues/1997)
* **docker:** Switch out dumb-init, add modules tools & udev config ([#1952](https://github.com/Opentrons/opentrons/issues/1952)) ([caac645](https://github.com/Opentrons/opentrons/commit/caac645)), closes [#1822](https://github.com/Opentrons/opentrons/issues/1822)


### Features

* **api:** Add "modules" field to RPC ([#1890](https://github.com/Opentrons/opentrons/issues/1890)) ([f80ad18](https://github.com/Opentrons/opentrons/commit/f80ad18)), closes [#1733](https://github.com/Opentrons/opentrons/issues/1733)
* **api:** Add clear method to RPC SessionManager ([#1969](https://github.com/Opentrons/opentrons/issues/1969)) ([8228e6d](https://github.com/Opentrons/opentrons/commit/8228e6d))
* **api:** Add endpoints to get robot logs ([#1928](https://github.com/Opentrons/opentrons/issues/1928)) ([9224719](https://github.com/Opentrons/opentrons/commit/9224719))
* **api:** add magdeck api object ([#1925](https://github.com/Opentrons/opentrons/issues/1925)) ([b016eec](https://github.com/Opentrons/opentrons/commit/b016eec)), closes [#1889](https://github.com/Opentrons/opentrons/issues/1889) [#1887](https://github.com/Opentrons/opentrons/issues/1887) [#1886](https://github.com/Opentrons/opentrons/issues/1886) [#1645](https://github.com/Opentrons/opentrons/issues/1645)
* **api:** Add tempdeck api object ([#1962](https://github.com/Opentrons/opentrons/issues/1962)) ([cb7f107](https://github.com/Opentrons/opentrons/commit/cb7f107)), closes [#1965](https://github.com/Opentrons/opentrons/issues/1965) [#1648](https://github.com/Opentrons/opentrons/issues/1648) [#1649](https://github.com/Opentrons/opentrons/issues/1649)
* **api:** Brings back the shake after drop-tip ([#1871](https://github.com/Opentrons/opentrons/issues/1871)) ([304c71d](https://github.com/Opentrons/opentrons/commit/304c71d))


### Performance Improvements

* **api:** Set axis-testing speed to 8mm/sec to avoid resonance ([#1912](https://github.com/Opentrons/opentrons/issues/1912)) ([d7bb03b](https://github.com/Opentrons/opentrons/commit/d7bb03b))





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Bug Fixes

* **api:** Allows floating-point temperatures to be set/read to/from temp-deck ([#1798](https://github.com/Opentrons/opentrons/issues/1798)) ([856134a](https://github.com/Opentrons/opentrons/commit/856134a))
* **api:** Fix QC script which uses 85% current to use default speeds for Y axis ([#1802](https://github.com/Opentrons/opentrons/issues/1802)) ([aa8a319](https://github.com/Opentrons/opentrons/commit/aa8a319))
* **api:** Remove incorrect call to `cache_instrument_models` ([#1810](https://github.com/Opentrons/opentrons/issues/1810)) ([2f80ece](https://github.com/Opentrons/opentrons/commit/2f80ece))


### Features

* **api:** Add advanced settings endpoints to api server ([#1786](https://github.com/Opentrons/opentrons/issues/1786)) ([b89b4ea](https://github.com/Opentrons/opentrons/commit/b89b4ea)), closes [#1656](https://github.com/Opentrons/opentrons/issues/1656)
* **api:** Add GET /modules endpoint with stub for module discovery ([#1858](https://github.com/Opentrons/opentrons/issues/1858)) ([8dedb68](https://github.com/Opentrons/opentrons/commit/8dedb68))
* **api:** Add Magdeck driver ([#1840](https://github.com/Opentrons/opentrons/issues/1840)) ([e731c78](https://github.com/Opentrons/opentrons/commit/e731c78)), closes [#1809](https://github.com/Opentrons/opentrons/issues/1809)
* **app:** Log tracebacks from failed RPC calls  ([#1846](https://github.com/Opentrons/opentrons/issues/1846)) ([0c07c52](https://github.com/Opentrons/opentrons/commit/0c07c52)), closes [#1841](https://github.com/Opentrons/opentrons/issues/1841)
* **update-server:** Add endpoint to update API Server, ot2serverlib, and Smoothie FW ([#1797](https://github.com/Opentrons/opentrons/issues/1797)) ([464ed7f](https://github.com/Opentrons/opentrons/commit/464ed7f)), closes [#1549](https://github.com/Opentrons/opentrons/issues/1549)
* **update-server:** Add restart endpoint to Update Server and shorten restart sleep to 1s ([#1793](https://github.com/Opentrons/opentrons/issues/1793)) ([1bf8bd7](https://github.com/Opentrons/opentrons/commit/1bf8bd7)), closes [#1794](https://github.com/Opentrons/opentrons/issues/1794)


### Performance Improvements

* **api:** Slightly increase probing speed, avoid resonance and pipette shaking ([#1801](https://github.com/Opentrons/opentrons/issues/1801)) ([8f28ad4](https://github.com/Opentrons/opentrons/commit/8f28ad4))





<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package @opentrons/api-server





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)


### Bug Fixes

* **api:** Fix row order in labware.create ([#1749](https://github.com/Opentrons/opentrons/issues/1749)) ([40ac527](https://github.com/Opentrons/opentrons/commit/40ac527)), closes [#1748](https://github.com/Opentrons/opentrons/issues/1748)





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)


### Bug Fixes

* **api:** Sanitize wifi inputs to handle special characters ([#1743](https://github.com/Opentrons/opentrons/issues/1743)) ([18f8d0f](https://github.com/Opentrons/opentrons/commit/18f8d0f))


### Features

* **api:** Log API server and Smoothie FW versions on API server boot ([#1728](https://github.com/Opentrons/opentrons/issues/1728)) ([6c3c3c4](https://github.com/Opentrons/opentrons/commit/6c3c3c4)), closes [#1120](https://github.com/Opentrons/opentrons/issues/1120)





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)


### Bug Fixes

* **api:** Add ignore update endpoint implementation to fallback file ([#1720](https://github.com/Opentrons/opentrons/issues/1720)) ([2a68dc5](https://github.com/Opentrons/opentrons/commit/2a68dc5))
* **api:** Fix RPC reporting wrong models for v1.3 pipettes ([#1691](https://github.com/Opentrons/opentrons/issues/1691)) ([e302382](https://github.com/Opentrons/opentrons/commit/e302382))
* **api:** Fixes bug in replacing substring of old p50 pipettes written with v13 instead of v1.3 ([#1717](https://github.com/Opentrons/opentrons/issues/1717)) ([1322055](https://github.com/Opentrons/opentrons/commit/1322055))


### Features

* **api:** Add endpoints to handle API update ignores ([#1693](https://github.com/Opentrons/opentrons/issues/1693)) ([8c5eae9](https://github.com/Opentrons/opentrons/commit/8c5eae9))





<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)


### Bug Fixes

* **api:** Fallback for update endpoints ([#1669](https://github.com/Opentrons/opentrons/issues/1669)) ([3ce97df](https://github.com/Opentrons/opentrons/commit/3ce97df))


### Performance Improvements

* **api:** decrease Y and ZA currents ([#1647](https://github.com/Opentrons/opentrons/issues/1647)) ([3fe7358](https://github.com/Opentrons/opentrons/commit/3fe7358))
