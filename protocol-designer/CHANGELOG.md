# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="3.6.1"></a>
## [3.6.1](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.1) (2018-12-05)


### Bug Fixes

* **protocol-designer:** fix missing disposal volume in new distribute forms ([#2733](https://github.com/Opentrons/opentrons/issues/2733)) ([5657164](https://github.com/Opentrons/opentrons/commit/5657164)), closes [#2705](https://github.com/Opentrons/opentrons/issues/2705)


### Features

* **protocol-designer:** allow user to re-enable dismissed hints ([#2726](https://github.com/Opentrons/opentrons/issues/2726)) ([af52d1e](https://github.com/Opentrons/opentrons/commit/af52d1e)), closes [#2652](https://github.com/Opentrons/opentrons/issues/2652)
* **protocol-designer:** drag and drop step reordering ([#2714](https://github.com/Opentrons/opentrons/issues/2714)) ([13d6fe3](https://github.com/Opentrons/opentrons/commit/13d6fe3)), closes [#2654](https://github.com/Opentrons/opentrons/issues/2654)
* **protocol-designer:** highlight tips per substep ([#2716](https://github.com/Opentrons/opentrons/issues/2716)) ([eb2c2ce](https://github.com/Opentrons/opentrons/commit/eb2c2ce)), closes [#2537](https://github.com/Opentrons/opentrons/issues/2537)
* **protocol-designer:** new protocol modal defaults and visual updates ([#2739](https://github.com/Opentrons/opentrons/issues/2739)) ([333ad5a](https://github.com/Opentrons/opentrons/commit/333ad5a)), closes [#2721](https://github.com/Opentrons/opentrons/issues/2721)
* **protocol-designer:** place tipracks on protocol creation ([#2750](https://github.com/Opentrons/opentrons/issues/2750)) ([a110a8d](https://github.com/Opentrons/opentrons/commit/a110a8d)), closes [#1327](https://github.com/Opentrons/opentrons/issues/1327)
* **protocol-designer:** remove delay from advanced settings of all step types ([#2731](https://github.com/Opentrons/opentrons/issues/2731)) ([b26abdd](https://github.com/Opentrons/opentrons/commit/b26abdd)), closes [#2579](https://github.com/Opentrons/opentrons/issues/2579)
* **protocol-designer:** remove option of tiprack-1000ul-chem from pd ([#2745](https://github.com/Opentrons/opentrons/issues/2745)) ([3d5f276](https://github.com/Opentrons/opentrons/commit/3d5f276))





<a name="3.6.0"></a>
# [3.6.0](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.1...v3.6.0) (2018-11-29)


### Features

* **protocol-designer:** add tooltip to advanced settings icon ([#2727](https://github.com/Opentrons/opentrons/issues/2727)) ([0deb6b7](https://github.com/Opentrons/opentrons/commit/0deb6b7)), closes [#2706](https://github.com/Opentrons/opentrons/issues/2706)
* **protocol-designer:** make multichannel substeps collapsed by default ([#2729](https://github.com/Opentrons/opentrons/issues/2729)) ([b419a72](https://github.com/Opentrons/opentrons/commit/b419a72)), closes [#2678](https://github.com/Opentrons/opentrons/issues/2678)
* **protocol-designer:** remove label from 200ul/300ul tiprack image ([#2722](https://github.com/Opentrons/opentrons/issues/2722)) ([fe5cf6a](https://github.com/Opentrons/opentrons/commit/fe5cf6a)), closes [#2704](https://github.com/Opentrons/opentrons/issues/2704)





<a name="3.6.0-beta.1"></a>
# [3.6.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.0...v3.6.0-beta.1) (2018-11-27)


### Bug Fixes

* **protocol-designer:** de-hydrate disposal and blowout labware in st… ([#2669](https://github.com/Opentrons/opentrons/issues/2669)) ([b6246b2](https://github.com/Opentrons/opentrons/commit/b6246b2))
* **protocol-designer:** well selection modal refresh on step change ([#2671](https://github.com/Opentrons/opentrons/issues/2671)) ([941916f](https://github.com/Opentrons/opentrons/commit/941916f))


### Features

* **api:** Add 1.5ml tuberack to old labware definition section ([#2679](https://github.com/Opentrons/opentrons/issues/2679)) ([2739038](https://github.com/Opentrons/opentrons/commit/2739038))
* **protocol-designer:** allow user to set touch-tip offset ([#2691](https://github.com/Opentrons/opentrons/issues/2691)) ([d5b7d8a](https://github.com/Opentrons/opentrons/commit/d5b7d8a)), closes [#2540](https://github.com/Opentrons/opentrons/issues/2540)
* **protocol-designer:** disambiguate left/right pipette names when they match ([#2698](https://github.com/Opentrons/opentrons/issues/2698)) ([2f43a0e](https://github.com/Opentrons/opentrons/commit/2f43a0e)), closes [#2078](https://github.com/Opentrons/opentrons/issues/2078)
* **protocol-designer:** disconnect well selection modal from hovered step state ([#2662](https://github.com/Opentrons/opentrons/issues/2662)) ([973a8a5](https://github.com/Opentrons/opentrons/commit/973a8a5)), closes [#2558](https://github.com/Opentrons/opentrons/issues/2558)
* **protocol-designer:** liquid placement modal performance boost ([#2661](https://github.com/Opentrons/opentrons/issues/2661)) ([ecc8569](https://github.com/Opentrons/opentrons/commit/ecc8569)), closes [#2557](https://github.com/Opentrons/opentrons/issues/2557)
* **protocol-designer:** make settings tab always active ([#2700](https://github.com/Opentrons/opentrons/issues/2700)) ([036e2ee](https://github.com/Opentrons/opentrons/commit/036e2ee)), closes [#2697](https://github.com/Opentrons/opentrons/issues/2697)
* **protocol-designer:** use tip max vol, not pipette max vol ([#2656](https://github.com/Opentrons/opentrons/issues/2656)) ([418665d](https://github.com/Opentrons/opentrons/commit/418665d)), closes [#2160](https://github.com/Opentrons/opentrons/issues/2160)





<a name="3.6.0-beta.0"></a>
# [3.6.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.5.1...v3.6.0-beta.0) (2018-11-13)


### Bug Fixes

* **protocol-designer:** add vertical spacing back to form fields ([#2644](https://github.com/Opentrons/opentrons/issues/2644)) ([c7173da](https://github.com/Opentrons/opentrons/commit/c7173da)), closes [#2580](https://github.com/Opentrons/opentrons/issues/2580) [#2597](https://github.com/Opentrons/opentrons/issues/2597)
* **protocol-designer:** fix sidebar for liquid placement modal ([#2649](https://github.com/Opentrons/opentrons/issues/2649)) ([8da2f7d](https://github.com/Opentrons/opentrons/commit/8da2f7d))


### Features

* **api:** support offset in json protocol touch-tip command ([#2566](https://github.com/Opentrons/opentrons/issues/2566)) ([d54ee84](https://github.com/Opentrons/opentrons/commit/d54ee84))
* **protocol-designer:** add labware details card ([#2490](https://github.com/Opentrons/opentrons/issues/2490)) ([fb96472](https://github.com/Opentrons/opentrons/commit/fb96472)), closes [#2428](https://github.com/Opentrons/opentrons/issues/2428)
* **protocol-designer:** add more labware options to PD ([#2634](https://github.com/Opentrons/opentrons/issues/2634)) ([7db10ce](https://github.com/Opentrons/opentrons/commit/7db10ce)), closes [#2583](https://github.com/Opentrons/opentrons/issues/2583)
* **protocol-designer:** add well tooltip to liquid placement modal ([#2550](https://github.com/Opentrons/opentrons/issues/2550)) ([7c13891](https://github.com/Opentrons/opentrons/commit/7c13891)), closes [#2486](https://github.com/Opentrons/opentrons/issues/2486)
* **protocol-designer:** allow user to change pipette selection ([#2548](https://github.com/Opentrons/opentrons/issues/2548)) ([bb08aa4](https://github.com/Opentrons/opentrons/commit/bb08aa4)), closes [#2474](https://github.com/Opentrons/opentrons/issues/2474) [#2475](https://github.com/Opentrons/opentrons/issues/2475) [#2477](https://github.com/Opentrons/opentrons/issues/2477) [#2632](https://github.com/Opentrons/opentrons/issues/2632)
* **protocol-designer:** clean up navigation and modal hierarchy ([#2638](https://github.com/Opentrons/opentrons/issues/2638)) ([134558f](https://github.com/Opentrons/opentrons/commit/134558f)), closes [#2198](https://github.com/Opentrons/opentrons/issues/2198)
* **protocol-designer:** collapse all step items on newly loaded file ([#2549](https://github.com/Opentrons/opentrons/issues/2549)) ([46066a2](https://github.com/Opentrons/opentrons/commit/46066a2)), closes [#2541](https://github.com/Opentrons/opentrons/issues/2541)
* **protocol-designer:** edit saved step forms when labware is deleted ([#2653](https://github.com/Opentrons/opentrons/issues/2653)) ([78b99c3](https://github.com/Opentrons/opentrons/commit/78b99c3)), closes [#2361](https://github.com/Opentrons/opentrons/issues/2361)
* **shared-data:** Add generator function for irregular labware ([#2610](https://github.com/Opentrons/opentrons/issues/2610)) ([ad568c1](https://github.com/Opentrons/opentrons/commit/ad568c1)), closes [#2275](https://github.com/Opentrons/opentrons/issues/2275)
* **shared-data:** support unversioned pipettes in JSON protocols ([#2605](https://github.com/Opentrons/opentrons/issues/2605)) ([9e84ff6](https://github.com/Opentrons/opentrons/commit/9e84ff6))





<a name="3.5.1"></a>
# [3.5.1](https://github.com/Opentrons/opentrons/compare/v3.5.0...v3.5.1) (2018-10-26)


### Features

* **protocol-designer:** add 4-in-1 15-50 tuberack to PD ([#2530](https://github.com/Opentrons/opentrons/issues/2530)) ([48cc9c0](https://github.com/Opentrons/opentrons/commit/48cc9c0)), closes [#2453](https://github.com/Opentrons/opentrons/issues/2453)




<a name="3.5.0"></a>
# [3.5.0](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.1...v3.5.0) (2018-10-25)


### Bug Fixes

* **protocol-designer:** close liquid placement form when clear wells is clicked ([#2533](https://github.com/Opentrons/opentrons/issues/2533)) ([e0727e6](https://github.com/Opentrons/opentrons/commit/e0727e6)), closes [#2528](https://github.com/Opentrons/opentrons/issues/2528)
* **protocol-designer:** do not add __air__ on blowout ([#2545](https://github.com/Opentrons/opentrons/issues/2545)) ([b35cfa9](https://github.com/Opentrons/opentrons/commit/b35cfa9)), closes [#2498](https://github.com/Opentrons/opentrons/issues/2498)
* **protocol-designer:** fix LiquidPlacementForm onBlur typo ([#2546](https://github.com/Opentrons/opentrons/issues/2546)) ([c6a9f38](https://github.com/Opentrons/opentrons/commit/c6a9f38))
* **protocol-designer:** fix localization refactor mistakes ([#2499](https://github.com/Opentrons/opentrons/issues/2499)) ([4ef34f2](https://github.com/Opentrons/opentrons/commit/4ef34f2))


### Features

* **protocol-designer:** add tooltip for labware name/type on steplist ([#2497](https://github.com/Opentrons/opentrons/issues/2497)) ([4890374](https://github.com/Opentrons/opentrons/commit/4890374)), closes [#2421](https://github.com/Opentrons/opentrons/issues/2421)
* **protocol-designer:** allow user to delete entire liquid groups ([#2524](https://github.com/Opentrons/opentrons/issues/2524)) ([dce806b](https://github.com/Opentrons/opentrons/commit/dce806b)), closes [#2437](https://github.com/Opentrons/opentrons/issues/2437)
* **protocol-designer:** continue to liquids not design page ([#2539](https://github.com/Opentrons/opentrons/issues/2539)) ([49da7b1](https://github.com/Opentrons/opentrons/commit/49da7b1)), closes [#2534](https://github.com/Opentrons/opentrons/issues/2534)
* **protocol-designer:** implement "clear wells" button ([#2528](https://github.com/Opentrons/opentrons/issues/2528)) ([145977f](https://github.com/Opentrons/opentrons/commit/145977f)), closes [#2430](https://github.com/Opentrons/opentrons/issues/2430)
* **protocol-designer:** liquid tooltips on well selection, popper and portal ([#2521](https://github.com/Opentrons/opentrons/issues/2521)) ([12d8adb](https://github.com/Opentrons/opentrons/commit/12d8adb)), closes [#2487](https://github.com/Opentrons/opentrons/issues/2487)
* **protocol-designer:** replace liquid placement form ([#2518](https://github.com/Opentrons/opentrons/issues/2518)) ([3a6b06f](https://github.com/Opentrons/opentrons/commit/3a6b06f)), closes [#2429](https://github.com/Opentrons/opentrons/issues/2429)
* **protocol-designer:** use formik for liquid edit form ([#2512](https://github.com/Opentrons/opentrons/issues/2512)) ([3e7456f](https://github.com/Opentrons/opentrons/commit/3e7456f)), closes [#2460](https://github.com/Opentrons/opentrons/issues/2460)





<a name="3.5.0-beta.1"></a>
# [3.5.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.0...v3.5.0-beta.1) (2018-10-16)


### Bug Fixes

* **protocol-designer:** unhighlight wells on deselect in well selection modal ([#2491](https://github.com/Opentrons/opentrons/issues/2491)) ([5dfbf25](https://github.com/Opentrons/opentrons/commit/5dfbf25)), closes [#2463](https://github.com/Opentrons/opentrons/issues/2463)


### Features

* **protocol-designer:** add tooltips on hover of final result wells ([#2479](https://github.com/Opentrons/opentrons/issues/2479)) ([73d2bf3](https://github.com/Opentrons/opentrons/commit/73d2bf3)), closes [#2409](https://github.com/Opentrons/opentrons/issues/2409)
* **protocol-designer:** create view to browse final liquid state ([#2451](https://github.com/Opentrons/opentrons/issues/2451)) ([5a436c3](https://github.com/Opentrons/opentrons/commit/5a436c3)), closes [#2335](https://github.com/Opentrons/opentrons/issues/2335)
* **protocol-designer:** implement liquids page interactivity ([#2478](https://github.com/Opentrons/opentrons/issues/2478)) ([7e85673](https://github.com/Opentrons/opentrons/commit/7e85673)), closes [#2427](https://github.com/Opentrons/opentrons/issues/2427)
* **protocol-designer:** implement rounding properly ([#2458](https://github.com/Opentrons/opentrons/issues/2458)) ([6ef6bf0](https://github.com/Opentrons/opentrons/commit/6ef6bf0)), closes [#2405](https://github.com/Opentrons/opentrons/issues/2405)





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Bug Fixes

* **protocol-designer:** fix tiprack diagram only displaying right ([#2340](https://github.com/Opentrons/opentrons/issues/2340)) ([3d4d57b](https://github.com/Opentrons/opentrons/commit/3d4d57b))
* **protocol-designer:** tweak analytics copy for accuracy ([#2366](https://github.com/Opentrons/opentrons/issues/2366)) ([b3f4b45](https://github.com/Opentrons/opentrons/commit/b3f4b45))


### Features

* **components:** create new tab-styled vertical nav bar ([#2371](https://github.com/Opentrons/opentrons/issues/2371)) ([0202b53](https://github.com/Opentrons/opentrons/commit/0202b53)), closes [#1923](https://github.com/Opentrons/opentrons/issues/1923)
* **protocol-designer:** add "app build date" field to PD saved files ([#2350](https://github.com/Opentrons/opentrons/issues/2350)) ([d2bf281](https://github.com/Opentrons/opentrons/commit/d2bf281))
* **protocol-designer:** add liquids tab and sidebar ([#2454](https://github.com/Opentrons/opentrons/issues/2454)) ([0aedda6](https://github.com/Opentrons/opentrons/commit/0aedda6)), closes [#2426](https://github.com/Opentrons/opentrons/issues/2426)
* **protocol-designer:** implement "metadata.created" in JSON file ([#2403](https://github.com/Opentrons/opentrons/issues/2403)) ([a9c3d07](https://github.com/Opentrons/opentrons/commit/a9c3d07)), closes [#2189](https://github.com/Opentrons/opentrons/issues/2189)
* **protocol-designer:** implement selective redux persistence ([#2436](https://github.com/Opentrons/opentrons/issues/2436)) ([6591104](https://github.com/Opentrons/opentrons/commit/6591104))
* **protocol-designer:** modify the "name new labware" overlay for new design ([#2422](https://github.com/Opentrons/opentrons/issues/2422)) ([4934c47](https://github.com/Opentrons/opentrons/commit/4934c47)), closes [#2410](https://github.com/Opentrons/opentrons/issues/2410)
* **protocol-designer:** refactor and performance audit of labware components ([#2442](https://github.com/Opentrons/opentrons/issues/2442)) ([09f4eb3](https://github.com/Opentrons/opentrons/commit/09f4eb3)), closes [#2285](https://github.com/Opentrons/opentrons/issues/2285)
* **protocol-designer:** show hints as modal ([#2447](https://github.com/Opentrons/opentrons/issues/2447)) ([9a3509f](https://github.com/Opentrons/opentrons/commit/9a3509f))
* **shared-data:** Add generator function to create regular labware defs ([#2380](https://github.com/Opentrons/opentrons/issues/2380)) ([bc81574](https://github.com/Opentrons/opentrons/commit/bc81574))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)


### Bug Fixes

* **protocol-designer:** close tooltips and step creation button ([#2326](https://github.com/Opentrons/opentrons/issues/2326)) ([f99445b](https://github.com/Opentrons/opentrons/commit/f99445b))
* **protocol-designer:** correct alignment of form fields ([#2281](https://github.com/Opentrons/opentrons/issues/2281)) ([419c55a](https://github.com/Opentrons/opentrons/commit/419c55a)), closes [#2196](https://github.com/Opentrons/opentrons/issues/2196)
* **protocol-designer:** fix recurring deleted labware bug ([#2299](https://github.com/Opentrons/opentrons/issues/2299)) ([ebb44e1](https://github.com/Opentrons/opentrons/commit/ebb44e1))
* **protocol-designer:** fix whitescreen on deleting blowout labware ([#2341](https://github.com/Opentrons/opentrons/issues/2341)) ([44196c6](https://github.com/Opentrons/opentrons/commit/44196c6))


### Features

* **components:** make titlebar stick to top on scroll ([#2321](https://github.com/Opentrons/opentrons/issues/2321)) ([e9b58d8](https://github.com/Opentrons/opentrons/commit/e9b58d8)), closes [#2195](https://github.com/Opentrons/opentrons/issues/2195)
* **protocol-designer:** add dynamic tooltip arrow ([#2319](https://github.com/Opentrons/opentrons/issues/2319)) ([44eb1fb](https://github.com/Opentrons/opentrons/commit/44eb1fb)), closes [#2026](https://github.com/Opentrons/opentrons/issues/2026)
* **protocol-designer:** allow user to specify disposal volume dest ([#2295](https://github.com/Opentrons/opentrons/issues/2295)) ([92ba845](https://github.com/Opentrons/opentrons/commit/92ba845)), closes [#1676](https://github.com/Opentrons/opentrons/issues/1676)
* **protocol-designer:** autoselect default pipette for new forms ([#2320](https://github.com/Opentrons/opentrons/issues/2320)) ([c5efd3c](https://github.com/Opentrons/opentrons/commit/c5efd3c)), closes [#1296](https://github.com/Opentrons/opentrons/issues/1296)
* **protocol-designer:** modify well selection instructional text ([#2263](https://github.com/Opentrons/opentrons/issues/2263)) ([9ec91a4](https://github.com/Opentrons/opentrons/commit/9ec91a4)), closes [#2204](https://github.com/Opentrons/opentrons/issues/2204)





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Bug Fixes

* **protocol-designer:** correctly null out blowout if unchecked in form ([#2226](https://github.com/Opentrons/opentrons/issues/2226)) ([6179b18](https://github.com/Opentrons/opentrons/commit/6179b18))


### Features

* **app:** Parse JSON protocols into state ([#2231](https://github.com/Opentrons/opentrons/issues/2231)) ([b5f3666](https://github.com/Opentrons/opentrons/commit/b5f3666))
* **protocol-designer:** add ux analytics with opt in settings and modal ([#2177](https://github.com/Opentrons/opentrons/issues/2177)) ([4a8ebbe](https://github.com/Opentrons/opentrons/commit/4a8ebbe)), closes [#2119](https://github.com/Opentrons/opentrons/issues/2119) [#2172](https://github.com/Opentrons/opentrons/issues/2172)
* **protocol-designer:** allow tenths of µl pipette volumes ([#2222](https://github.com/Opentrons/opentrons/issues/2222)) ([827f3ee](https://github.com/Opentrons/opentrons/commit/827f3ee)), closes [#2120](https://github.com/Opentrons/opentrons/issues/2120)
* **protocol-designer:** auto dismiss no liquid hint ([#2220](https://github.com/Opentrons/opentrons/issues/2220)) ([d2982e1](https://github.com/Opentrons/opentrons/commit/d2982e1))
* **protocol-designer:** replace 200µl tiprack with 300µl tiprack ([#2223](https://github.com/Opentrons/opentrons/issues/2223)) ([8a8fc0f](https://github.com/Opentrons/opentrons/commit/8a8fc0f)), closes [#1955](https://github.com/Opentrons/opentrons/issues/1955)
* **protocol-designer:** warn changes will be lost on import/create ([#2168](https://github.com/Opentrons/opentrons/issues/2168)) ([0a5a071](https://github.com/Opentrons/opentrons/commit/0a5a071))





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)


### Bug Fixes

* **protocol-designer:** change copy for excessive aspirate warning ([#2214](https://github.com/Opentrons/opentrons/issues/2214)) ([de1b714](https://github.com/Opentrons/opentrons/commit/de1b714)), closes [#2213](https://github.com/Opentrons/opentrons/issues/2213)


### Features

* **api:** support flow rate (uL/sec) in JSON protocols ([#2123](https://github.com/Opentrons/opentrons/issues/2123)) ([b0f944e](https://github.com/Opentrons/opentrons/commit/b0f944e))
* **protocol-designer:** add tooltips for advanced settings ([#2170](https://github.com/Opentrons/opentrons/issues/2170)) ([af09a4b](https://github.com/Opentrons/opentrons/commit/af09a4b)), closes [#1981](https://github.com/Opentrons/opentrons/issues/1981)
* **protocol-designer:** add tooltips for step creation button ([#2163](https://github.com/Opentrons/opentrons/issues/2163)) ([e34e636](https://github.com/Opentrons/opentrons/commit/e34e636)), closes [#1979](https://github.com/Opentrons/opentrons/issues/1979)
* **protocol-designer:** default form fields from old protocols ([#2162](https://github.com/Opentrons/opentrons/issues/2162)) ([54585e6](https://github.com/Opentrons/opentrons/commit/54585e6))
* **protocol-designer:** flow rate field more dependent on pipette ([#2154](https://github.com/Opentrons/opentrons/issues/2154)) ([ac778ea](https://github.com/Opentrons/opentrons/commit/ac778ea))
* **protocol-designer:** implement ui for flow rate ([#2149](https://github.com/Opentrons/opentrons/issues/2149)) ([e0e25c1](https://github.com/Opentrons/opentrons/commit/e0e25c1))
* **protocol-designer:** support mm from bottom offset in JSON protocols ([#2180](https://github.com/Opentrons/opentrons/issues/2180)) ([db22ae8](https://github.com/Opentrons/opentrons/commit/db22ae8)), closes [#2157](https://github.com/Opentrons/opentrons/issues/2157)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Bug Fixes

* **protocol-designer:** fix serialized name in ingred list ([#2002](https://github.com/Opentrons/opentrons/issues/2002)) ([d19d29b](https://github.com/Opentrons/opentrons/commit/d19d29b)), closes [#1294](https://github.com/Opentrons/opentrons/issues/1294)
* **protocol-designer:** tweak timeline alert copy ([#2086](https://github.com/Opentrons/opentrons/issues/2086)) ([5108f21](https://github.com/Opentrons/opentrons/commit/5108f21))


### Features

* **protocol-designer:** add 'drop tip' to 'dispense' section of form ([#1998](https://github.com/Opentrons/opentrons/issues/1998)) ([fa47f85](https://github.com/Opentrons/opentrons/commit/fa47f85)), closes [#1689](https://github.com/Opentrons/opentrons/issues/1689)
* **protocol-designer:** change tip field and timeline alert copy to i18n ([#2062](https://github.com/Opentrons/opentrons/issues/2062)) ([6fd4807](https://github.com/Opentrons/opentrons/commit/6fd4807)), closes [#1934](https://github.com/Opentrons/opentrons/issues/1934)
* **protocol-designer:** display tip use across step timeline ([#2074](https://github.com/Opentrons/opentrons/issues/2074)) ([51da5ae](https://github.com/Opentrons/opentrons/commit/51da5ae)), closes [#1094](https://github.com/Opentrons/opentrons/issues/1094)
* **protocol-designer:** rename change tip options ([#2003](https://github.com/Opentrons/opentrons/issues/2003)) ([e80fd25](https://github.com/Opentrons/opentrons/commit/e80fd25)), closes [#1933](https://github.com/Opentrons/opentrons/issues/1933)





<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)


### Bug Fixes

* **app:** Check if modulesRequired when displaying review modals ([#1940](https://github.com/Opentrons/opentrons/issues/1940)) ([14a54a5](https://github.com/Opentrons/opentrons/commit/14a54a5))
* **protocol-designer:** fix bug where tips not dropped at end of protocol ([#1911](https://github.com/Opentrons/opentrons/issues/1911)) ([945ff6a](https://github.com/Opentrons/opentrons/commit/945ff6a)), closes [#969](https://github.com/Opentrons/opentrons/issues/969)
* **protocol-designer:** fix destination well pills in substeps ([#1896](https://github.com/Opentrons/opentrons/issues/1896)) ([60481b5](https://github.com/Opentrons/opentrons/commit/60481b5)), closes [#1812](https://github.com/Opentrons/opentrons/issues/1812)
* **protocol-designer:** fix file load bug w mismatched pipette ids ([#1918](https://github.com/Opentrons/opentrons/issues/1918)) ([9ec52d1](https://github.com/Opentrons/opentrons/commit/9ec52d1))
* **protocol-designer:** fix styling of pause and mix step items ([#1948](https://github.com/Opentrons/opentrons/issues/1948)) ([16c2a30](https://github.com/Opentrons/opentrons/commit/16c2a30)), closes [#1947](https://github.com/Opentrons/opentrons/issues/1947)
* **protocol-designer:** fix substeps for consolidate using inner mix ([#1921](https://github.com/Opentrons/opentrons/issues/1921)) ([e59cc7e](https://github.com/Opentrons/opentrons/commit/e59cc7e)), closes [#1919](https://github.com/Opentrons/opentrons/issues/1919)
* **protocol-designer:** make well selection modal show pipette display name ([#1907](https://github.com/Opentrons/opentrons/issues/1907)) ([07ad9ff](https://github.com/Opentrons/opentrons/commit/07ad9ff)), closes [#1888](https://github.com/Opentrons/opentrons/issues/1888)
* **protocol-designer:** Only show deck setup prompt text when selected ([#1894](https://github.com/Opentrons/opentrons/issues/1894)) ([32656ef](https://github.com/Opentrons/opentrons/commit/32656ef))


### Features

* **components:** implement hover tooltip and include react popper ([#1855](https://github.com/Opentrons/opentrons/issues/1855)) ([c44e0eb](https://github.com/Opentrons/opentrons/commit/c44e0eb)), closes [#921](https://github.com/Opentrons/opentrons/issues/921)
* **protocol-designer:** add continue to design button to file data page ([#1876](https://github.com/Opentrons/opentrons/issues/1876)) ([cd8ea5e](https://github.com/Opentrons/opentrons/commit/cd8ea5e)), closes [#1782](https://github.com/Opentrons/opentrons/issues/1782)
* **protocol-designer:** add help link to PD nav ([#1945](https://github.com/Opentrons/opentrons/issues/1945)) ([1525cf5](https://github.com/Opentrons/opentrons/commit/1525cf5)), closes [#1941](https://github.com/Opentrons/opentrons/issues/1941)
* **protocol-designer:** add max volume to ingred selection modal volume field ([#1993](https://github.com/Opentrons/opentrons/issues/1993)) ([807c289](https://github.com/Opentrons/opentrons/commit/807c289)), closes [#1835](https://github.com/Opentrons/opentrons/issues/1835)
* **protocol-designer:** alert user of unsaved changes to protocol ([#1856](https://github.com/Opentrons/opentrons/issues/1856)) ([e195363](https://github.com/Opentrons/opentrons/commit/e195363)), closes [#1602](https://github.com/Opentrons/opentrons/issues/1602)
* **protocol-designer:** auto fill well volume field if inferrable ([#1870](https://github.com/Opentrons/opentrons/issues/1870)) ([ab5a40e](https://github.com/Opentrons/opentrons/commit/ab5a40e)), closes [#1668](https://github.com/Opentrons/opentrons/issues/1668)
* **protocol-designer:** change copy for pipette missing tip error ([#1915](https://github.com/Opentrons/opentrons/issues/1915)) ([cd8b920](https://github.com/Opentrons/opentrons/commit/cd8b920)), closes [#1815](https://github.com/Opentrons/opentrons/issues/1815) [#1880](https://github.com/Opentrons/opentrons/issues/1880) [#1815](https://github.com/Opentrons/opentrons/issues/1815)
* **protocol-designer:** change copy ingredients -> liquid ([#1905](https://github.com/Opentrons/opentrons/issues/1905)) ([9f9b989](https://github.com/Opentrons/opentrons/commit/9f9b989)), closes [#1864](https://github.com/Opentrons/opentrons/issues/1864)
* **protocol-designer:** deactivate non-beta step settings, add tooltip ([#1875](https://github.com/Opentrons/opentrons/issues/1875)) ([267b5b3](https://github.com/Opentrons/opentrons/commit/267b5b3)), closes [#1873](https://github.com/Opentrons/opentrons/issues/1873)
* **protocol-designer:** enable user to swap pipette mounts ([#1883](https://github.com/Opentrons/opentrons/issues/1883)) ([d5e40cd](https://github.com/Opentrons/opentrons/commit/d5e40cd)), closes [#1536](https://github.com/Opentrons/opentrons/issues/1536)
* **protocol-designer:** implement move labware in place of copy ([#1938](https://github.com/Opentrons/opentrons/issues/1938)) ([c51ce66](https://github.com/Opentrons/opentrons/commit/c51ce66)), closes [#1908](https://github.com/Opentrons/opentrons/issues/1908)
* **protocol-designer:** make form warnings & errors match TimelineAlerts ([#1924](https://github.com/Opentrons/opentrons/issues/1924)) ([c355be8](https://github.com/Opentrons/opentrons/commit/c355be8)), closes [#1882](https://github.com/Opentrons/opentrons/issues/1882)
* **protocol-designer:** make pipettes eagerly drop tips ([#1946](https://github.com/Opentrons/opentrons/issues/1946)) ([9fb0725](https://github.com/Opentrons/opentrons/commit/9fb0725)), closes [#1706](https://github.com/Opentrons/opentrons/issues/1706)
* **protocol-designer:** make WellSelectionInput label change for multi-channel pipette ([#1927](https://github.com/Opentrons/opentrons/issues/1927)) ([7df3c29](https://github.com/Opentrons/opentrons/commit/7df3c29)), closes [#1537](https://github.com/Opentrons/opentrons/issues/1537)
* **protocol-designer:** re-order and restyle file sidebar buttons ([#1926](https://github.com/Opentrons/opentrons/issues/1926)) ([4ae1f5b](https://github.com/Opentrons/opentrons/commit/4ae1f5b)), closes [#1784](https://github.com/Opentrons/opentrons/issues/1784)
* **protocol-designer:** refactor and restyle LabwareSelectionModal ([#1929](https://github.com/Opentrons/opentrons/issues/1929)) ([7c9891e](https://github.com/Opentrons/opentrons/commit/7c9891e))
* **protocol-designer:** refactor and restyle timeline terminal items ([#1967](https://github.com/Opentrons/opentrons/issues/1967)) ([a2421fd](https://github.com/Opentrons/opentrons/commit/a2421fd)), closes [#1706](https://github.com/Opentrons/opentrons/issues/1706) [#1930](https://github.com/Opentrons/opentrons/issues/1930) [#1974](https://github.com/Opentrons/opentrons/issues/1974)
* **protocol-designer:** remove disposal volume field from all but distribute ([#1868](https://github.com/Opentrons/opentrons/issues/1868)) ([7d98355](https://github.com/Opentrons/opentrons/commit/7d98355)), closes [#1867](https://github.com/Opentrons/opentrons/issues/1867)
* **protocol-designer:** restyle labware hover buttons ([#1916](https://github.com/Opentrons/opentrons/issues/1916)) ([799d1b1](https://github.com/Opentrons/opentrons/commit/799d1b1)), closes [#1519](https://github.com/Opentrons/opentrons/issues/1519)
* **protocol-designer:** save version in PD file with git-describe ([#1987](https://github.com/Opentrons/opentrons/issues/1987)) ([7040727](https://github.com/Opentrons/opentrons/commit/7040727))
* **protocol-designer:** show no pipette on mount in file details ([#1917](https://github.com/Opentrons/opentrons/issues/1917)) ([74e077c](https://github.com/Opentrons/opentrons/commit/74e077c)), closes [#1909](https://github.com/Opentrons/opentrons/issues/1909) [#1783](https://github.com/Opentrons/opentrons/issues/1783)
* **protocol-designer:** support tiprack-to-pipette assignment ([#1866](https://github.com/Opentrons/opentrons/issues/1866)) ([6a4f19d](https://github.com/Opentrons/opentrons/commit/6a4f19d)), closes [#1573](https://github.com/Opentrons/opentrons/issues/1573)
* **protocol-designer:** swap pen icons to pencil ([#1906](https://github.com/Opentrons/opentrons/issues/1906)) ([70a9fc0](https://github.com/Opentrons/opentrons/commit/70a9fc0)), closes [#1861](https://github.com/Opentrons/opentrons/issues/1861)
* **protocol-designer:** update copy for 'no tip on pipette' error ([#1994](https://github.com/Opentrons/opentrons/issues/1994)) ([3a64530](https://github.com/Opentrons/opentrons/commit/3a64530)), closes [#1975](https://github.com/Opentrons/opentrons/issues/1975)
* **protocol-designer:** update well selection modal's TitleBar ([#1884](https://github.com/Opentrons/opentrons/issues/1884)) ([8ce9a4c](https://github.com/Opentrons/opentrons/commit/8ce9a4c)), closes [#1502](https://github.com/Opentrons/opentrons/issues/1502)





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Bug Fixes

* **components:** fix Deck component viewBox ([#1807](https://github.com/Opentrons/opentrons/issues/1807)) ([bff921f](https://github.com/Opentrons/opentrons/commit/bff921f))
* **protocol-designer:** allow scroll when NewFileModal too tall ([#1777](https://github.com/Opentrons/opentrons/issues/1777)) ([e6238ab](https://github.com/Opentrons/opentrons/commit/e6238ab)), closes [#1776](https://github.com/Opentrons/opentrons/issues/1776)
* **protocol-designer:** do not navigate on FilePage form submit ([8f98a08](https://github.com/Opentrons/opentrons/commit/8f98a08))
* **protocol-designer:** fix labware copy mirroring ([#1859](https://github.com/Opentrons/opentrons/issues/1859)) ([3742bb7](https://github.com/Opentrons/opentrons/commit/3742bb7)), closes [#1616](https://github.com/Opentrons/opentrons/issues/1616)


### Features

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





<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package protocol-designer





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)


### Features

* **protocol-designer:** allow button to look hovered via .hover class ([#1732](https://github.com/Opentrons/opentrons/issues/1732)) ([04173b7](https://github.com/Opentrons/opentrons/commit/04173b7)), closes [#1690](https://github.com/Opentrons/opentrons/issues/1690)





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)


### Bug Fixes

* **protocol-designer:** set max width of form field rows ([#1723](https://github.com/Opentrons/opentrons/issues/1723)) ([c3a0dc6](https://github.com/Opentrons/opentrons/commit/c3a0dc6)), closes [#1488](https://github.com/Opentrons/opentrons/issues/1488)


### Features

* **protocol-designer:** disallow saving ingred form w/o name & volume ([#1724](https://github.com/Opentrons/opentrons/issues/1724)) ([206d378](https://github.com/Opentrons/opentrons/commit/206d378)), closes [#1609](https://github.com/Opentrons/opentrons/issues/1609) [#1671](https://github.com/Opentrons/opentrons/issues/1671)





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)


### Bug Fixes

* **protocol-designer:** fix styles for SelectionRect ([#1714](https://github.com/Opentrons/opentrons/issues/1714)) ([295940e](https://github.com/Opentrons/opentrons/commit/295940e))


### Features

* **protocol-designer:** clarify editing file details ([d03d42f](https://github.com/Opentrons/opentrons/commit/d03d42f)), closes [#1504](https://github.com/Opentrons/opentrons/issues/1504) [#1661](https://github.com/Opentrons/opentrons/issues/1661)





<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)


### Bug Fixes

* **protocol-designer:** fix bug with multi-channel substeps ([#1663](https://github.com/Opentrons/opentrons/issues/1663)) ([1fca294](https://github.com/Opentrons/opentrons/commit/1fca294))


### Features

* **protocol-designer:** Darken font in labware selection modal ([#1646](https://github.com/Opentrons/opentrons/issues/1646)) ([aacc76c](https://github.com/Opentrons/opentrons/commit/aacc76c)), closes [#1341](https://github.com/Opentrons/opentrons/issues/1341)
* **protocol-designer:** elaborate on deck setup in title bar ([#1637](https://github.com/Opentrons/opentrons/issues/1637)) ([6bda925](https://github.com/Opentrons/opentrons/commit/6bda925)), closes [#1339](https://github.com/Opentrons/opentrons/issues/1339)
* **protocol-designer:** increase selected pipette font-size ([#1629](https://github.com/Opentrons/opentrons/issues/1629)) ([b90e767](https://github.com/Opentrons/opentrons/commit/b90e767)), closes [#1325](https://github.com/Opentrons/opentrons/issues/1325)
* **protocol-designer:** update behavior for well setup ([#1511](https://github.com/Opentrons/opentrons/issues/1511)) ([8c611b5](https://github.com/Opentrons/opentrons/commit/8c611b5))
