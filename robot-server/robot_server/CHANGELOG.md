# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.19.0-alpha.4](https://github.com/Opentrons/opentrons/compare/v3.19.0-alpha.3...v3.19.0-alpha.4) (2020-06-23)

**Note:** Version bump only for package @opentrons/robot-server





# [3.19.0-alpha.3](https://github.com/Opentrons/opentrons/compare/v3.19.0-alpha.2...v3.19.0-alpha.3) (2020-06-22)

**Note:** Version bump only for package @opentrons/robot-server





# [3.19.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v3.19.0-alpha.0...v3.19.0-alpha.2) (2020-06-18)


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





# [3.19.0-alpha.1](https://github.com/Opentrons/opentrons/compare/v3.19.0-alpha.0...v3.19.0-alpha.1) (2020-06-10)


### Bug Fixes

* **robot-server:** make sure fastapi validation errors are properly documented ([#5748](https://github.com/Opentrons/opentrons/issues/5748)) ([dbecbfc](https://github.com/Opentrons/opentrons/commit/dbecbfc))
* **robot-server:** preserve newlines in text logs ([#5850](https://github.com/Opentrons/opentrons/issues/5850)) ([6420b5f](https://github.com/Opentrons/opentrons/commit/6420b5f)), closes [#5846](https://github.com/Opentrons/opentrons/issues/5846)


### Features

* **robot-server:** Mock up of access control models and router. ([#5749](https://github.com/Opentrons/opentrons/issues/5749)) ([05348ec](https://github.com/Opentrons/opentrons/commit/05348ec)), closes [#5746](https://github.com/Opentrons/opentrons/issues/5746)
* **robot-server:** session manager ([#5796](https://github.com/Opentrons/opentrons/issues/5796)) ([c1fd7e8](https://github.com/Opentrons/opentrons/commit/c1fd7e8)), closes [#5763](https://github.com/Opentrons/opentrons/issues/5763) [#5765](https://github.com/Opentrons/opentrons/issues/5765)







**Note:** Version bump only for package @opentrons/robot-server





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
