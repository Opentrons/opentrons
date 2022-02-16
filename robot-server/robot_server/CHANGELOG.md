# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0) (2022-02-16)


### Bug Fixes

* **protocol-engine:** move HW API cleanup to engine.finish ([#9233](https://github.com/Opentrons/opentrons/issues/9233)) ([1994405](https://github.com/Opentrons/opentrons/commit/19944058762d889a6ab5b22e7a6ccc16f7367dda))
* **robot-server:** add current command metadata to /commands response ([#9400](https://github.com/Opentrons/opentrons/issues/9400)) ([7da0420](https://github.com/Opentrons/opentrons/commit/7da0420bd07810095312e07eb22fb2d31ee29215))


### Code Refactoring

* **robot-server:** remove deprecated protocols endpoints and FF ([#9261](https://github.com/Opentrons/opentrons/issues/9261)) ([802d858](https://github.com/Opentrons/opentrons/commit/802d8582dbc09566b8de9eca3672254ef271164b))
* **robot-server:** remove unused experimental /protocols code ([#9296](https://github.com/Opentrons/opentrons/issues/9296)) ([e462d17](https://github.com/Opentrons/opentrons/commit/e462d17dff12ce42a038ad221eb4ec52564e37e5))


### Features

* **ot3:** ot3 hardware controller move ([#8738](https://github.com/Opentrons/opentrons/issues/8738)) ([883db3a](https://github.com/Opentrons/opentrons/commit/883db3a96ca9c6a48bd4ccee16e221fe03154361)), closes [#8946](https://github.com/Opentrons/opentrons/issues/8946)
* **robot-server:** Add the `key` field to command HTTP summaries ([#9257](https://github.com/Opentrons/opentrons/issues/9257)) ([0be9e94](https://github.com/Opentrons/opentrons/commit/0be9e941a3ecc635550fbfef5926623c39876b43))
* **robot-server:** enable /runs and /protocols endpoints by default ([#8913](https://github.com/Opentrons/opentrons/issues/8913)) ([aa3549f](https://github.com/Opentrons/opentrons/commit/aa3549fad49383243f9ad2ccc291d15e8fd50725)), closes [#8155](https://github.com/Opentrons/opentrons/issues/8155)
* **robot-server:** Expose robot model in health ([#9072](https://github.com/Opentrons/opentrons/issues/9072)) ([8e052fc](https://github.com/Opentrons/opentrons/commit/8e052fcbb11c7338df4725ac7257c37fc5dd77fb))
* **robot-server,api,app:** When adding a jog command over HTTP, wait for it to complete before returning ([#9410](https://github.com/Opentrons/opentrons/issues/9410)) ([4d811d5](https://github.com/Opentrons/opentrons/commit/4d811d5485754b45795a275424e0b267edc88270))


### Performance Improvements

* **app, robot-server:** paginate /runs/:run_id/commands response ([#9348](https://github.com/Opentrons/opentrons/issues/9348)) ([b9eb7b4](https://github.com/Opentrons/opentrons/commit/b9eb7b4d98532480705d3c32fd2485508315bea9))
* **robot-server:** move large response serialization to worker thread ([#9197](https://github.com/Opentrons/opentrons/issues/9197)) ([21c044d](https://github.com/Opentrons/opentrons/commit/21c044d4010bd1441950150acf4275b0b72a0d52))
* **robot-server:** Return some HTTP results slightly more efficiently ([#9336](https://github.com/Opentrons/opentrons/issues/9336)) ([0573ba6](https://github.com/Opentrons/opentrons/commit/0573ba62e914f1ab8d0fe7d984890b44ea2fd706))
* **robot-server:** serialize /protocols, /runs responses with Pydantic ([#9188](https://github.com/Opentrons/opentrons/issues/9188)) ([85b7ebb](https://github.com/Opentrons/opentrons/commit/85b7ebbe6dd728583c4f341803f9d756a5a6c685))
* **robot-server, api-client:** return run summaries from GET /runs rather than full run models ([#9332](https://github.com/Opentrons/opentrons/issues/9332)) ([66b1d7c](https://github.com/Opentrons/opentrons/commit/66b1d7c0082970c53306eb99006309914ad33b22))
* **robot-server, app:** remove commands from GET /runs/:run_id ([#9337](https://github.com/Opentrons/opentrons/issues/9337)) ([56f291a](https://github.com/Opentrons/opentrons/commit/56f291a1a4179322d440621e745186269e2dc4ee))


### BREAKING CHANGES

* **robot-server:** Removes experimental `protocol` session type
in favor of v5 `/protocols` and `/runs` endpoints
* **robot-server:** This removes endpoints used during the 2021 HTTP protocol upload beta.
Users should transition to the new `/protocols` and `/runs` endpoints, instead.
* **robot-server:** The RPC WebSocket endpoint has been removed. The /protocols endpoints have been
heavily reworked.





# [4.7.0](https://github.com/Opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)


### Bug Fixes

* **robot-server:** avoid LabwareDefinition type in cal models ([#8698](https://github.com/Opentrons/opentrons/issues/8698)) ([c3bf7ab](https://github.com/Opentrons/opentrons/commit/c3bf7ab51074e8b5e160ce5755be6e80296f1963)), closes [#8654](https://github.com/Opentrons/opentrons/issues/8654)
* **robot-server:** ensure background tasks do not affect requests ([#8362](https://github.com/Opentrons/opentrons/issues/8362)) ([3e4bc2f](https://github.com/Opentrons/opentrons/commit/3e4bc2f504282c51622682001780f35d5f3e5312))


### Features

* **api,robot-server:** upgrade fastapi and pydantic deps ([#8345](https://github.com/Opentrons/opentrons/issues/8345)) ([9cf416a](https://github.com/Opentrons/opentrons/commit/9cf416a498e77b2127a6e3e71298f9368f818d35)), closes [#8134](https://github.com/Opentrons/opentrons/issues/8134)
* **robot-server:** allow a run and a legacy session to exist simultaneously ([#8615](https://github.com/Opentrons/opentrons/issues/8615)) ([b470946](https://github.com/Opentrons/opentrons/commit/b4709462df09479a2c4f8160561046e5cd588e3b))


### Reverts

* **robot-server:** revert attach pipette code back to using the mount ([#8699](https://github.com/Opentrons/opentrons/issues/8699)) ([dc9f9a8](https://github.com/Opentrons/opentrons/commit/dc9f9a8df5cd92b8efe0dceae0415dc7240682a3))







**Note:** Version bump only for package @opentrons/robot-server





## [4.6.2](https://github.com/Opentrons/opentrons/compare/v4.6.1...v4.6.2) (2021-09-30)

**Note:** Version bump only for package @opentrons/robot-server





## [4.6.1](https://github.com/Opentrons/opentrons/compare/v4.6.0...v4.6.1) (2021-09-28)

**Note:** Version bump only for package @opentrons/robot-server





# [4.6.0](https://github.com/Opentrons/opentrons/compare/v4.5.0...v4.6.0) (2021-09-27)


### Bug Fixes

* **api:** ensure decorators do not erase ProtocolContext types ([#8323](https://github.com/Opentrons/opentrons/issues/8323)) ([2a8a370](https://github.com/Opentrons/opentrons/commit/2a8a37025e8894230cdeb0376a7bf832b4e9f12f))
* **robot-server:** use the current critical point when moving pipettes ([#8331](https://github.com/Opentrons/opentrons/issues/8331)) ([09efb81](https://github.com/Opentrons/opentrons/commit/09efb818822cbfa5169377884240c6e494024226))





# [4.5.0](https://github.com/Opentrons/opentrons/compare/v4.4.0...v4.5.0) (2021-08-03)

**Note:** Version bump only for package @opentrons/robot-server





# [4.4.0](https://github.com/Opentrons/opentrons/compare/v4.3.1...v4.4.0) (2021-06-16)


### Bug Fixes

* **robot-server:** exempt /logs and RPC from version header requirement ([#7927](https://github.com/Opentrons/opentrons/issues/7927)) ([58eb503](https://github.com/Opentrons/opentrons/commit/58eb503))


### Features

* **robot-server:** http protocol upload supports custom labware. ([#7694](https://github.com/Opentrons/opentrons/issues/7694)) ([4ad824c](https://github.com/Opentrons/opentrons/commit/4ad824c)), closes [#7148](https://github.com/Opentrons/opentrons/issues/7148)





## [4.3.1](https://github.com/Opentrons/opentrons/compare/v4.3.0...v4.3.1) (2021-05-10)

**Note:** Version bump only for package @opentrons/robot-server





# [4.3.0](https://github.com/Opentrons/opentrons/compare/v4.2.1...v4.3.0) (2021-05-06)

### Features

* **robot-server:** Add physical module usb port information to the http server ([#7362](https://github.com/Opentrons/opentrons/issues/7362)) ([07b0f4a](https://github.com/Opentrons/opentrons/commit/07b0f4a))


### Reverts

* **robot-server:** Save the z offset for pipette calibration  ([0b102da](https://github.com/Opentrons/opentrons/commit/0b102da))





## [4.2.1](https://github.com/Opentrons/opentrons/compare/v4.2.0...v4.2.1) (2021-04-06)

### Reverts

* **robot-server:** Save the z offset for pipette calibration  ([b76230a](https://github.com/Opentrons/opentrons/commit/b76230a))





# [4.2.0](https://github.com/Opentrons/opentrons/compare/v4.1.1...v4.2.0) (2021-03-18)

### Bug Fixes

* **api, robot-server:** fix a comical cascade of pipette config bugs ([#7316](https://github.com/Opentrons/opentrons/issues/7316)) ([98d0ddf](https://github.com/Opentrons/opentrons/commit/98d0ddf)), closes [#7305](https://github.com/Opentrons/opentrons/issues/7305)
* **robot-server:** Do not save the z offset for pipette calibration ([#7417](https://github.com/Opentrons/opentrons/issues/7417)) ([3873f17](https://github.com/Opentrons/opentrons/commit/3873f17))


### Features

* **api:** upload using fast sim if feature flag enables feature ([#7322](https://github.com/Opentrons/opentrons/issues/7322)) ([f7e8283](https://github.com/Opentrons/opentrons/commit/f7e8283)), closes [#7286](https://github.com/Opentrons/opentrons/issues/7286)
* **robot-server:** extract author and protocol name from JSON protocol metadata. ([#7267](https://github.com/Opentrons/opentrons/issues/7267)) ([4c10907](https://github.com/Opentrons/opentrons/commit/4c10907))
* **robot-server:** protocol http api uses fast sim ([#7146](https://github.com/Opentrons/opentrons/issues/7146)) ([ce636c0](https://github.com/Opentrons/opentrons/commit/ce636c0)), closes [#6104](https://github.com/Opentrons/opentrons/issues/6104)





## [4.1.1](https://github.com/Opentrons/opentrons/compare/v4.1.0...v4.1.1) (2021-01-25)

**Note:** Version bump only for package @opentrons/robot-server





# [4.1.0](https://github.com/Opentrons/opentrons/compare/v4.0.0...v4.1.0) (2021-01-20)

## Bug Fixes

* **robot-server:** disable overlap for custom tips ([#7229](https://github.com/Opentrons/opentrons/issues/7229)) ([1e180c8](https://github.com/Opentrons/opentrons/commit/1e180c8))
* **robot-server:** save custom tiprack def on robot during tip length cal ([#7231](https://github.com/Opentrons/opentrons/issues/7231)) ([4fe2b37](https://github.com/Opentrons/opentrons/commit/4fe2b37))
* **robot-server:** do not update state machine for tiprack select ([#7190](https://github.com/Opentrons/opentrons/issues/7190)) ([f2fc9f5](https://github.com/Opentrons/opentrons/commit/f2fc9f5))
* **robot-server:** ProtocolManager expects a ThreadManager and not a SynchronousAdapter. ([#7175](https://github.com/Opentrons/opentrons/issues/7175)) ([c0c9225](https://github.com/Opentrons/opentrons/commit/c0c9225))


## Features

* **robot-server:** add hardware events publisher ([#7042](https://github.com/Opentrons/opentrons/issues/7042)) ([9943acc](https://github.com/Opentrons/opentrons/commit/9943acc))
* **robot-server:** expose uvicorn logs ([#7118](https://github.com/Opentrons/opentrons/issues/7118)) ([571eb1e](https://github.com/Opentrons/opentrons/commit/571eb1e)), closes [#7097](https://github.com/Opentrons/opentrons/issues/7097)
* **robot-server:** notifications service websocket subscriber client ([#7107](https://github.com/Opentrons/opentrons/issues/7107)) ([3986b0a](https://github.com/Opentrons/opentrons/commit/3986b0a)), closes [#6911](https://github.com/Opentrons/opentrons/issues/6911) [#6909](https://github.com/Opentrons/opentrons/issues/6909)





# [4.0.0](https://github.com/Opentrons/opentrons/compare/v3.21.2...v4.0.0) (2020-11-20)

### Bug Fixes

* **api:** Mark pipette and deck calibration as bad for slot one ([#7035](https://github.com/Opentrons/opentrons/issues/7035)) ([92f1cbf](https://github.com/Opentrons/opentrons/commit/92f1cbf))
* **robot-server:** deck cal: clear pipette offset cal when deck cal completes ([#7019](https://github.com/Opentrons/opentrons/issues/7019)) ([243c683](https://github.com/Opentrons/opentrons/commit/243c683))
* **robot-server:** remove pip offset after tlc in fused flow ([#7020](https://github.com/Opentrons/opentrons/issues/7020)) ([858219e](https://github.com/Opentrons/opentrons/commit/858219e))
* **robot-server:** load tip length data correctly in pipette offset cal ([#7009](https://github.com/Opentrons/opentrons/issues/7009)) ([8c8ef89](https://github.com/Opentrons/opentrons/commit/8c8ef89))
* **robot-server:** reset cal when starting pip offset cal ([#6991](https://github.com/Opentrons/opentrons/issues/6991)) ([d471900](https://github.com/Opentrons/opentrons/commit/d471900))
* **robot-server:** cal check: fix comparingHeight y-value ([#6981](https://github.com/Opentrons/opentrons/issues/6981)) ([dd393e9](https://github.com/Opentrons/opentrons/commit/dd393e9))
* **robot-server:** Opt logs out of version requirements ([#6980](https://github.com/Opentrons/opentrons/issues/6980)) ([e73083d](https://github.com/Opentrons/opentrons/commit/e73083d))
* **robot-server:** calcheck: fix invalidation, pickup, retract ([#6934](https://github.com/Opentrons/opentrons/issues/6934)) ([c351ea7](https://github.com/Opentrons/opentrons/commit/c351ea7))
* **robot-server,api:** reset cal during dc process ([#6942](https://github.com/Opentrons/opentrons/issues/6942)) ([8d142d4](https://github.com/Opentrons/opentrons/commit/8d142d4))
* **robot-server:** prefer smaller pipette in deck cal ([#6900](https://github.com/Opentrons/opentrons/issues/6900)) ([9f2830a](https://github.com/Opentrons/opentrons/commit/9f2830a))
* **robot-server:** cache instruments before each calibration flow ([#6822](https://github.com/Opentrons/opentrons/issues/6822)) ([0d61b0e](https://github.com/Opentrons/opentrons/commit/0d61b0e))
* **robot-server:** home plungers in cal flows ([#6823](https://github.com/Opentrons/opentrons/issues/6823)) ([c641d0f](https://github.com/Opentrons/opentrons/commit/c641d0f))
* **api,robot-server:** reload robot calibration on deck calibration exit ([#6815](https://github.com/Opentrons/opentrons/issues/6815)) ([254af66](https://github.com/Opentrons/opentrons/commit/254af66))
* **robot-server:** Fix return tip moves in cal flows ([#6814](https://github.com/Opentrons/opentrons/issues/6814)) ([3c94eef](https://github.com/Opentrons/opentrons/commit/3c94eef))
* **robot-server:** Home pipettes after calibration flows ([#6813](https://github.com/Opentrons/opentrons/issues/6813)) ([1f378a2](https://github.com/Opentrons/opentrons/commit/1f378a2))
* **app, robot-server:** add param to set has cal block command  ([#6792](https://github.com/Opentrons/opentrons/issues/6792)) ([4b9e582](https://github.com/Opentrons/opentrons/commit/4b9e582))




### Features

* **api:** Mark calibrations as bad when determined they exceed threshold ([#6918](https://github.com/Opentrons/opentrons/issues/6918)) ([ac3a866](https://github.com/Opentrons/opentrons/commit/ac3a866))
* **app, robot-server:** Report both the minimum and maximum supported protocol api versions ([#6921](https://github.com/Opentrons/opentrons/issues/6921)) ([22fc36a](https://github.com/Opentrons/opentrons/commit/22fc36a))
* **robot-server:** increment HTTP API version ([#6917](https://github.com/Opentrons/opentrons/issues/6917)) ([601c3fb](https://github.com/Opentrons/opentrons/commit/601c3fb)), closes [#6851](https://github.com/Opentrons/opentrons/issues/6851)
* **notify-server:** Notify server subscriber client ([#6818](https://github.com/Opentrons/opentrons/issues/6818)) ([6611e07](https://github.com/Opentrons/opentrons/commit/6611e07)), closes [#6707](https://github.com/Opentrons/opentrons/issues/6707)
* **api:** Prevent Python API v1 protocol upload in server version 4.0.0 ([#6841](https://github.com/Opentrons/opentrons/issues/6841)) ([054f037](https://github.com/Opentrons/opentrons/commit/054f037))
* **app,robot-server:** Retry cal actions ([#6830](https://github.com/Opentrons/opentrons/issues/6830)) ([86c729b](https://github.com/Opentrons/opentrons/commit/86c729b)), closes [#6729](https://github.com/Opentrons/opentrons/issues/6729)
* **app, robot-server:** add param to set has cal block command  ([#6792](https://github.com/Opentrons/opentrons/issues/6792)) ([4b9e582](https://github.com/Opentrons/opentrons/commit/4b9e582))
* **api:** Add calibration status to all of the calibration data models ([#6648](https://github.com/Opentrons/opentrons/issues/6648)) ([2753734](https://github.com/Opentrons/opentrons/commit/2753734))
* **api,robot-server:** Overhaul robot calibration flows ([#6797](https://github.com/Opentrons/opentrons/issues/6797)) ([f0f236f](https://github.com/Opentrons/opentrons/commit/f0f236f)), closes [#6738](https://github.com/Opentrons/opentrons/issues/6738) [#6739](https://github.com/Opentrons/opentrons/issues/6739)
* **robot-server:** create models for basic pipetting session commands ([#6560](https://github.com/Opentrons/opentrons/issues/6560)) ([b31377b](https://github.com/Opentrons/opentrons/commit/b31377b)), closes [#6556](https://github.com/Opentrons/opentrons/issues/6556)
* **robot-server:** http basic pipetting session - command routing and state store ([#6606](https://github.com/Opentrons/opentrons/issues/6606)) ([534f038](https://github.com/Opentrons/opentrons/commit/534f038)), closes [#6559](https://github.com/Opentrons/opentrons/issues/6559)
* **robot-server:** http basic pipetting- load labware ([#6640](https://github.com/Opentrons/opentrons/issues/6640)) ([afeee2e](https://github.com/Opentrons/opentrons/commit/afeee2e))
* **robot-server:** live protocol session handles LoadInstrument command ([#6639](https://github.com/Opentrons/opentrons/issues/6639)) ([969112c](https://github.com/Opentrons/opentrons/commit/969112c)), closes [#6602](https://github.com/Opentrons/opentrons/issues/6602)
* **robot-server,app:** extend pipette offset cal to include tip length cal if needed ([#6641](https://github.com/Opentrons/opentrons/issues/6641)) ([5819f29](https://github.com/Opentrons/opentrons/commit/5819f29))
* **api:** Add calibration status to all of the calibration data models ([#6648](https://github.com/Opentrons/opentrons/issues/6648)) ([2753734](https://github.com/Opentrons/opentrons/commit/2753734))
* **robot-server:** create models for basic pipetting session commands ([#6560](https://github.com/Opentrons/opentrons/issues/6560)) ([b31377b](https://github.com/Opentrons/opentrons/commit/b31377b)), closes [#6556](https://github.com/Opentrons/opentrons/issues/6556)
* **robot-server:** http basic pipetting session - command routing and state store ([#6606](https://github.com/Opentrons/opentrons/issues/6606)) ([534f038](https://github.com/Opentrons/opentrons/commit/534f038)), closes [#6559](https://github.com/Opentrons/opentrons/issues/6559)
* **robot-server:** http basic pipetting- load labware ([#6640](https://github.com/Opentrons/opentrons/issues/6640)) ([afeee2e](https://github.com/Opentrons/opentrons/commit/afeee2e))
* **robot-server:** live protocol session handles LoadInstrument command ([#6639](https://github.com/Opentrons/opentrons/issues/6639)) ([969112c](https://github.com/Opentrons/opentrons/commit/969112c)), closes [#6602](https://github.com/Opentrons/opentrons/issues/6602)
* **robot-server,app:** extend pipette offset cal to include tip length cal if needed ([#6641](https://github.com/Opentrons/opentrons/issues/6641)) ([5819f29](https://github.com/Opentrons/opentrons/commit/5819f29))





### BREAKING CHANGES

* **robot-server:** Requests without Opentrons-Version or with a value lower than 2 will be rejected







## [3.21.2](https://github.com/Opentrons/opentrons/compare/v3.21.1...v3.21.2) (2020-10-16)

**Note:** Version bump only for package @opentrons/robot-server






## [3.21.1](https://github.com/Opentrons/opentrons/compare/v3.21.0...v3.21.1) (2020-10-14)

**Note:** Version bump only for package @opentrons/robot-server





# [3.21.0](https://github.com/Opentrons/opentrons/compare/v3.20.1...v3.21.0) (2020-09-30)


### Bug Fixes

* **app:** sync robot time with app time on connect ([#6501](https://github.com/Opentrons/opentrons/issues/6501)) ([66dc626](https://github.com/Opentrons/opentrons/commit/66dc626)), closes [#3872](https://github.com/Opentrons/opentrons/issues/3872)
* **robot-server:** add inspectingTip state to deck calibration ([#6313](https://github.com/Opentrons/opentrons/issues/6313)) ([c1fd90a](https://github.com/Opentrons/opentrons/commit/c1fd90a))
* **robot-server:** calibraiton flows - fix assert statements ([#6529](https://github.com/Opentrons/opentrons/issues/6529)) ([a269b0f](https://github.com/Opentrons/opentrons/commit/a269b0f))
* **robot-server:** correct move to deck safety buffer in y ([#6478](https://github.com/Opentrons/opentrons/issues/6478)) ([a124bb5](https://github.com/Opentrons/opentrons/commit/a124bb5))
* **robot-server:** datetime responses are missing timezone. ([#6375](https://github.com/Opentrons/opentrons/issues/6375)) ([1a65835](https://github.com/Opentrons/opentrons/commit/1a65835)), closes [#6374](https://github.com/Opentrons/opentrons/issues/6374)
* **robot-server:** deck calibration flow clean up ([#6430](https://github.com/Opentrons/opentrons/issues/6430)) ([986e5d1](https://github.com/Opentrons/opentrons/commit/986e5d1))
* **robot-server:** fix multi channel move in tip length cal ([#6319](https://github.com/Opentrons/opentrons/issues/6319)) ([898a24b](https://github.com/Opentrons/opentrons/commit/898a24b))
* **robot-server:** only import type_extension during type checking ([#6462](https://github.com/Opentrons/opentrons/issues/6462)) ([b3c844d](https://github.com/Opentrons/opentrons/commit/b3c844d))
* **robot-server:** pip offset: save offset from reference point ([#6586](https://github.com/Opentrons/opentrons/issues/6586)) ([ef722ba](https://github.com/Opentrons/opentrons/commit/ef722ba))
* **robot-server:** pipette offset - uses z ref height to move to point ([#6514](https://github.com/Opentrons/opentrons/issues/6514)) ([58116d0](https://github.com/Opentrons/opentrons/commit/58116d0)), closes [#6424](https://github.com/Opentrons/opentrons/issues/6424)
* **robot-server:** pipette offset cal - add missing arg to save offset data ([#6520](https://github.com/Opentrons/opentrons/issues/6520)) ([13c2b27](https://github.com/Opentrons/opentrons/commit/13c2b27))
* **robot-server:** tip length cal -  use nozzle height for tip length calculation ([#6527](https://github.com/Opentrons/opentrons/issues/6527)) ([b87df49](https://github.com/Opentrons/opentrons/commit/b87df49))


### Features

* **api, robot-server:** expose pipette offset cal via http ([#6563](https://github.com/Opentrons/opentrons/issues/6563)) ([ffd3439](https://github.com/Opentrons/opentrons/commit/ffd3439)), closes [#6429](https://github.com/Opentrons/opentrons/issues/6429)
* **api,robot-server:** Robot server rpc http ff ([#6310](https://github.com/Opentrons/opentrons/issues/6310)) ([ba0fc92](https://github.com/Opentrons/opentrons/commit/ba0fc92)), closes [#6305](https://github.com/Opentrons/opentrons/issues/6305)
* **robot_server:** add system/time GET & PUT endpoints ([#6403](https://github.com/Opentrons/opentrons/issues/6403)) ([c3e5b46](https://github.com/Opentrons/opentrons/commit/c3e5b46))
* **robot-server:** Executor for protocol session ([#6262](https://github.com/Opentrons/opentrons/issues/6262)) ([7b473c1](https://github.com/Opentrons/opentrons/commit/7b473c1)), closes [#6192](https://github.com/Opentrons/opentrons/issues/6192) [#6194](https://github.com/Opentrons/opentrons/issues/6194) [#6195](https://github.com/Opentrons/opentrons/issues/6195) [#6196](https://github.com/Opentrons/opentrons/issues/6196)
* **robot-server:** Robot server protocol session model ([#6371](https://github.com/Opentrons/opentrons/issues/6371)) ([973ee18](https://github.com/Opentrons/opentrons/commit/973ee18)), closes [#6225](https://github.com/Opentrons/opentrons/issues/6225)
* **robot-server,app:** add download deck calibration button ([#6453](https://github.com/Opentrons/opentrons/issues/6453)) ([b3b365d](https://github.com/Opentrons/opentrons/commit/b3b365d)), closes [#6055](https://github.com/Opentrons/opentrons/issues/6055)





## [3.20.1](https://github.com/Opentrons/opentrons/compare/v3.20.0...v3.20.1) (2020-08-25)

**Note:** Version bump only for package @opentrons/robot-server





# [3.20.0](https://github.com/Opentrons/opentrons/compare/v3.19.0...v3.20.0) (2020-08-13)

### Bug Fixes

* **robot-server:** Robot server createParams bug ([fa7a35e](https://github.com/Opentrons/opentrons/commit/fa7a35e))
* **api:** set parent for in-slot offsets to empty ([#6211](https://github.com/Opentrons/opentrons/issues/6211)) ([463d56d](https://github.com/Opentrons/opentrons/commit/463d56d))
* **robot-server:** correct return tip height, only load block when present ([#6224](https://github.com/Opentrons/opentrons/issues/6224)) ([3bf6b26](https://github.com/Opentrons/opentrons/commit/3bf6b26))
* **robot-server:** fix a merge race condition. ([#6030](https://github.com/Opentrons/opentrons/issues/6030)) ([628049c](https://github.com/Opentrons/opentrons/commit/628049c))
* **robot-server:** fix typo in change pipette position ([#6083](https://github.com/Opentrons/opentrons/issues/6083)) ([67c3332](https://github.com/Opentrons/opentrons/commit/67c3332))
* **robot-server:** force pydantic to version 1.4 as that is what is on the robot. ([#6037](https://github.com/Opentrons/opentrons/issues/6037)) ([aa5bcc2](https://github.com/Opentrons/opentrons/commit/aa5bcc2))
* **robot-server:** Log uncaught exceptions ([#6209](https://github.com/Opentrons/opentrons/issues/6209)) ([0e1b15b](https://github.com/Opentrons/opentrons/commit/0e1b15b))
* **robot-server, app:** fix broken chained commands in tip length cal ([#6212](https://github.com/Opentrons/opentrons/issues/6212)) ([727ba64](https://github.com/Opentrons/opentrons/commit/727ba64))


### Features

* **robot-server:** Add endpoints to access labware calibration ([#5811](https://github.com/Opentrons/opentrons/issues/5811)) ([6e24726](https://github.com/Opentrons/opentrons/commit/6e24726))
* **robot-server:** add started_at and completed_at to command response. ([#5940](https://github.com/Opentrons/opentrons/issues/5940)) ([b626f67](https://github.com/Opentrons/opentrons/commit/b626f67)), closes [#5828](https://github.com/Opentrons/opentrons/issues/5828)
* **robot-server:** protocol manager and api ([#6182](https://github.com/Opentrons/opentrons/issues/6182)) ([f296bb4](https://github.com/Opentrons/opentrons/commit/f296bb4)), closes [#6071](https://github.com/Opentrons/opentrons/issues/6071)
* **robot-server:** return created_at in session response ([#6011](https://github.com/Opentrons/opentrons/issues/6011)) ([f5865be](https://github.com/Opentrons/opentrons/commit/f5865be))
* **robot-server:** Robot server command namespaces ([#6098](https://github.com/Opentrons/opentrons/issues/6098)) ([73152e3](https://github.com/Opentrons/opentrons/commit/73152e3)), closes [#6089](https://github.com/Opentrons/opentrons/issues/6089)
* **robot-server:** Robot server default session ([#5967](https://github.com/Opentrons/opentrons/issues/5967)) ([754057b](https://github.com/Opentrons/opentrons/commit/754057b)), closes [#5768](https://github.com/Opentrons/opentrons/issues/5768)
* **robot-server:** Robot server protocol session mockup ([#6215](https://github.com/Opentrons/opentrons/issues/6215)) ([d137be0](https://github.com/Opentrons/opentrons/commit/d137be0)), closes [#6072](https://github.com/Opentrons/opentrons/issues/6072)
* **robot-server:** Session create parameters ([#6144](https://github.com/Opentrons/opentrons/issues/6144)) ([ee1b504](https://github.com/Opentrons/opentrons/commit/ee1b504)), closes [#6149](https://github.com/Opentrons/opentrons/issues/6149)
* **robot-server, api:** async hardware initialization after HTTP server starts. ([#6116](https://github.com/Opentrons/opentrons/issues/6116)) ([b4eb2ca](https://github.com/Opentrons/opentrons/commit/b4eb2ca)), closes [#6109](https://github.com/Opentrons/opentrons/issues/6109)





# [3.19.0](https://github.com/Opentrons/opentrons/compare/v3.18.1...v3.19.0) (2020-06-29)


### Bug Fixes

* **robot-server:** make sure fastapi validation errors are properly documented ([#5748](https://github.com/Opentrons/opentrons/issues/5748)) ([dbecbfc](https://github.com/Opentrons/opentrons/commit/dbecbfc))
* **robot-server:** preserve newlines in text logs ([#5850](https://github.com/Opentrons/opentrons/issues/5850)) ([6420b5f](https://github.com/Opentrons/opentrons/commit/6420b5f)), closes [#5846](https://github.com/Opentrons/opentrons/issues/5846)
* **robot-server:** type mismatch in SerialCommand args ([#5883](https://github.com/Opentrons/opentrons/issues/5883)) ([2134b97](https://github.com/Opentrons/opentrons/commit/2134b97))
* **robot-server, api:** reject commands while robot is moving ([#5878](https://github.com/Opentrons/opentrons/issues/5878)) ([d8c63d7](https://github.com/Opentrons/opentrons/commit/d8c63d7)), closes [#5810](https://github.com/Opentrons/opentrons/issues/5810)


### Features

* **api, app:** Check Robot Deck Transform ([#5845](https://github.com/Opentrons/opentrons/issues/5845)) ([ed67383](https://github.com/Opentrons/opentrons/commit/ed67383))
* **robot-server:** Add skeleton of tip calibration session including integration test.' ([#5868](https://github.com/Opentrons/opentrons/issues/5868)) ([c66f8ae](https://github.com/Opentrons/opentrons/commit/c66f8ae))
* **robot-server:** Mock up of access control models and router. ([#5749](https://github.com/Opentrons/opentrons/issues/5749)) ([05348ec](https://github.com/Opentrons/opentrons/commit/05348ec)), closes [#5746](https://github.com/Opentrons/opentrons/issues/5746)
* **robot-server:** session manager ([#5796](https://github.com/Opentrons/opentrons/issues/5796)) ([c1fd7e8](https://github.com/Opentrons/opentrons/commit/c1fd7e8)), closes [#5763](https://github.com/Opentrons/opentrons/issues/5763) [#5765](https://github.com/Opentrons/opentrons/issues/5765)




## [3.18.1](https://github.com/Opentrons/opentrons/compare/v3.18.0...v3.18.1) (2020-05-26)

**Note:** Version bump only for package @opentrons/robot-server





# [3.18.0](https://github.com/Opentrons/opentrons/compare/v3.17.1...v3.18.0) (2020-05-20)


### Bug Fixes

* **robot-server:**  /modules was not returning the right module specific data ([9ba54e4](https://github.com/Opentrons/opentrons/commit/9ba54e4))
* **robot-server:** Fixup failing tests in robot-server ([#5673](https://github.com/Opentrons/opentrons/issues/5673)) ([d307e12](https://github.com/Opentrons/opentrons/commit/d307e12))
* **robot-server:** prevent nmcli connection states from causing a 500 response ([e380837](https://github.com/Opentrons/opentrons/commit/e380837)), closes [#5698](https://github.com/Opentrons/opentrons/issues/5698)
* **robot-server,api:** bug in deck calibration ([e0c1754](https://github.com/Opentrons/opentrons/commit/e0c1754)), closes [#5688](https://github.com/Opentrons/opentrons/issues/5688)


### Features

* **api:** Add type of deck calibration and remove ability to start the program without pipettes ([#5645](https://github.com/Opentrons/opentrons/issues/5645)) ([334be7f](https://github.com/Opentrons/opentrons/commit/334be7f))
* **app,robot-server:** add support for sessions API ([#5628](https://github.com/Opentrons/opentrons/issues/5628)) ([441d682](https://github.com/Opentrons/opentrons/commit/441d682))
* **robot-server:** session response must contain session_id ([#5635](https://github.com/Opentrons/opentrons/issues/5635)) ([52313f5](https://github.com/Opentrons/opentrons/commit/52313f5))
* **robot-server, api:** calibration check fastapi  ([#5581](https://github.com/Opentrons/opentrons/issues/5581)) ([b44360d](https://github.com/Opentrons/opentrons/commit/b44360d))
* **robot-server,api:** robot-server's fastapi endpoints are now the default ([f69f276](https://github.com/Opentrons/opentrons/commit/f69f276)), closes [#5510](https://github.com/Opentrons/opentrons/issues/5510)





## [3.17.1](https://github.com/Opentrons/opentrons/compare/v3.17.1-alpha.3...v3.17.1) (2020-05-06)

**Note:** Version bump only for package @opentrons/robot-server
