# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.5.0-beta.1"></a>
# [3.5.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.0...v3.5.0-beta.1) (2018-10-16)

**Note:** Version bump only for package @opentrons/discovery-client





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Bug Fixes

* **discovery-client:** Ensure IPs are actually de-duped ([#2404](https://github.com/Opentrons/opentrons/issues/2404)) ([928dcab](https://github.com/Opentrons/opentrons/commit/928dcab))
* **discovery-client:** Monkeypatch uncatchable throw from mdns-js ([#2433](https://github.com/Opentrons/opentrons/issues/2433)) ([c177f87](https://github.com/Opentrons/opentrons/commit/c177f87))


### Features

* **app:** Display reachable but non-connectable robots ([#2455](https://github.com/Opentrons/opentrons/issues/2455)) ([8785ea8](https://github.com/Opentrons/opentrons/commit/8785ea8)), closes [#2345](https://github.com/Opentrons/opentrons/issues/2345)
* **discovery-client:** Add mdns flag and health responses to services ([#2420](https://github.com/Opentrons/opentrons/issues/2420)) ([0c06d32](https://github.com/Opentrons/opentrons/commit/0c06d32))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)

**Note:** Version bump only for package @opentrons/discovery-client





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Bug Fixes

* **discovery-client:** Fix health state latching regression ([#2280](https://github.com/Opentrons/opentrons/issues/2280)) ([9176758](https://github.com/Opentrons/opentrons/commit/9176758))


### Features

* **discovery-client:** Add /server/update/health check to poller ([#2206](https://github.com/Opentrons/opentrons/issues/2206)) ([d08a87d](https://github.com/Opentrons/opentrons/commit/d08a87d))





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)

**Note:** Version bump only for package @opentrons/discovery-client





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Features

* **app:** Persist known robots to file-system when using new discovery ([#2065](https://github.com/Opentrons/opentrons/issues/2065)) ([55b4000](https://github.com/Opentrons/opentrons/commit/55b4000))
* **discovery-client:** Add CLI commands to find and SSH into a robot ([#2072](https://github.com/Opentrons/opentrons/issues/2072)) ([5ae3ef1](https://github.com/Opentrons/opentrons/commit/5ae3ef1))
* **discovery-client:** Add standalone discovery-client to repo ([#1996](https://github.com/Opentrons/opentrons/issues/1996)) ([a2becbe](https://github.com/Opentrons/opentrons/commit/a2becbe)), closes [#1944](https://github.com/Opentrons/opentrons/issues/1944)
