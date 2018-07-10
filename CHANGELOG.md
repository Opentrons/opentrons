# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package opentrons





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)


### Bug Fixes

* **api:** Fix row order in labware.create ([#1749](https://github.com/Opentrons/opentrons/issues/1749)) ([40ac527](https://github.com/Opentrons/opentrons/commit/40ac527)), closes [#1748](https://github.com/Opentrons/opentrons/issues/1748)
* **app:** Fix overlay and redirect duplication in robot settings page ([#1759](https://github.com/Opentrons/opentrons/issues/1759)) ([ce94b22](https://github.com/Opentrons/opentrons/commit/ce94b22))
* **components:** Resize main navbar and title bar to match designs ([#1757](https://github.com/Opentrons/opentrons/issues/1757)) ([4d46011](https://github.com/Opentrons/opentrons/commit/4d46011)), closes [#1285](https://github.com/Opentrons/opentrons/issues/1285)


### Features

* **protocol-designer:** allow button to look hovered via .hover class ([#1732](https://github.com/Opentrons/opentrons/issues/1732)) ([04173b7](https://github.com/Opentrons/opentrons/commit/04173b7)), closes [#1690](https://github.com/Opentrons/opentrons/issues/1690)





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)


### Bug Fixes

* **api:** Sanitize wifi inputs to handle special characters ([#1743](https://github.com/Opentrons/opentrons/issues/1743)) ([18f8d0f](https://github.com/Opentrons/opentrons/commit/18f8d0f))
* **protocol-designer:** set max width of form field rows ([#1723](https://github.com/Opentrons/opentrons/issues/1723)) ([c3a0dc6](https://github.com/Opentrons/opentrons/commit/c3a0dc6)), closes [#1488](https://github.com/Opentrons/opentrons/issues/1488)


### Features

* **api:** Log API server and Smoothie FW versions on API server boot ([#1728](https://github.com/Opentrons/opentrons/issues/1728)) ([6c3c3c4](https://github.com/Opentrons/opentrons/commit/6c3c3c4)), closes [#1120](https://github.com/Opentrons/opentrons/issues/1120)
* **app:** Connect home button to API on robot settings ([#1726](https://github.com/Opentrons/opentrons/issues/1726)) ([103d8c0](https://github.com/Opentrons/opentrons/commit/103d8c0)), closes [#856](https://github.com/Opentrons/opentrons/issues/856)
* **protocol-designer:** disallow saving ingred form w/o name & volume ([#1724](https://github.com/Opentrons/opentrons/issues/1724)) ([206d378](https://github.com/Opentrons/opentrons/commit/206d378)), closes [#1609](https://github.com/Opentrons/opentrons/issues/1609) [#1671](https://github.com/Opentrons/opentrons/issues/1671)





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)


### Bug Fixes

* **api:** Add ignore update endpoint implementation to fallback file ([#1720](https://github.com/Opentrons/opentrons/issues/1720)) ([2a68dc5](https://github.com/Opentrons/opentrons/commit/2a68dc5))
* **api:** Fix RPC reporting wrong models for v1.3 pipettes ([#1691](https://github.com/Opentrons/opentrons/issues/1691)) ([e302382](https://github.com/Opentrons/opentrons/commit/e302382))
* **api:** Fixes bug in replacing substring of old p50 pipettes written with v13 instead of v1.3 ([#1717](https://github.com/Opentrons/opentrons/issues/1717)) ([1322055](https://github.com/Opentrons/opentrons/commit/1322055))
* **app:** Enable robot update even if API reports up-to-date ([#1721](https://github.com/Opentrons/opentrons/issues/1721)) ([16bb8eb](https://github.com/Opentrons/opentrons/commit/16bb8eb))
* **app:** Fix alignment issues in modals, fix titlebar on page ([#1719](https://github.com/Opentrons/opentrons/issues/1719)) ([ccf4881](https://github.com/Opentrons/opentrons/commit/ccf4881))
* **app:** Switch to hash routes to enable goBack in prod ([#1722](https://github.com/Opentrons/opentrons/issues/1722)) ([9bf2398](https://github.com/Opentrons/opentrons/commit/9bf2398))
* **protocol-designer:** fix styles for SelectionRect ([#1714](https://github.com/Opentrons/opentrons/issues/1714)) ([295940e](https://github.com/Opentrons/opentrons/commit/295940e))


### Features

* **api:** Add endpoints to handle API update ignores ([#1693](https://github.com/Opentrons/opentrons/issues/1693)) ([8c5eae9](https://github.com/Opentrons/opentrons/commit/8c5eae9))
* **app:** Add toggle to turn on/off robot rail lights ([#1710](https://github.com/Opentrons/opentrons/issues/1710)) ([d2c182c](https://github.com/Opentrons/opentrons/commit/d2c182c)), closes [#1684](https://github.com/Opentrons/opentrons/issues/1684)
* **app:** Show connect alert banner on successful connection ([#1700](https://github.com/Opentrons/opentrons/issues/1700)) ([70cd8b2](https://github.com/Opentrons/opentrons/commit/70cd8b2)), closes [#1314](https://github.com/Opentrons/opentrons/issues/1314)
* **protocol-designer:** clarify editing file details ([d03d42f](https://github.com/Opentrons/opentrons/commit/d03d42f)), closes [#1504](https://github.com/Opentrons/opentrons/issues/1504) [#1661](https://github.com/Opentrons/opentrons/issues/1661)





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
