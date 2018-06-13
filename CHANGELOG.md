# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)


### Bug Fixes

* **api:** Fallback for update endpoints ([#1669](https://github.com/Opentrons/opentrons/issues/1669)) ([3ce97df](https://github.com/Opentrons/opentrons/commit/3ce97df))
* **app:** Add priority 2 analytics events ([#1627](https://github.com/Opentrons/opentrons/issues/1627)) ([08e622e](https://github.com/Opentrons/opentrons/commit/08e622e)), closes [#1553](https://github.com/Opentrons/opentrons/issues/1553)
* **app:** Hide modal title in pick up tip spinner ([#1635](https://github.com/Opentrons/opentrons/issues/1635)) ([1509f1a](https://github.com/Opentrons/opentrons/commit/1509f1a)), closes [#1630](https://github.com/Opentrons/opentrons/issues/1630)
* **app:** Reset calibration state on reset run ([#1682](https://github.com/Opentrons/opentrons/issues/1682)) ([689e586](https://github.com/Opentrons/opentrons/commit/689e586)), closes [#1597](https://github.com/Opentrons/opentrons/issues/1597)
* **app:** Tip probe clears labware calibration progress ([#1634](https://github.com/Opentrons/opentrons/issues/1634)) ([9d216a4](https://github.com/Opentrons/opentrons/commit/9d216a4)), closes [#1620](https://github.com/Opentrons/opentrons/issues/1620)
* **app:** Update cancel button text ([#1644](https://github.com/Opentrons/opentrons/issues/1644)) ([c0870d8](https://github.com/Opentrons/opentrons/commit/c0870d8)), closes [#1639](https://github.com/Opentrons/opentrons/issues/1639)
* **app:** Update Z calibration slot 5 diagram ([#1638](https://github.com/Opentrons/opentrons/issues/1638)) ([35e50cb](https://github.com/Opentrons/opentrons/commit/35e50cb)), closes [#1608](https://github.com/Opentrons/opentrons/issues/1608)
* **app-shell:** Remove Reload from View menu unless devtools are active ([#1659](https://github.com/Opentrons/opentrons/issues/1659)) ([b7cd58c](https://github.com/Opentrons/opentrons/commit/b7cd58c)), closes [#1618](https://github.com/Opentrons/opentrons/issues/1618)
* **protocol-designer:** fix bug with multi-channel substeps ([#1663](https://github.com/Opentrons/opentrons/issues/1663)) ([1fca294](https://github.com/Opentrons/opentrons/commit/1fca294))


### Features

* **app:** Add firmware version to robot settings page ([#1633](https://github.com/Opentrons/opentrons/issues/1633)) ([9a32383](https://github.com/Opentrons/opentrons/commit/9a32383))
* **app:** Add resources page to more section ([#1631](https://github.com/Opentrons/opentrons/issues/1631)) ([443afc0](https://github.com/Opentrons/opentrons/commit/443afc0)), closes [#1607](https://github.com/Opentrons/opentrons/issues/1607)
* **app:** Capture and display errors during deck calibration ([#1680](https://github.com/Opentrons/opentrons/issues/1680)) ([4f75ed7](https://github.com/Opentrons/opentrons/commit/4f75ed7)), closes [#1641](https://github.com/Opentrons/opentrons/issues/1641)
* **app:** Pass server-lib and firmware to /server/update ([#1679](https://github.com/Opentrons/opentrons/issues/1679)) ([4dc8a76](https://github.com/Opentrons/opentrons/commit/4dc8a76)), closes [#1115](https://github.com/Opentrons/opentrons/issues/1115)
* **app:** Toggle devtools feature flag in app settings ([#1678](https://github.com/Opentrons/opentrons/issues/1678)) ([6676903](https://github.com/Opentrons/opentrons/commit/6676903)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **components:** make info title text selected-dark ([5eeec11](https://github.com/Opentrons/opentrons/commit/5eeec11))
* **protocol-designer:** Darken font in labware selection modal ([#1646](https://github.com/Opentrons/opentrons/issues/1646)) ([aacc76c](https://github.com/Opentrons/opentrons/commit/aacc76c)), closes [#1341](https://github.com/Opentrons/opentrons/issues/1341)
* **protocol-designer:** elaborate on deck setup in title bar ([#1637](https://github.com/Opentrons/opentrons/issues/1637)) ([6bda925](https://github.com/Opentrons/opentrons/commit/6bda925)), closes [#1339](https://github.com/Opentrons/opentrons/issues/1339)
* **protocol-designer:** increase selected pipette font-size ([#1629](https://github.com/Opentrons/opentrons/issues/1629)) ([b90e767](https://github.com/Opentrons/opentrons/commit/b90e767)), closes [#1325](https://github.com/Opentrons/opentrons/issues/1325)
* **protocol-designer:** update behavior for well setup ([#1511](https://github.com/Opentrons/opentrons/issues/1511)) ([8c611b5](https://github.com/Opentrons/opentrons/commit/8c611b5))


### Performance Improvements

* **api:** decrease Y and ZA currents ([#1647](https://github.com/Opentrons/opentrons/issues/1647)) ([3fe7358](https://github.com/Opentrons/opentrons/commit/3fe7358))
