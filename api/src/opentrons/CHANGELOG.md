# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
