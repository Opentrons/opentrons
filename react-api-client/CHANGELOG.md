# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.2.0-alpha.3](https://github.com/Opentrons/opentrons/compare/v6.2.0-alpha.2...v6.2.0-alpha.3) (2022-11-10)

**Note:** Version bump only for package @opentrons/react-api-client





# [6.2.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v6.2.0-alpha.1...v6.2.0-alpha.2) (2022-11-04)

**Note:** Version bump only for package @opentrons/react-api-client





# [6.2.0-alpha.1](https://github.com/Opentrons/opentrons/compare/v6.2.0-alpha.0...v6.2.0-alpha.1) (2022-11-03)

**Note:** Version bump only for package @opentrons/react-api-client





# [6.2.0-alpha.0](https://github.com/Opentrons/opentrons/compare/v6.1.0...v6.2.0-alpha.0) (2022-10-27)

**Note:** Version bump only for package @opentrons/react-api-client





# [6.1.0](https://github.com/Opentrons/opentrons/compare/v6.0.1...v6.1.0) (2022-09-27)

**Note:** Version bump only for package @opentrons/react-api-client





## [6.0.1](https://github.com/Opentrons/opentrons/compare/v6.0.0...v6.0.1) (2022-08-09)

**Note:** Version bump only for package @opentrons/react-api-client





# [6.0.0](https://github.com/Opentrons/opentrons/compare/v5.0.2...v6.0.0) (2022-07-14)


### Bug Fixes

* **app:** cancelling a protocol run should patch the run to current false ([#10452](https://github.com/Opentrons/opentrons/issues/10452)) ([20848a1](https://github.com/Opentrons/opentrons/commit/20848a15b1ece3885489527ffd96dff302be1f62)), closes [#10412](https://github.com/Opentrons/opentrons/issues/10412)
* **app:** fix Browse file system button issues ([#11113](https://github.com/Opentrons/opentrons/issues/11113)) ([ec1a4bb](https://github.com/Opentrons/opentrons/commit/ec1a4bbeab8af136cd4162d156b7916a1c95f65d)), closes [#11105](https://github.com/Opentrons/opentrons/issues/11105)
* **app:** fix robot settings rename a robot name ([#10044](https://github.com/Opentrons/opentrons/issues/10044)) ([c561f2d](https://github.com/Opentrons/opentrons/commit/c561f2d61b2921de52e8df9ad42d07877c2cdcf3))
* **app:** fix white screen issue after renaming clicking advanced tab ([#10463](https://github.com/Opentrons/opentrons/issues/10463)) ([e272382](https://github.com/Opentrons/opentrons/commit/e272382d0b3a2318fdf1b8271521bbfc8d164d32))
* **app, react-api-client:** add run creation spinner and handle errors in slideouts during run creation ([#10944](https://github.com/Opentrons/opentrons/issues/10944)) ([3002093](https://github.com/Opentrons/opentrons/commit/300209338efcd77071632d88a677ab2a68636a71))
* **react-api-client:** fix check for v3 module ([#10460](https://github.com/Opentrons/opentrons/issues/10460)) ([8a48ddc](https://github.com/Opentrons/opentrons/commit/8a48ddc5f429cca54cf58671d545d347e282f237))


### Features

* **api-client, react-api-client:** add create live command hook ([#9656](https://github.com/Opentrons/opentrons/issues/9656)) ([3f147a8](https://github.com/Opentrons/opentrons/commit/3f147a8f4dccaa369f518238700d4f287dbb9a08)), closes [#9650](https://github.com/Opentrons/opentrons/issues/9650)
* **app:**  App robot settings advanced tab robot update ([#10010](https://github.com/Opentrons/opentrons/issues/10010)) ([cf4e9ec](https://github.com/Opentrons/opentrons/commit/cf4e9ecf1bc825bf86339fb0867781a8e25f7e3a))
* **app:** propose recent labware offsets to be reapplied for new protocol runs ([#10216](https://github.com/Opentrons/opentrons/issues/10216)) ([15c372c](https://github.com/Opentrons/opentrons/commit/15c372c523f376fcd592f784072aceb6254f108a)), closes [#9795](https://github.com/Opentrons/opentrons/issues/9795)
* **app, app-shell, api-client:** include analysis as cli tool within app for protocol ingestion  ([#9825](https://github.com/Opentrons/opentrons/issues/9825)) ([cdf6c59](https://github.com/Opentrons/opentrons/commit/cdf6c59a96ea6ea5dca2ed79269537dbc0bc6ff7))





## [5.0.2](https://github.com/Opentrons/opentrons/compare/v5.0.1...v5.0.2) (2022-03-03)


### Bug Fixes

* send custom labware definitions to the server during LPC setup ([#9588](https://github.com/Opentrons/opentrons/issues/9588)) ([7cf3233](https://github.com/Opentrons/opentrons/commit/7cf323370aefb952b0640d04738c64a0f4a2e5c9))





## [5.0.1](https://github.com/Opentrons/opentrons/compare/v5.0.0...v5.0.1) (2022-02-24)

**Note:** Version bump only for package @opentrons/react-api-client





# [5.0.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0) (2022-02-16)


### Bug Fixes

* **app:** fix up labware offset matching logic for labware setup overlays ([#8932](https://github.com/Opentrons/opentrons/issues/8932)) ([91eb5e3](https://github.com/Opentrons/opentrons/commit/91eb5e3c1e62038d3cbb59067903658c62ee2bd3))
* **app:** shore up edge cases of current command tracking, use new commands endpoint link metadata ([#9418](https://github.com/Opentrons/opentrons/issues/9418)) ([3c27050](https://github.com/Opentrons/opentrons/commit/3c270503244ee6250d0fff3f902d9356b79892d3)), closes [#9379](https://github.com/Opentrons/opentrons/issues/9379)


### Features

* **app:** clear previous labware offsets on LPC start ([#8895](https://github.com/Opentrons/opentrons/issues/8895)) ([be31e2f](https://github.com/Opentrons/opentrons/commit/be31e2ff0553774a687296930c53e87058fa9f6f))
* **app:** Run Details Command List ([#8682](https://github.com/Opentrons/opentrons/issues/8682)) ([9ddf133](https://github.com/Opentrons/opentrons/commit/9ddf133f724389444b1ab269238e6aeb862768fe)), closes [#8368](https://github.com/Opentrons/opentrons/issues/8368) [#8481](https://github.com/Opentrons/opentrons/issues/8481)
* **app:** wire up labware position check ([#8774](https://github.com/Opentrons/opentrons/issues/8774)) ([6b2c3f1](https://github.com/Opentrons/opentrons/commit/6b2c3f1cfcfcc98b200919ad34544a661641c2cb))
* **robot-server,api,app:** When adding a jog command over HTTP, wait for it to complete before returning ([#9410](https://github.com/Opentrons/opentrons/issues/9410)) ([4d811d5](https://github.com/Opentrons/opentrons/commit/4d811d5485754b45795a275424e0b267edc88270))


### Performance Improvements

* **app, robot-server:** paginate /runs/:run_id/commands response ([#9348](https://github.com/Opentrons/opentrons/issues/9348)) ([b9eb7b4](https://github.com/Opentrons/opentrons/commit/b9eb7b4d98532480705d3c32fd2485508315bea9))
* **robot-server, api-client:** return run summaries from GET /runs rather than full run models ([#9332](https://github.com/Opentrons/opentrons/issues/9332)) ([66b1d7c](https://github.com/Opentrons/opentrons/commit/66b1d7c0082970c53306eb99006309914ad33b22))
* **robot-server, app:** remove commands from GET /runs/:run_id ([#9337](https://github.com/Opentrons/opentrons/issues/9337)) ([56f291a](https://github.com/Opentrons/opentrons/commit/56f291a1a4179322d440621e745186269e2dc4ee))





# [4.7.0](https://github.com/opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)


### Bug Fixes

* **react-api-client:** add missing protocols export ([#8618](https://github.com/opentrons/opentrons/issues/8618)) ([d15de3d](https://github.com/opentrons/opentrons/commit/d15de3d774f8ebca2418f174a211a4738a3c8823))


### Features

* **api-client:** add protocol resource to api-client and react-api-client ([#8577](https://github.com/opentrons/opentrons/issues/8577)) ([bcd50e7](https://github.com/opentrons/opentrons/commit/bcd50e79bf94ad5fa2d5d7288a1fbb587752567f)), closes [#8460](https://github.com/opentrons/opentrons/issues/8460)
* **app:** add js api client utils and wire up generic step screen ([#8638](https://github.com/opentrons/opentrons/issues/8638)) ([d790a0b](https://github.com/opentrons/opentrons/commit/d790a0bd04e35b78d93526850d90cf4d46db91cc)), closes [#8552](https://github.com/opentrons/opentrons/issues/8552)
* **app:** add PE analysis schema v6 adapter ([31fcc98](https://github.com/opentrons/opentrons/commit/31fcc9885c6be2b077f2b865f96fe99e981529c1)), closes [#8661](https://github.com/opentrons/opentrons/issues/8661)
* **app:** wire up protocol upload ([#8663](https://github.com/opentrons/opentrons/issues/8663)) ([3b8d754](https://github.com/opentrons/opentrons/commit/3b8d7541f110279ce0955ded13bbc3af714bb0de))
