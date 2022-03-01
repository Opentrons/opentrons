# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.2-alpha.0](https://github.com/Opentrons/opentrons/compare/v5.0.1...v5.0.2-alpha.0) (2022-03-01)


### Bug Fixes

* send custom labware definitions to the server during LPC setup ([#9588](https://github.com/Opentrons/opentrons/issues/9588)) ([7cf3233](https://github.com/Opentrons/opentrons/commit/7cf323370aefb952b0640d04738c64a0f4a2e5c9))





## [5.0.1](https://github.com/Opentrons/opentrons/compare/v5.0.0...v5.0.1) (2022-02-24)

**Note:** Version bump only for package @opentrons/api-client





# [5.0.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0) (2022-02-16)


### Bug Fixes

* **app:** fix up labware offset matching logic for labware setup overlays ([#8932](https://github.com/Opentrons/opentrons/issues/8932)) ([91eb5e3](https://github.com/Opentrons/opentrons/commit/91eb5e3c1e62038d3cbb59067903658c62ee2bd3))
* **app:** shore up edge cases of current command tracking, use new commands endpoint link metadata ([#9418](https://github.com/Opentrons/opentrons/issues/9418)) ([3c27050](https://github.com/Opentrons/opentrons/commit/3c270503244ee6250d0fff3f902d9356b79892d3)), closes [#9379](https://github.com/Opentrons/opentrons/issues/9379)


### Features

* **app:** clear previous labware offsets on LPC start ([#8895](https://github.com/Opentrons/opentrons/issues/8895)) ([be31e2f](https://github.com/Opentrons/opentrons/commit/be31e2ff0553774a687296930c53e87058fa9f6f))
* **app:** Run Details Command List ([#8682](https://github.com/Opentrons/opentrons/issues/8682)) ([9ddf133](https://github.com/Opentrons/opentrons/commit/9ddf133f724389444b1ab269238e6aeb862768fe)), closes [#8368](https://github.com/Opentrons/opentrons/issues/8368) [#8481](https://github.com/Opentrons/opentrons/issues/8481)
* **app:** show offset deletion warning if previous offsets exist ([#8919](https://github.com/Opentrons/opentrons/issues/8919)) ([98f9696](https://github.com/Opentrons/opentrons/commit/98f96961a66312fcb633f5ce4d3fcfec1506a3e0)), closes [#8841](https://github.com/Opentrons/opentrons/issues/8841)
* **app:** use module model when applying labware offsets ([#8992](https://github.com/Opentrons/opentrons/issues/8992)) ([eaea065](https://github.com/Opentrons/opentrons/commit/eaea0656710d8734168cd4ad84b08043783f50c0))
* **app:** wire up labware position check ([#8774](https://github.com/Opentrons/opentrons/issues/8774)) ([6b2c3f1](https://github.com/Opentrons/opentrons/commit/6b2c3f1cfcfcc98b200919ad34544a661641c2cb))
* **app:** wire up labware setup accordion step labware offsets ([#8887](https://github.com/Opentrons/opentrons/issues/8887)) ([8672854](https://github.com/Opentrons/opentrons/commit/8672854b28e5cfbec90f1cd9705ee91998355e63)), closes [#8859](https://github.com/Opentrons/opentrons/issues/8859)
* **app:** wire up protocol resource + LPC ([#8722](https://github.com/Opentrons/opentrons/issues/8722)) ([c463e0a](https://github.com/Opentrons/opentrons/commit/c463e0a22ebccf410d67c6b18fe3c50b8a4a8d03)), closes [#8553](https://github.com/Opentrons/opentrons/issues/8553)
* **app, api-client:** add custom labware support ([#9044](https://github.com/Opentrons/opentrons/issues/9044)) ([9cbff27](https://github.com/Opentrons/opentrons/commit/9cbff274e5989ae6434032052a9875606ab249b3)), closes [#9026](https://github.com/Opentrons/opentrons/issues/9026)
* **robot-server,api,app:** When adding a jog command over HTTP, wait for it to complete before returning ([#9410](https://github.com/Opentrons/opentrons/issues/9410)) ([4d811d5](https://github.com/Opentrons/opentrons/commit/4d811d5485754b45795a275424e0b267edc88270))


### Performance Improvements

* **app:** virtualize command list on run detail page ([#9275](https://github.com/Opentrons/opentrons/issues/9275)) ([028e85f](https://github.com/Opentrons/opentrons/commit/028e85f89a9e12da98824e009e822d2dbb0022ea)), closes [#9217](https://github.com/Opentrons/opentrons/issues/9217)
* **app, robot-server:** paginate /runs/:run_id/commands response ([#9348](https://github.com/Opentrons/opentrons/issues/9348)) ([b9eb7b4](https://github.com/Opentrons/opentrons/commit/b9eb7b4d98532480705d3c32fd2485508315bea9))
* **robot-server, api-client:** return run summaries from GET /runs rather than full run models ([#9332](https://github.com/Opentrons/opentrons/issues/9332)) ([66b1d7c](https://github.com/Opentrons/opentrons/commit/66b1d7c0082970c53306eb99006309914ad33b22))
* **robot-server, app:** remove commands from GET /runs/:run_id ([#9337](https://github.com/Opentrons/opentrons/issues/9337)) ([56f291a](https://github.com/Opentrons/opentrons/commit/56f291a1a4179322d440621e745186269e2dc4ee))





# [4.7.0](https://github.com/opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)

### Features

* **api-client:** add protocol resource to api-client and react-api-client ([#8577](https://github.com/opentrons/opentrons/issues/8577)) ([bcd50e7](https://github.com/opentrons/opentrons/commit/bcd50e79bf94ad5fa2d5d7288a1fbb587752567f)), closes [#8460](https://github.com/opentrons/opentrons/issues/8460)
* **app:** add js api client utils and wire up generic step screen ([#8638](https://github.com/opentrons/opentrons/issues/8638)) ([d790a0b](https://github.com/opentrons/opentrons/commit/d790a0bd04e35b78d93526850d90cf4d46db91cc)), closes [#8552](https://github.com/opentrons/opentrons/issues/8552)
* **app:** add PE analysis schema v6 adapter ([31fcc98](https://github.com/opentrons/opentrons/commit/31fcc9885c6be2b077f2b865f96fe99e981529c1)), closes [#8661](https://github.com/opentrons/opentrons/issues/8661)
* **app:** wire up protocol upload ([#8663](https://github.com/opentrons/opentrons/issues/8663)) ([3b8d754](https://github.com/opentrons/opentrons/commit/3b8d7541f110279ce0955ded13bbc3af714bb0de))
