# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/OpenTrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)


### Bug Fixes

* **api:** check virtual smoothie before copying udev file on server start ([#1960](https://github.com/OpenTrons/opentrons/issues/1960)) ([9a31f3d](https://github.com/OpenTrons/opentrons/commit/9a31f3d))
* **api:** Fix pipette.delay() so it does not sleep during protocol simulation ([#1902](https://github.com/OpenTrons/opentrons/issues/1902)) ([f63bdba](https://github.com/OpenTrons/opentrons/commit/f63bdba))
* **api:** Fix the database migration script geometry logic ([#1959](https://github.com/OpenTrons/opentrons/issues/1959)) ([7ae9756](https://github.com/OpenTrons/opentrons/commit/7ae9756))
* **api:** Home Z axes before run to guarantee that pipettes will be retracted ([#1914](https://github.com/OpenTrons/opentrons/issues/1914)) ([7252a73](https://github.com/OpenTrons/opentrons/commit/7252a73))
* **api:** support touch-tip for JSON protocols ([#2000](https://github.com/OpenTrons/opentrons/issues/2000)) ([43125b7](https://github.com/OpenTrons/opentrons/commit/43125b7)), closes [#1997](https://github.com/OpenTrons/opentrons/issues/1997)
* **app:** Check if modulesRequired when displaying review modals ([#1940](https://github.com/OpenTrons/opentrons/issues/1940)) ([14a54a5](https://github.com/OpenTrons/opentrons/commit/14a54a5))
* **docker:** Switch out dumb-init, add modules tools & udev config ([#1952](https://github.com/OpenTrons/opentrons/issues/1952)) ([caac645](https://github.com/OpenTrons/opentrons/commit/caac645)), closes [#1822](https://github.com/OpenTrons/opentrons/issues/1822)
* **protocol-designer:** fix bug where tips not dropped at end of protocol ([#1911](https://github.com/OpenTrons/opentrons/issues/1911)) ([945ff6a](https://github.com/OpenTrons/opentrons/commit/945ff6a)), closes [#969](https://github.com/OpenTrons/opentrons/issues/969)
* **protocol-designer:** fix destination well pills in substeps ([#1896](https://github.com/OpenTrons/opentrons/issues/1896)) ([60481b5](https://github.com/OpenTrons/opentrons/commit/60481b5)), closes [#1812](https://github.com/OpenTrons/opentrons/issues/1812)
* **protocol-designer:** fix file load bug w mismatched pipette ids ([#1918](https://github.com/OpenTrons/opentrons/issues/1918)) ([9ec52d1](https://github.com/OpenTrons/opentrons/commit/9ec52d1))
* **protocol-designer:** fix styling of pause and mix step items ([#1948](https://github.com/OpenTrons/opentrons/issues/1948)) ([16c2a30](https://github.com/OpenTrons/opentrons/commit/16c2a30)), closes [#1947](https://github.com/OpenTrons/opentrons/issues/1947)
* **protocol-designer:** fix substeps for consolidate using inner mix ([#1921](https://github.com/OpenTrons/opentrons/issues/1921)) ([e59cc7e](https://github.com/OpenTrons/opentrons/commit/e59cc7e)), closes [#1919](https://github.com/OpenTrons/opentrons/issues/1919)
* **protocol-designer:** make well selection modal show pipette display name ([#1907](https://github.com/OpenTrons/opentrons/issues/1907)) ([07ad9ff](https://github.com/OpenTrons/opentrons/commit/07ad9ff)), closes [#1888](https://github.com/OpenTrons/opentrons/issues/1888)
* **protocol-designer:** Only show deck setup prompt text when selected ([#1894](https://github.com/OpenTrons/opentrons/issues/1894)) ([32656ef](https://github.com/OpenTrons/opentrons/commit/32656ef))


### Features

* **api:** Add "modules" field to RPC ([#1890](https://github.com/OpenTrons/opentrons/issues/1890)) ([f80ad18](https://github.com/OpenTrons/opentrons/commit/f80ad18)), closes [#1733](https://github.com/OpenTrons/opentrons/issues/1733)
* **api:** Add clear method to RPC SessionManager ([#1969](https://github.com/OpenTrons/opentrons/issues/1969)) ([8228e6d](https://github.com/OpenTrons/opentrons/commit/8228e6d))
* **api:** Add endpoints to get robot logs ([#1928](https://github.com/OpenTrons/opentrons/issues/1928)) ([9224719](https://github.com/OpenTrons/opentrons/commit/9224719))
* **api:** add magdeck api object ([#1925](https://github.com/OpenTrons/opentrons/issues/1925)) ([b016eec](https://github.com/OpenTrons/opentrons/commit/b016eec)), closes [#1889](https://github.com/OpenTrons/opentrons/issues/1889) [#1887](https://github.com/OpenTrons/opentrons/issues/1887) [#1886](https://github.com/OpenTrons/opentrons/issues/1886) [#1645](https://github.com/OpenTrons/opentrons/issues/1645)
* **api:** Add tempdeck api object ([#1962](https://github.com/OpenTrons/opentrons/issues/1962)) ([cb7f107](https://github.com/OpenTrons/opentrons/commit/cb7f107)), closes [#1965](https://github.com/OpenTrons/opentrons/issues/1965) [#1648](https://github.com/OpenTrons/opentrons/issues/1648) [#1649](https://github.com/OpenTrons/opentrons/issues/1649)
* **api:** Brings back the shake after drop-tip ([#1871](https://github.com/OpenTrons/opentrons/issues/1871)) ([304c71d](https://github.com/OpenTrons/opentrons/commit/304c71d))
* **app:** Add and implement module selectors in calibration ([#1895](https://github.com/OpenTrons/opentrons/issues/1895)) ([2cf1b4d](https://github.com/OpenTrons/opentrons/commit/2cf1b4d))
* **app:** Add continuous polling to modules during run ([#1961](https://github.com/OpenTrons/opentrons/issues/1961)) ([5f7d6f4](https://github.com/OpenTrons/opentrons/commit/5f7d6f4))
* **app:** Add deck map to module review modal ([#1910](https://github.com/OpenTrons/opentrons/issues/1910)) ([f2e63e3](https://github.com/OpenTrons/opentrons/commit/f2e63e3)), closes [#1737](https://github.com/OpenTrons/opentrons/issues/1737)
* **app:** Add realtime status TempDeck card to run panel ([#1932](https://github.com/OpenTrons/opentrons/issues/1932)) ([75c8df4](https://github.com/OpenTrons/opentrons/commit/75c8df4)), closes [#1740](https://github.com/OpenTrons/opentrons/issues/1740)
* **app:** Add support for modules to RPC API client ([#1891](https://github.com/OpenTrons/opentrons/issues/1891)) ([331305f](https://github.com/OpenTrons/opentrons/commit/331305f))
* **app:** Render calibrate to bottom instructions when enabled ([#1865](https://github.com/OpenTrons/opentrons/issues/1865)) ([c427599](https://github.com/OpenTrons/opentrons/commit/c427599))
* **app:** Show connect modules modal when session modules detected ([#1897](https://github.com/OpenTrons/opentrons/issues/1897)) ([8306130](https://github.com/OpenTrons/opentrons/commit/8306130)), closes [#1738](https://github.com/OpenTrons/opentrons/issues/1738)
* **app:** Show module name over labware on deckmaps ([#1913](https://github.com/OpenTrons/opentrons/issues/1913)) ([c40905b](https://github.com/OpenTrons/opentrons/commit/c40905b)), closes [#1739](https://github.com/OpenTrons/opentrons/issues/1739)
* **app:** Show modules on review and calibration deckmaps ([#1898](https://github.com/OpenTrons/opentrons/issues/1898)) ([5917a2b](https://github.com/OpenTrons/opentrons/commit/5917a2b))
* **app:** Wire modules card to API calls (and keep stubbed response) ([#1860](https://github.com/OpenTrons/opentrons/issues/1860)) ([a30912f](https://github.com/OpenTrons/opentrons/commit/a30912f))
* **comp:** Add IntervalWrapper to interaction enhancers ([#1942](https://github.com/OpenTrons/opentrons/issues/1942)) ([21e1869](https://github.com/OpenTrons/opentrons/commit/21e1869))
* **components:** implement hover tooltip and include react popper ([#1855](https://github.com/OpenTrons/opentrons/issues/1855)) ([c44e0eb](https://github.com/OpenTrons/opentrons/commit/c44e0eb)), closes [#921](https://github.com/OpenTrons/opentrons/issues/921)
* **components:** restyle field caption ([#1991](https://github.com/OpenTrons/opentrons/issues/1991)) ([910b510](https://github.com/OpenTrons/opentrons/commit/910b510)), closes [#1936](https://github.com/OpenTrons/opentrons/issues/1936)
* **compute:** Use IPv4 link-local ethernet networking ([#1970](https://github.com/OpenTrons/opentrons/issues/1970)) ([094ca28](https://github.com/OpenTrons/opentrons/commit/094ca28))
* **protocol-designer:** add continue to design button to file data page ([#1876](https://github.com/OpenTrons/opentrons/issues/1876)) ([cd8ea5e](https://github.com/OpenTrons/opentrons/commit/cd8ea5e)), closes [#1782](https://github.com/OpenTrons/opentrons/issues/1782)
* **protocol-designer:** add help link to PD nav ([#1945](https://github.com/OpenTrons/opentrons/issues/1945)) ([1525cf5](https://github.com/OpenTrons/opentrons/commit/1525cf5)), closes [#1941](https://github.com/OpenTrons/opentrons/issues/1941)
* **protocol-designer:** add max volume to ingred selection modal volume field ([#1993](https://github.com/OpenTrons/opentrons/issues/1993)) ([807c289](https://github.com/OpenTrons/opentrons/commit/807c289)), closes [#1835](https://github.com/OpenTrons/opentrons/issues/1835)
* **protocol-designer:** alert user of unsaved changes to protocol ([#1856](https://github.com/OpenTrons/opentrons/issues/1856)) ([e195363](https://github.com/OpenTrons/opentrons/commit/e195363)), closes [#1602](https://github.com/OpenTrons/opentrons/issues/1602)
* **protocol-designer:** auto fill well volume field if inferrable ([#1870](https://github.com/OpenTrons/opentrons/issues/1870)) ([ab5a40e](https://github.com/OpenTrons/opentrons/commit/ab5a40e)), closes [#1668](https://github.com/OpenTrons/opentrons/issues/1668)
* **protocol-designer:** change copy for pipette missing tip error ([#1915](https://github.com/OpenTrons/opentrons/issues/1915)) ([cd8b920](https://github.com/OpenTrons/opentrons/commit/cd8b920)), closes [#1815](https://github.com/OpenTrons/opentrons/issues/1815) [#1880](https://github.com/OpenTrons/opentrons/issues/1880) [#1815](https://github.com/OpenTrons/opentrons/issues/1815)
* **protocol-designer:** change copy ingredients -> liquid ([#1905](https://github.com/OpenTrons/opentrons/issues/1905)) ([9f9b989](https://github.com/OpenTrons/opentrons/commit/9f9b989)), closes [#1864](https://github.com/OpenTrons/opentrons/issues/1864)
* **protocol-designer:** deactivate non-beta step settings, add tooltip ([#1875](https://github.com/OpenTrons/opentrons/issues/1875)) ([267b5b3](https://github.com/OpenTrons/opentrons/commit/267b5b3)), closes [#1873](https://github.com/OpenTrons/opentrons/issues/1873)
* **protocol-designer:** enable user to swap pipette mounts ([#1883](https://github.com/OpenTrons/opentrons/issues/1883)) ([d5e40cd](https://github.com/OpenTrons/opentrons/commit/d5e40cd)), closes [#1536](https://github.com/OpenTrons/opentrons/issues/1536)
* **protocol-designer:** implement move labware in place of copy ([#1938](https://github.com/OpenTrons/opentrons/issues/1938)) ([c51ce66](https://github.com/OpenTrons/opentrons/commit/c51ce66)), closes [#1908](https://github.com/OpenTrons/opentrons/issues/1908)
* **protocol-designer:** make form warnings & errors match TimelineAlerts ([#1924](https://github.com/OpenTrons/opentrons/issues/1924)) ([c355be8](https://github.com/OpenTrons/opentrons/commit/c355be8)), closes [#1882](https://github.com/OpenTrons/opentrons/issues/1882)
* **protocol-designer:** make pipettes eagerly drop tips ([#1946](https://github.com/OpenTrons/opentrons/issues/1946)) ([9fb0725](https://github.com/OpenTrons/opentrons/commit/9fb0725)), closes [#1706](https://github.com/OpenTrons/opentrons/issues/1706)
* **protocol-designer:** make WellSelectionInput label change for multi-channel pipette ([#1927](https://github.com/OpenTrons/opentrons/issues/1927)) ([7df3c29](https://github.com/OpenTrons/opentrons/commit/7df3c29)), closes [#1537](https://github.com/OpenTrons/opentrons/issues/1537)
* **protocol-designer:** re-order and restyle file sidebar buttons ([#1926](https://github.com/OpenTrons/opentrons/issues/1926)) ([4ae1f5b](https://github.com/OpenTrons/opentrons/commit/4ae1f5b)), closes [#1784](https://github.com/OpenTrons/opentrons/issues/1784)
* **protocol-designer:** refactor and restyle LabwareSelectionModal ([#1929](https://github.com/OpenTrons/opentrons/issues/1929)) ([7c9891e](https://github.com/OpenTrons/opentrons/commit/7c9891e))
* **protocol-designer:** refactor and restyle timeline terminal items ([#1967](https://github.com/OpenTrons/opentrons/issues/1967)) ([a2421fd](https://github.com/OpenTrons/opentrons/commit/a2421fd)), closes [#1706](https://github.com/OpenTrons/opentrons/issues/1706) [#1930](https://github.com/OpenTrons/opentrons/issues/1930) [#1974](https://github.com/OpenTrons/opentrons/issues/1974)
* **protocol-designer:** remove disposal volume field from all but distribute ([#1868](https://github.com/OpenTrons/opentrons/issues/1868)) ([7d98355](https://github.com/OpenTrons/opentrons/commit/7d98355)), closes [#1867](https://github.com/OpenTrons/opentrons/issues/1867)
* **protocol-designer:** restyle labware hover buttons ([#1916](https://github.com/OpenTrons/opentrons/issues/1916)) ([799d1b1](https://github.com/OpenTrons/opentrons/commit/799d1b1)), closes [#1519](https://github.com/OpenTrons/opentrons/issues/1519)
* **protocol-designer:** save version in PD file with git-describe ([#1987](https://github.com/OpenTrons/opentrons/issues/1987)) ([7040727](https://github.com/OpenTrons/opentrons/commit/7040727))
* **protocol-designer:** show no pipette on mount in file details ([#1917](https://github.com/OpenTrons/opentrons/issues/1917)) ([74e077c](https://github.com/OpenTrons/opentrons/commit/74e077c)), closes [#1909](https://github.com/OpenTrons/opentrons/issues/1909) [#1783](https://github.com/OpenTrons/opentrons/issues/1783)
* **protocol-designer:** support tiprack-to-pipette assignment ([#1866](https://github.com/OpenTrons/opentrons/issues/1866)) ([6a4f19d](https://github.com/OpenTrons/opentrons/commit/6a4f19d)), closes [#1573](https://github.com/OpenTrons/opentrons/issues/1573)
* **protocol-designer:** swap pen icons to pencil ([#1906](https://github.com/OpenTrons/opentrons/issues/1906)) ([70a9fc0](https://github.com/OpenTrons/opentrons/commit/70a9fc0)), closes [#1861](https://github.com/OpenTrons/opentrons/issues/1861)
* **protocol-designer:** switch well order colors ([#1878](https://github.com/OpenTrons/opentrons/issues/1878)) ([a86aa3e](https://github.com/OpenTrons/opentrons/commit/a86aa3e)), closes [#1862](https://github.com/OpenTrons/opentrons/issues/1862)
* **protocol-designer:** update copy for 'no tip on pipette' error ([#1994](https://github.com/OpenTrons/opentrons/issues/1994)) ([3a64530](https://github.com/OpenTrons/opentrons/commit/3a64530)), closes [#1975](https://github.com/OpenTrons/opentrons/issues/1975)
* **protocol-designer:** update well selection modal's TitleBar ([#1884](https://github.com/OpenTrons/opentrons/issues/1884)) ([8ce9a4c](https://github.com/OpenTrons/opentrons/commit/8ce9a4c)), closes [#1502](https://github.com/OpenTrons/opentrons/issues/1502)


### Performance Improvements

* **api:** Set axis-testing speed to 8mm/sec to avoid resonance ([#1912](https://github.com/OpenTrons/opentrons/issues/1912)) ([d7bb03b](https://github.com/OpenTrons/opentrons/commit/d7bb03b))





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Bug Fixes

* **api:** Allows floating-point temperatures to be set/read to/from temp-deck ([#1798](https://github.com/Opentrons/opentrons/issues/1798)) ([856134a](https://github.com/Opentrons/opentrons/commit/856134a))
* **api:** Fix QC script which uses 85% current to use default speeds for Y axis ([#1802](https://github.com/Opentrons/opentrons/issues/1802)) ([aa8a319](https://github.com/Opentrons/opentrons/commit/aa8a319))
* **api:** Remove incorrect call to `cache_instrument_models` ([#1810](https://github.com/Opentrons/opentrons/issues/1810)) ([2f80ece](https://github.com/Opentrons/opentrons/commit/2f80ece))
* **app:** Call GET /pipettes before starting calibration ([#1830](https://github.com/Opentrons/opentrons/issues/1830)) ([011a3a8](https://github.com/Opentrons/opentrons/commit/011a3a8))
* **app:** Disable calibration page unless protocol is fresh ([#1821](https://github.com/Opentrons/opentrons/issues/1821)) ([c9168c8](https://github.com/Opentrons/opentrons/commit/c9168c8)), closes [#1817](https://github.com/Opentrons/opentrons/issues/1817)
* **app:** Make WiFi card more lenient and understandable ([#1771](https://github.com/Opentrons/opentrons/issues/1771)) ([6f2f37d](https://github.com/Opentrons/opentrons/commit/6f2f37d))
* **app:** Remove holdover /calibrate/instruments missed by [#1765](https://github.com/Opentrons/opentrons/issues/1765) ([#1787](https://github.com/Opentrons/opentrons/issues/1787)) ([03dd305](https://github.com/Opentrons/opentrons/commit/03dd305))
* **app:** Remove tip-probed check in calibrator selector ([#1847](https://github.com/Opentrons/opentrons/issues/1847)) ([bb50677](https://github.com/Opentrons/opentrons/commit/bb50677))
* **app:** Show spinner during home on deck calibration exit ([#1760](https://github.com/Opentrons/opentrons/issues/1760)) ([b6999a8](https://github.com/Opentrons/opentrons/commit/b6999a8)), closes [#1613](https://github.com/Opentrons/opentrons/issues/1613)
* **components:** fix Deck component viewBox ([#1807](https://github.com/Opentrons/opentrons/issues/1807)) ([bff921f](https://github.com/Opentrons/opentrons/commit/bff921f))
* **components:** Make preventDefault call in HandleKeypress opt-in ([#1768](https://github.com/Opentrons/opentrons/issues/1768)) ([9e64fb2](https://github.com/Opentrons/opentrons/commit/9e64fb2)), closes [#1764](https://github.com/Opentrons/opentrons/issues/1764)
* **protocol-designer:** allow scroll when NewFileModal too tall ([#1777](https://github.com/Opentrons/opentrons/issues/1777)) ([e6238ab](https://github.com/Opentrons/opentrons/commit/e6238ab)), closes [#1776](https://github.com/Opentrons/opentrons/issues/1776)
* **protocol-designer:** do not navigate on FilePage form submit ([8f98a08](https://github.com/Opentrons/opentrons/commit/8f98a08))
* **protocol-designer:** fix labware copy mirroring ([#1859](https://github.com/Opentrons/opentrons/issues/1859)) ([3742bb7](https://github.com/Opentrons/opentrons/commit/3742bb7)), closes [#1616](https://github.com/Opentrons/opentrons/issues/1616)


### Features

* **api:** Add advanced settings endpoints to api server ([#1786](https://github.com/Opentrons/opentrons/issues/1786)) ([b89b4ea](https://github.com/Opentrons/opentrons/commit/b89b4ea)), closes [#1656](https://github.com/Opentrons/opentrons/issues/1656)
* **api:** Add GET /modules endpoint with stub for module discovery ([#1858](https://github.com/Opentrons/opentrons/issues/1858)) ([8dedb68](https://github.com/Opentrons/opentrons/commit/8dedb68))
* **api:** Add Magdeck driver ([#1840](https://github.com/Opentrons/opentrons/issues/1840)) ([e731c78](https://github.com/Opentrons/opentrons/commit/e731c78)), closes [#1809](https://github.com/Opentrons/opentrons/issues/1809)
* **app:** Add advanced settings card to robot settings page ([#1762](https://github.com/Opentrons/opentrons/issues/1762)) ([b70f9b8](https://github.com/Opentrons/opentrons/commit/b70f9b8)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Add attached modules card UI to instrument settings page ([#1854](https://github.com/Opentrons/opentrons/issues/1854)) ([3a57807](https://github.com/Opentrons/opentrons/commit/3a57807)), closes [#1735](https://github.com/Opentrons/opentrons/issues/1735)
* **app:** Add GET /modules to API client ([#1837](https://github.com/Opentrons/opentrons/issues/1837)) ([da88936](https://github.com/Opentrons/opentrons/commit/da88936))
* **app:** Add keyboard shortcuts to jog controls ([#1761](https://github.com/Opentrons/opentrons/issues/1761)) ([7c51e98](https://github.com/Opentrons/opentrons/commit/7c51e98)), closes [#1476](https://github.com/Opentrons/opentrons/issues/1476)
* **app:** Add modules and pipettes settings page ([#1785](https://github.com/Opentrons/opentrons/issues/1785)) ([7ce12b3](https://github.com/Opentrons/opentrons/commit/7ce12b3))
* **app:** Add robot settings toggles to Advanced Settings card ([#1795](https://github.com/Opentrons/opentrons/issues/1795)) ([73f7528](https://github.com/Opentrons/opentrons/commit/73f7528)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Log tracebacks from failed RPC calls  ([#1846](https://github.com/Opentrons/opentrons/issues/1846)) ([0c07c52](https://github.com/Opentrons/opentrons/commit/0c07c52)), closes [#1841](https://github.com/Opentrons/opentrons/issues/1841)
* **components:** use labware defs from shared-data for Deck component ([26493f4](https://github.com/Opentrons/opentrons/commit/26493f4))
* **protocol-designer:** add diagrams & copy to new file modal ([#1766](https://github.com/Opentrons/opentrons/issues/1766)) ([6ad44b6](https://github.com/Opentrons/opentrons/commit/6ad44b6)), closes [#1695](https://github.com/Opentrons/opentrons/issues/1695)
* **protocol-designer:** add form level validation errors and warnings ([#1823](https://github.com/Opentrons/opentrons/issues/1823)) ([9cdd66f](https://github.com/Opentrons/opentrons/commit/9cdd66f)), closes [#1090](https://github.com/Opentrons/opentrons/issues/1090) [#1595](https://github.com/Opentrons/opentrons/issues/1595) [#1592](https://github.com/Opentrons/opentrons/issues/1592) [#1594](https://github.com/Opentrons/opentrons/issues/1594)
* **protocol-designer:** allow file upload ([11f582b](https://github.com/Opentrons/opentrons/commit/11f582b))
* **protocol-designer:** change copy for deck setup clarity ([#1839](https://github.com/Opentrons/opentrons/issues/1839)) ([a713ed0](https://github.com/Opentrons/opentrons/commit/a713ed0)), closes [#1811](https://github.com/Opentrons/opentrons/issues/1811)
* **protocol-designer:** change edit labware nickname icon to pen ([#1842](https://github.com/Opentrons/opentrons/issues/1842)) ([512f62c](https://github.com/Opentrons/opentrons/commit/512f62c)), closes [#1660](https://github.com/Opentrons/opentrons/issues/1660)
* **protocol-designer:** clear everything when new protocol is created ([#1852](https://github.com/Opentrons/opentrons/issues/1852)) ([eab21a3](https://github.com/Opentrons/opentrons/commit/eab21a3)), closes [#970](https://github.com/Opentrons/opentrons/issues/970)
* **protocol-designer:** implement full protocol file loading ([#1804](https://github.com/Opentrons/opentrons/issues/1804)) ([bf57e9a](https://github.com/Opentrons/opentrons/commit/bf57e9a)), closes [#1604](https://github.com/Opentrons/opentrons/issues/1604)
* **protocol-designer:** make timeline warnings dismissable ([#1791](https://github.com/Opentrons/opentrons/issues/1791)) ([f9b1dee](https://github.com/Opentrons/opentrons/commit/f9b1dee))
* **protocol-designer:** move Delete button from MoreOptionsModal to StepEditForm ([#1770](https://github.com/Opentrons/opentrons/issues/1770)) ([3df8444](https://github.com/Opentrons/opentrons/commit/3df8444)), closes [#1555](https://github.com/Opentrons/opentrons/issues/1555)
* **protocol-designer:** pipette tiprack assignment ([e0555af](https://github.com/Opentrons/opentrons/commit/e0555af)), closes [#1750](https://github.com/Opentrons/opentrons/issues/1750)
* **protocol-designer:** remove numbers from step names ([#1838](https://github.com/Opentrons/opentrons/issues/1838)) ([2277e15](https://github.com/Opentrons/opentrons/commit/2277e15)), closes [#1820](https://github.com/Opentrons/opentrons/issues/1820)
* **protocol-designer:** save all PD-required protocol data to file ([#1796](https://github.com/Opentrons/opentrons/issues/1796)) ([9403898](https://github.com/Opentrons/opentrons/commit/9403898)), closes [#1789](https://github.com/Opentrons/opentrons/issues/1789)
* **protocol-designer:** show file upload errors in modal ([#1829](https://github.com/Opentrons/opentrons/issues/1829)) ([5ffed81](https://github.com/Opentrons/opentrons/commit/5ffed81)), closes [#1610](https://github.com/Opentrons/opentrons/issues/1610)
* **protocol-designer:** support distribute with volume over pipette max ([#1827](https://github.com/Opentrons/opentrons/issues/1827)) ([9b1a3df](https://github.com/Opentrons/opentrons/commit/9b1a3df)), closes [#1763](https://github.com/Opentrons/opentrons/issues/1763)
* **protocol-designer:** user can collapse selected StepItem ([ed02098](https://github.com/Opentrons/opentrons/commit/ed02098)), closes [#1681](https://github.com/Opentrons/opentrons/issues/1681)
* **shared-data:** annotate labware with format and other metadata ([9d4082d](https://github.com/Opentrons/opentrons/commit/9d4082d))
* **update-server:** Add basic update server ([#1701](https://github.com/Opentrons/opentrons/issues/1701)) ([02d92c7](https://github.com/Opentrons/opentrons/commit/02d92c7))
* **update-server:** Add endpoint to update API Server, ot2serverlib, and Smoothie FW ([#1797](https://github.com/Opentrons/opentrons/issues/1797)) ([464ed7f](https://github.com/Opentrons/opentrons/commit/464ed7f)), closes [#1549](https://github.com/Opentrons/opentrons/issues/1549)
* **update-server:** Add restart endpoint to Update Server and shorten restart sleep to 1s ([#1793](https://github.com/Opentrons/opentrons/issues/1793)) ([1bf8bd7](https://github.com/Opentrons/opentrons/commit/1bf8bd7)), closes [#1794](https://github.com/Opentrons/opentrons/issues/1794)


### Performance Improvements

* **api:** Slightly increase probing speed, avoid resonance and pipette shaking ([#1801](https://github.com/Opentrons/opentrons/issues/1801)) ([8f28ad4](https://github.com/Opentrons/opentrons/commit/8f28ad4))





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
