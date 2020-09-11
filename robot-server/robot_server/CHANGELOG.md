# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.21.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v3.21.0-alpha.1...v3.21.0-alpha.2) (2020-09-11)


### Bug Fixes

* **robot-server:** calibraiton flows - fix assert statements ([#6529](https://github.com/Opentrons/opentrons/issues/6529)) ([a269b0f](https://github.com/Opentrons/opentrons/commit/a269b0f))





# [3.21.0-alpha.1](https://github.com/Opentrons/opentrons/compare/v3.21.0-alpha.0...v3.21.0-alpha.1) (2020-09-11)


### Bug Fixes

* **robot-server:** tip length cal -  use nozzle height for tip length calculation ([#6527](https://github.com/Opentrons/opentrons/issues/6527)) ([b87df49](https://github.com/Opentrons/opentrons/commit/b87df49))





# [3.21.0-alpha.0](https://github.com/Opentrons/opentrons/compare/v3.20.1...v3.21.0-alpha.0) (2020-09-10)


### Bug Fixes

* **robot-server:** add inspectingTip state to deck calibration ([#6313](https://github.com/Opentrons/opentrons/issues/6313)) ([c1fd90a](https://github.com/Opentrons/opentrons/commit/c1fd90a))
* **robot-server:** correct move to deck safety buffer in y ([#6478](https://github.com/Opentrons/opentrons/issues/6478)) ([a124bb5](https://github.com/Opentrons/opentrons/commit/a124bb5))
* **robot-server:** datetime responses are missing timezone. ([#6375](https://github.com/Opentrons/opentrons/issues/6375)) ([1a65835](https://github.com/Opentrons/opentrons/commit/1a65835)), closes [#6374](https://github.com/Opentrons/opentrons/issues/6374)
* **robot-server:** deck calibration flow clean up ([#6430](https://github.com/Opentrons/opentrons/issues/6430)) ([986e5d1](https://github.com/Opentrons/opentrons/commit/986e5d1))
* **robot-server:** fix multi channel move in tip length cal ([#6319](https://github.com/Opentrons/opentrons/issues/6319)) ([898a24b](https://github.com/Opentrons/opentrons/commit/898a24b))
* **robot-server:** only import type_extension during type checking ([#6462](https://github.com/Opentrons/opentrons/issues/6462)) ([b3c844d](https://github.com/Opentrons/opentrons/commit/b3c844d))
* **robot-server:** pipette offset - uses z ref height to move to point ([#6514](https://github.com/Opentrons/opentrons/issues/6514)) ([58116d0](https://github.com/Opentrons/opentrons/commit/58116d0)), closes [#6424](https://github.com/Opentrons/opentrons/issues/6424)
* **robot-server:** pipette offset cal - add missing arg to save offset data ([#6520](https://github.com/Opentrons/opentrons/issues/6520)) ([13c2b27](https://github.com/Opentrons/opentrons/commit/13c2b27))


### Features

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
