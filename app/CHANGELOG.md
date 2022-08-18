# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.1.0-alpha.2](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.1...v6.1.0-alpha.2) (2022-08-10)

**Note:** Version bump only for package @opentrons/app





# [6.1.0-alpha.1](https://github.com/Opentrons/opentrons/compare/v6.1.0-alpha.0...v6.1.0-alpha.1) (2022-08-05)

**Note:** Version bump only for package @opentrons/app





# [6.1.0-alpha.0](https://github.com/Opentrons/opentrons/compare/v6.0.0...v6.1.0-alpha.0) (2022-08-03)


### Bug Fixes

* **app:** add firstNonSetupIndex to historical run commands query cursor ([#11158](https://github.com/Opentrons/opentrons/issues/11158)) ([a8f8619](https://github.com/Opentrons/opentrons/commit/a8f8619dc40bba6c64714d9465b540a2bc21d0fc)), closes [#11135](https://github.com/Opentrons/opentrons/issues/11135)
* **app:** add support for labware on modules in run log ([#11276](https://github.com/Opentrons/opentrons/issues/11276)) ([b370f5d](https://github.com/Opentrons/opentrons/commit/b370f5d85df9d6f203ba43e00fc676bd88872568))
* **app:** Fix text spacing issue on LPC screen ([#11159](https://github.com/Opentrons/opentrons/issues/11159)) ([95a01cd](https://github.com/Opentrons/opentrons/commit/95a01cd2d3372d21a6905901f70408c6d945b194)), closes [#110671](https://github.com/Opentrons/opentrons/issues/110671)
* **app:** fixes extra module bug in module controls ([#11195](https://github.com/Opentrons/opentrons/issues/11195)) ([7582870](https://github.com/Opentrons/opentrons/commit/7582870843d460631788cfed1bf947b57b19c194))
* **app:** labware setup H-S latch command add runId ([#11133](https://github.com/Opentrons/opentrons/issues/11133)) ([75cc2f2](https://github.com/Opentrons/opentrons/commit/75cc2f2071f98b4026c92603ccecea3c7929ac8c)), closes [#11048](https://github.com/Opentrons/opentrons/issues/11048) [#11125](https://github.com/Opentrons/opentrons/issues/11125)
* **app:** this will close [#11223](https://github.com/Opentrons/opentrons/issues/11223) ([#11231](https://github.com/Opentrons/opentrons/issues/11231)) ([c718356](https://github.com/Opentrons/opentrons/commit/c718356cc4a7e42a532788816c8a7b422a0ca611))
* **app:** update hover state of historical run chevron ([#11153](https://github.com/Opentrons/opentrons/issues/11153)) ([bb861c5](https://github.com/Opentrons/opentrons/commit/bb861c5a779bdfebf703aebba355e2d634869814))


### Features

* **app:** add customLabware to labware filterBy ([#11236](https://github.com/Opentrons/opentrons/issues/11236)) ([3ea1731](https://github.com/Opentrons/opentrons/commit/3ea1731afe0409c6b745d353b8c49c4b5cb4faac)), closes [#10917](https://github.com/Opentrons/opentrons/issues/10917)
* **app:** add map view to liquid labware modal ([#10869](https://github.com/Opentrons/opentrons/issues/10869)) ([94ca292](https://github.com/Opentrons/opentrons/commit/94ca2923c649298d695820d3ad542cc5fa2704d1)), closes [#10521](https://github.com/Opentrons/opentrons/issues/10521)
* **app:** adding support for v6 commands in run log ([#11254](https://github.com/Opentrons/opentrons/issues/11254)) ([41a5a39](https://github.com/Opentrons/opentrons/commit/41a5a39a959b9a1bed3f9e96e1287385c1647075)), closes [#11247](https://github.com/Opentrons/opentrons/issues/11247)
* **app:** display rows of wells with same liquid as a range ([#10974](https://github.com/Opentrons/opentrons/issues/10974)) ([f73c484](https://github.com/Opentrons/opentrons/commit/f73c484246f75615e60430bd9c5f476d8b58b2b3)), closes [#10671](https://github.com/Opentrons/opentrons/issues/10671)
* **app:** liquids tab in protocol details ([#10812](https://github.com/Opentrons/opentrons/issues/10812)) ([7745817](https://github.com/Opentrons/opentrons/commit/77458172c4a15bebb5bb136c427c926c7c7fc61e)), closes [#8826](https://github.com/Opentrons/opentrons/issues/8826)
* **app:** show text if no modules plugged in but required during setup ([#11140](https://github.com/Opentrons/opentrons/issues/11140)) ([efa56d9](https://github.com/Opentrons/opentrons/commit/efa56d90abaf0f6894d7552a28797fb8802ebbac)), closes [#10947](https://github.com/Opentrons/opentrons/issues/10947)
* **app:** support module JSON v6 commands in run log ([#11234](https://github.com/Opentrons/opentrons/issues/11234)) ([5f0cc21](https://github.com/Opentrons/opentrons/commit/5f0cc21a3b7d1958f98910065e87d45869c8939e)), closes [#11228](https://github.com/Opentrons/opentrons/issues/11228)
* **app:** update modal component and labware liquid modal ([#11216](https://github.com/Opentrons/opentrons/issues/11216)) ([3bd4b3a](https://github.com/Opentrons/opentrons/commit/3bd4b3ac83d500680aec48cc79d3b8ec9b12b118)), closes [#11142](https://github.com/Opentrons/opentrons/issues/11142)
* **app:** update React Select to 5.4.0 and add to App package.json ([#11104](https://github.com/Opentrons/opentrons/issues/11104)) ([8cbd3b8](https://github.com/Opentrons/opentrons/commit/8cbd3b851f317c2b36c5e5eb5212119364d68e60)), closes [#11020](https://github.com/Opentrons/opentrons/issues/11020)
* **app:** use started at timestamp in run log ([#11213](https://github.com/Opentrons/opentrons/issues/11213)) ([3878f05](https://github.com/Opentrons/opentrons/commit/3878f05f52b1ecde83b84de19350db92c68907e5))
* **app, components:** align Liquid Setup UI with Figma ([#11044](https://github.com/Opentrons/opentrons/issues/11044)) ([dfd8526](https://github.com/Opentrons/opentrons/commit/dfd8526d133c5954063b416b16b7b5db2a6211fe))





## [6.0.1](https://github.com/Opentrons/opentrons/compare/v6.0.0...v6.0.1) (2022-08-09)


### Bug Fixes

* **app:** connect pipette settings form's submit button ([#11288](https://github.com/Opentrons/opentrons/issues/11288)) ([14228ac](https://github.com/Opentrons/opentrons/commit/14228ac5540d61c31f3dcf18543d9e3630bced51))
* **app, app-shell:** fix python override path select on windows ([#11257](https://github.com/Opentrons/opentrons/issues/11257)) ([0da8f98](https://github.com/Opentrons/opentrons/commit/0da8f983b9b3483b30f5b84dc821865996c6fa50))





# [6.0.0](https://github.com/Opentrons/opentrons/compare/v5.0.2...v6.0.0) (2022-07-14)


### Bug Fixes

* **add:** Dispay sortBy labels to labware and protocols ([#10475](https://github.com/Opentrons/opentrons/issues/10475)) ([c58c51c](https://github.com/Opentrons/opentrons/commit/c58c51c188cd1940e2c4bf77393a5256bb7daf63))
* **app:** 6.0 feedback design QA T1 protocols landing page ([#10488](https://github.com/Opentrons/opentrons/issues/10488)) ([18149cc](https://github.com/Opentrons/opentrons/commit/18149cc99ef91cfd4ecc6ed04eed3324afc4892f))
* **app:** 6.0 overall design QA ([#11081](https://github.com/Opentrons/opentrons/issues/11081)) ([bec8e23](https://github.com/Opentrons/opentrons/commit/bec8e23b9dfc4d29c88d5b5de73dd315a0c00885))
* **app:** add default message for waitForResume commands ([#10965](https://github.com/Opentrons/opentrons/issues/10965)) ([b04a1eb](https://github.com/Opentrons/opentrons/commit/b04a1eba23e13f5ba3f6b606c08bafda4500a1e4)), closes [#10948](https://github.com/Opentrons/opentrons/issues/10948)
* **app:** Add looking for robots state ([#10615](https://github.com/Opentrons/opentrons/issues/10615)) ([00df52d](https://github.com/Opentrons/opentrons/commit/00df52d1ee54d2f6e6dc711ec394b8891d7f5eee)), closes [#10483](https://github.com/Opentrons/opentrons/issues/10483)
* **app:** Add null check to avoid white screen ([#10518](https://github.com/Opentrons/opentrons/issues/10518)) ([7981096](https://github.com/Opentrons/opentrons/commit/798109663751b0f0e1fda5340ec293b1536beb77))
* **app:** add overflow prop for long name ([#10524](https://github.com/Opentrons/opentrons/issues/10524)) ([1c051fe](https://github.com/Opentrons/opentrons/commit/1c051febd37aa87fd986b99c5fa486f983c1b0d3)), closes [#10505](https://github.com/Opentrons/opentrons/issues/10505) [#10481](https://github.com/Opentrons/opentrons/issues/10481)
* **app:** Add release notes link to GeneralSettings ([#10097](https://github.com/Opentrons/opentrons/issues/10097)) ([5d51bd1](https://github.com/Opentrons/opentrons/commit/5d51bd1187a08c81fe79ab6f9887d4c683e2a285))
* **app:** Address Choose a robot to run slideout design feedback ([#11065](https://github.com/Opentrons/opentrons/issues/11065)) ([1b1f84e](https://github.com/Opentrons/opentrons/commit/1b1f84e195ebd4daf709ce2736defcd6d55c37a2)), closes [#11029](https://github.com/Opentrons/opentrons/issues/11029) [#11057](https://github.com/Opentrons/opentrons/issues/11057)
* **app:** address design feedback initial protocols landing page  ([#10950](https://github.com/Opentrons/opentrons/issues/10950)) ([9346a8a](https://github.com/Opentrons/opentrons/commit/9346a8af2830a1d191558d2215e9feb7a696a1e5)), closes [#10907](https://github.com/Opentrons/opentrons/issues/10907)
* **app:** Address Labware import slideout design feedback ([#10994](https://github.com/Opentrons/opentrons/issues/10994)) ([6943c37](https://github.com/Opentrons/opentrons/commit/6943c37e5fadab983b10366b69ea7706a5c587f8)), closes [#10926](https://github.com/Opentrons/opentrons/issues/10926)
* **app:** Address labware landing page design feedback ([#10957](https://github.com/Opentrons/opentrons/issues/10957)) ([6baaa46](https://github.com/Opentrons/opentrons/commit/6baaa46169d6f6e7907a1bf75b88719cbccf729c)), closes [#10905](https://github.com/Opentrons/opentrons/issues/10905)
* **app:** Address protocols landing design feedback ([#10993](https://github.com/Opentrons/opentrons/issues/10993)) ([1e83a0f](https://github.com/Opentrons/opentrons/commit/1e83a0f0a0ab0977d2accca9db0f67485e29de49)), closes [#10767](https://github.com/Opentrons/opentrons/issues/10767) [#10208](https://github.com/Opentrons/opentrons/issues/10208) [#10208](https://github.com/Opentrons/opentrons/issues/10208)
* **app:** Align Import a Protocol Slideout with the Design ([#10112](https://github.com/Opentrons/opentrons/issues/10112)) ([8520da7](https://github.com/Opentrons/opentrons/commit/8520da76cee442a15d912615e8486f5ff4882229))
* **app:** Aligned link text with the design ([#10030](https://github.com/Opentrons/opentrons/issues/10030)) ([a0504c7](https://github.com/Opentrons/opentrons/commit/a0504c74e266001ca23b32a6bc8d636901d6336d))
* **app:** App fix deck cal banner misleading issue ([#10979](https://github.com/Opentrons/opentrons/issues/10979)) ([4b732bf](https://github.com/Opentrons/opentrons/commit/4b732bf506af0327a8bae6e4ef87a9ce160fafbf)), closes [#10952](https://github.com/Opentrons/opentrons/issues/10952)
* **app:** App fix deck cal button disabled issue ([#10650](https://github.com/Opentrons/opentrons/issues/10650)) ([5819011](https://github.com/Opentrons/opentrons/commit/5819011c5e4ddec6afeb1d7e5527d5f9754ba47c)), closes [#10638](https://github.com/Opentrons/opentrons/issues/10638)
* **app:** App fix design feedback navbar ([#10439](https://github.com/Opentrons/opentrons/issues/10439)) ([a2c2f3a](https://github.com/Opentrons/opentrons/commit/a2c2f3a6a6c997cb5d0f8f283ea301608b166c24))
* **app:** App fix modal dialogs to delete protocol ([#10291](https://github.com/Opentrons/opentrons/issues/10291)) ([2580809](https://github.com/Opentrons/opentrons/commit/258080906c77fa582dbf725f62e164ce1e0f66b4))
* **app:** App fix one attached pipette cal display issue ([#10657](https://github.com/Opentrons/opentrons/issues/10657)) ([c5df074](https://github.com/Opentrons/opentrons/commit/c5df074471a041548f84e84369429791a50ed21c)), closes [#10574](https://github.com/Opentrons/opentrons/issues/10574)
* **app:** App fix robot settings design feedback ([#10290](https://github.com/Opentrons/opentrons/issues/10290)) ([bb1d78d](https://github.com/Opentrons/opentrons/commit/bb1d78dc2627b3fee050726f48b01eef72eb4fb5))
* **app:** App fix switch default page ([#10128](https://github.com/Opentrons/opentrons/issues/10128)) ([cd25aea](https://github.com/Opentrons/opentrons/commit/cd25aea5b504e3a7144b95fbc338de7331321730))
* **app:** app settings navigation active state ([#10299](https://github.com/Opentrons/opentrons/issues/10299)) ([aba494a](https://github.com/Opentrons/opentrons/commit/aba494a6a3232790d36d616b4ce2aed71cfc78d2)), closes [#10104](https://github.com/Opentrons/opentrons/issues/10104)
* **app:** Appettings general tab remove duplicated text ([#10526](https://github.com/Opentrons/opentrons/issues/10526)) ([929abce](https://github.com/Opentrons/opentrons/commit/929abcef437c7861d60876906406ced663a4d9fe))
* **app:** avoid the name conflict issue in the same network ([#10723](https://github.com/Opentrons/opentrons/issues/10723)) ([9ba3c37](https://github.com/Opentrons/opentrons/commit/9ba3c37cddcd8210f65a01cd5e980ec88db70b6c))
* **app:** cancelling a protocol run should patch the run to current false ([#10452](https://github.com/Opentrons/opentrons/issues/10452)) ([20848a1](https://github.com/Opentrons/opentrons/commit/20848a15b1ece3885489527ffd96dff302be1f62)), closes [#10412](https://github.com/Opentrons/opentrons/issues/10412)
* **app:** change error text when creation error is run is busy ([#11069](https://github.com/Opentrons/opentrons/issues/11069)) ([b9f2ba4](https://github.com/Opentrons/opentrons/commit/b9f2ba4436a20758f7dcb3356b54ba3f0a0060c9)), closes [#11060](https://github.com/Opentrons/opentrons/issues/11060)
* **app:** check for sw updates with regular top level poll ([#10659](https://github.com/Opentrons/opentrons/issues/10659)) ([62f4476](https://github.com/Opentrons/opentrons/commit/62f4476febd45adbf4dcc39feac8084af2360833))
* **app:** close labware slideout when labware deleted ([#10663](https://github.com/Opentrons/opentrons/issues/10663)) ([4ce9d70](https://github.com/Opentrons/opentrons/commit/4ce9d70872a6138bf72063efbf18e176722ca427)), closes [#10482](https://github.com/Opentrons/opentrons/issues/10482)
* **app:** close pipette and module overflow menus on click ([#10662](https://github.com/Opentrons/opentrons/issues/10662)) ([edb5482](https://github.com/Opentrons/opentrons/commit/edb548282052d35f875ba0129d90f8676ed17b37)), closes [#10639](https://github.com/Opentrons/opentrons/issues/10639)
* **app:** disable device details module controls when robot is busy ([#10614](https://github.com/Opentrons/opentrons/issues/10614)) ([79c70cd](https://github.com/Opentrons/opentrons/commit/79c70cdfb0c3638f751bd375c867b66deec66995)), closes [#10609](https://github.com/Opentrons/opentrons/issues/10609)
* **app:** disable protocol runs when robot update available ([#11050](https://github.com/Opentrons/opentrons/issues/11050)) ([3618c9a](https://github.com/Opentrons/opentrons/commit/3618c9a73c7bb751413f435925ff9b53e52765ad)), closes [#10935](https://github.com/Opentrons/opentrons/issues/10935)
* **app:** disallow run level module control while the run is paused ([#10685](https://github.com/Opentrons/opentrons/issues/10685)) ([212a0f4](https://github.com/Opentrons/opentrons/commit/212a0f4798e5937cba0a4a2c25be379fd5c25722)), closes [#10647](https://github.com/Opentrons/opentrons/issues/10647)
* **app:** do not include tipracks in Labware Position Check that are unused in protocol ([#10295](https://github.com/Opentrons/opentrons/issues/10295)) ([80eea2b](https://github.com/Opentrons/opentrons/commit/80eea2b7b8bdac27b1cd5d2ccebf4d9347588254)), closes [#9691](https://github.com/Opentrons/opentrons/issues/9691)
* **app:** edit paused step item copy ([#10735](https://github.com/Opentrons/opentrons/issues/10735)) ([1a245a8](https://github.com/Opentrons/opentrons/commit/1a245a83a981ac2647e69de95b7a3a2b50a2ff21)), closes [#10338](https://github.com/Opentrons/opentrons/issues/10338)
* **app:** firmware update modal copy update ([#11088](https://github.com/Opentrons/opentrons/issues/11088)) ([27bed72](https://github.com/Opentrons/opentrons/commit/27bed7252268881abe1163ddbe8c96483da46b47)), closes [#11075](https://github.com/Opentrons/opentrons/issues/11075)
* **app:** fix Browse file system button issues ([#11113](https://github.com/Opentrons/opentrons/issues/11113)) ([ec1a4bb](https://github.com/Opentrons/opentrons/commit/ec1a4bbeab8af136cd4162d156b7916a1c95f65d)), closes [#11105](https://github.com/Opentrons/opentrons/issues/11105)
* **app:** fix connect robot via ip address functionality and style ([#10784](https://github.com/Opentrons/opentrons/issues/10784)) ([e3025b7](https://github.com/Opentrons/opentrons/commit/e3025b75f0c5db7eeb499de2df122e31c33c05ed)), closes [#10618](https://github.com/Opentrons/opentrons/issues/10618) [#10593](https://github.com/Opentrons/opentrons/issues/10593) [#10594](https://github.com/Opentrons/opentrons/issues/10594)
* **app:** fix devices landing page text wrapping ([#11110](https://github.com/Opentrons/opentrons/issues/11110)) ([9de3dca](https://github.com/Opentrons/opentrons/commit/9de3dca436a96c8c975ca23e2d230016fe17a892)), closes [#10886](https://github.com/Opentrons/opentrons/issues/10886)
* **app:** fix heater shaker intro pg and misc typography ([#9493](https://github.com/Opentrons/opentrons/issues/9493)) ([347ed6e](https://github.com/Opentrons/opentrons/commit/347ed6e1b90a87f97bb171be87620f20f2db28f2))
* **app:** fix historical protocol run overflow menu bugs ([#10587](https://github.com/Opentrons/opentrons/issues/10587)) ([5f5c20d](https://github.com/Opentrons/opentrons/commit/5f5c20d2ea9d1c3699f7a4d2368cb7e630b4c76a)), closes [#10404](https://github.com/Opentrons/opentrons/issues/10404) [#10545](https://github.com/Opentrons/opentrons/issues/10545) [#10548](https://github.com/Opentrons/opentrons/issues/10548)
* **app:** fix historical protocol run timestamps ([#10934](https://github.com/Opentrons/opentrons/issues/10934)) ([1ade355](https://github.com/Opentrons/opentrons/commit/1ade355b019b3f8d3988938f21047dc70b5a5cb0))
* **app:** fix jump to current step when outside current window ([#11052](https://github.com/Opentrons/opentrons/issues/11052)) ([eb8cf4c](https://github.com/Opentrons/opentrons/commit/eb8cf4c3c31442822fd01bf487a066719ba4f73c)), closes [#10898](https://github.com/Opentrons/opentrons/issues/10898)
* **app:** fix labware info overlay styling with vector ([#11008](https://github.com/Opentrons/opentrons/issues/11008)) ([ebe2ed5](https://github.com/Opentrons/opentrons/commit/ebe2ed559d0e5180a14f57250a7c1be5bc4acbc3)), closes [#10942](https://github.com/Opentrons/opentrons/issues/10942)
* **app:** fix labware offset text alignment, fix historical run log missing timestamps ([#11114](https://github.com/Opentrons/opentrons/issues/11114)) ([94c32a7](https://github.com/Opentrons/opentrons/commit/94c32a70da46201af28481703df775296c600199)), closes [#11109](https://github.com/Opentrons/opentrons/issues/11109) [#11108](https://github.com/Opentrons/opentrons/issues/11108)
* **app:** fix long labware name display issue on slideout ([#10745](https://github.com/Opentrons/opentrons/issues/10745)) ([f88a416](https://github.com/Opentrons/opentrons/commit/f88a4167cfcd90664e0c93d23a4f816910b9fc29)), closes [#10641](https://github.com/Opentrons/opentrons/issues/10641)
* **app:** fix long protocol name display issue ([#10371](https://github.com/Opentrons/opentrons/issues/10371)) ([5433486](https://github.com/Opentrons/opentrons/commit/5433486ff4fc08a6d91442f008658d5348699968))
* **app:** fix pipette calibration modal auto closing ([#10955](https://github.com/Opentrons/opentrons/issues/10955)) ([5d775be](https://github.com/Opentrons/opentrons/commit/5d775be54088f9afbfdd300a39aeccf693a77550)), closes [#10941](https://github.com/Opentrons/opentrons/issues/10941)
* **app:** fix pipette offset cal data fetch issue on RobotSettings ([#10680](https://github.com/Opentrons/opentrons/issues/10680)) ([c11da0c](https://github.com/Opentrons/opentrons/commit/c11da0ca04fe4d78a8f80668e0ae58df9c6d5942)), closes [#10676](https://github.com/Opentrons/opentrons/issues/10676)
* **app:** fix propagation issues with overflow menu modals ([#10364](https://github.com/Opentrons/opentrons/issues/10364)) ([425ec48](https://github.com/Opentrons/opentrons/commit/425ec4824993956efc2b99aa95a39a49b05ef05d)), closes [#10206](https://github.com/Opentrons/opentrons/issues/10206)
* **app:** fix ProtocolRunningContent remounting issue ([#10977](https://github.com/Opentrons/opentrons/issues/10977)) ([be8b3b5](https://github.com/Opentrons/opentrons/commit/be8b3b5a4f2121772156f0e4f0173abc8b0a9ff4)), closes [#10956](https://github.com/Opentrons/opentrons/issues/10956)
* **app:** fix refresh robots spinner spacing and double icon ([#10646](https://github.com/Opentrons/opentrons/issues/10646)) ([33df1aa](https://github.com/Opentrons/opentrons/commit/33df1aa4f5a540d7b0409cdc1577324ca8ce1460)), closes [#10483](https://github.com/Opentrons/opentrons/issues/10483)
* **app:** fix robot settings rename a robot name ([#10044](https://github.com/Opentrons/opentrons/issues/10044)) ([c561f2d](https://github.com/Opentrons/opentrons/commit/c561f2d61b2921de52e8df9ad42d07877c2cdcf3))
* **app:** fix robot settings tip length calibration method selection ([#10991](https://github.com/Opentrons/opentrons/issues/10991)) ([84aa5bf](https://github.com/Opentrons/opentrons/commit/84aa5bf2969f4b41e53108327f6fc5aa07d0b18c)), closes [#10939](https://github.com/Opentrons/opentrons/issues/10939)
* **app:** fix robot update banner ([#10567](https://github.com/Opentrons/opentrons/issues/10567)) ([a7713c4](https://github.com/Opentrons/opentrons/commit/a7713c45216a0ad22e62bbf24605fd902224b8b8)), closes [#10041](https://github.com/Opentrons/opentrons/issues/10041)
* **app:** fix RobotSettings pipette offset cals banner issue ([#10599](https://github.com/Opentrons/opentrons/issues/10599)) ([e6ac78a](https://github.com/Opentrons/opentrons/commit/e6ac78a811eabe69730cb408f439fa58f72f769c))
* **app:** Fix RobotSettings sync issue ([#10581](https://github.com/Opentrons/opentrons/issues/10581)) ([349f35f](https://github.com/Opentrons/opentrons/commit/349f35f4c409858854dc1a3accdcc88cee52b9fc)), closes [#10577](https://github.com/Opentrons/opentrons/issues/10577)
* **app:** fix run log run duration ([#10860](https://github.com/Opentrons/opentrons/issues/10860)) ([6413cfb](https://github.com/Opentrons/opentrons/commit/6413cfbd5d62b38d107a0ac0fb7f49160df607bf))
* **app:** fix See how to setup a new robot link ([#10390](https://github.com/Opentrons/opentrons/issues/10390)) ([fce784c](https://github.com/Opentrons/opentrons/commit/fce784c17cab91b327ab76345ef241d394534fca))
* **app:** Fix Slideout title display bug ([#10437](https://github.com/Opentrons/opentrons/issues/10437)) ([69fc92b](https://github.com/Opentrons/opentrons/commit/69fc92b8544149e720aea728f6a0170d11453373))
* **app:** fix StyledText ts error in RobotSettingsNetworking ([#10317](https://github.com/Opentrons/opentrons/issues/10317)) ([678ba77](https://github.com/Opentrons/opentrons/commit/678ba779c2feea30549ca5339eacc9eef177db99))
* **app:** Fix the section order (Deck Calibration) ([#10394](https://github.com/Opentrons/opentrons/issues/10394)) ([ff1a807](https://github.com/Opentrons/opentrons/commit/ff1a807a68b2f5af8ecd8bee56197e19f8ef6f83))
* **app:** Fix tip length cal fetch on device details ([#10598](https://github.com/Opentrons/opentrons/issues/10598)) ([c73f4cd](https://github.com/Opentrons/opentrons/commit/c73f4cd4be5ffbd06a00f821451df1cdca1be953)), closes [#10531](https://github.com/Opentrons/opentrons/issues/10531)
* **app:** fix tip length calibration method selection ([#10976](https://github.com/Opentrons/opentrons/issues/10976)) ([9d4bec0](https://github.com/Opentrons/opentrons/commit/9d4bec019e449efc8d160005e198fd0e567009da)), closes [#10939](https://github.com/Opentrons/opentrons/issues/10939)
* **app:** fix toast display issue on RobotSettings Advanced tab ([#10625](https://github.com/Opentrons/opentrons/issues/10625)) ([dae7ee5](https://github.com/Opentrons/opentrons/commit/dae7ee5f2087dce9c7d9c122cae61c0f40588481)), closes [#10624](https://github.com/Opentrons/opentrons/issues/10624)
* **app:** fix white screen issue after renaming clicking advanced tab ([#10463](https://github.com/Opentrons/opentrons/issues/10463)) ([e272382](https://github.com/Opentrons/opentrons/commit/e272382d0b3a2318fdf1b8271521bbfc8d164d32))
* **app:** fix wrong event name for Mixpanel ([#10748](https://github.com/Opentrons/opentrons/issues/10748)) ([601e3e6](https://github.com/Opentrons/opentrons/commit/601e3e68d7ba1918751d56a732ee9c28de2bdb6d)), closes [#10744](https://github.com/Opentrons/opentrons/issues/10744)
* **app:** Fixed check-js error ([#10308](https://github.com/Opentrons/opentrons/issues/10308)) ([6a5a434](https://github.com/Opentrons/opentrons/commit/6a5a434324d9acf30816262aadcc4ab0fabfbc59))
* **app:** H-S confirm attachment modal form stopPropagation addition ([#10996](https://github.com/Opentrons/opentrons/issues/10996)) ([e196f4d](https://github.com/Opentrons/opentrons/commit/e196f4d0fd500423ffea7b3ae0fd0dab111aa68a)), closes [#10881](https://github.com/Opentrons/opentrons/issues/10881)
* **app:** handle protocol creation failure in slideouts ([#10925](https://github.com/Opentrons/opentrons/issues/10925)) ([91c28a9](https://github.com/Opentrons/opentrons/commit/91c28a939396955deac52a84f00e8546fcecb91e)), closes [#10569](https://github.com/Opentrons/opentrons/issues/10569)
* **app:** historical runs labware offset should list display names ([#11064](https://github.com/Opentrons/opentrons/issues/11064)) ([09fbb1f](https://github.com/Opentrons/opentrons/commit/09fbb1fb76e103af6378693f043f7db8ac1fc465)), closes [#11062](https://github.com/Opentrons/opentrons/issues/11062)
* **app:** if robot is not connectable during run, navigate to devices ([#10769](https://github.com/Opentrons/opentrons/issues/10769)) ([a4123d3](https://github.com/Opentrons/opentrons/commit/a4123d338c81b83479109d62d568122ed1c8152f)), closes [#10584](https://github.com/Opentrons/opentrons/issues/10584)
* **app:** Modified icon size ([#10113](https://github.com/Opentrons/opentrons/issues/10113)) ([6136c77](https://github.com/Opentrons/opentrons/commit/6136c7785dbcbaccc173915194ac78f7dfece87b))
* **app:** Modify labware card and slideout style ([#10101](https://github.com/Opentrons/opentrons/issues/10101)) ([f7baa38](https://github.com/Opentrons/opentrons/commit/f7baa38744a77c3a2a9ff9af809e4c0ed2a5767d))
* **app:** module cards and slideouts various bug fixes ([#10864](https://github.com/Opentrons/opentrons/issues/10864)) ([7b90a79](https://github.com/Opentrons/opentrons/commit/7b90a79c88c743c36f4291f41baf7db6e821873e)), closes [#10839](https://github.com/Opentrons/opentrons/issues/10839) [#10854](https://github.com/Opentrons/opentrons/issues/10854) [#10856](https://github.com/Opentrons/opentrons/issues/10856)
* **app:** only render historical run overflow menu when menu is open ([#10306](https://github.com/Opentrons/opentrons/issues/10306)) ([14f3bf4](https://github.com/Opentrons/opentrons/commit/14f3bf46140daca9bae2c3db9c568a08f20730da))
* **app:** open tc lid in LPC via protocol engine command ([#11111](https://github.com/Opentrons/opentrons/issues/11111)) ([f74853b](https://github.com/Opentrons/opentrons/commit/f74853b072ff31d3a383ce639d35d0ff5d4db033)), closes [#11096](https://github.com/Opentrons/opentrons/issues/11096)
* **app:** pipette card banners and historical protocol run protocolNames render fix ([#10848](https://github.com/Opentrons/opentrons/issues/10848)) ([3bec913](https://github.com/Opentrons/opentrons/commit/3bec9135fc54014db49ada51150826cc81832c02)), closes [#10658](https://github.com/Opentrons/opentrons/issues/10658)
* **app:** pipette card calibrate banner bug fix ([#10400](https://github.com/Opentrons/opentrons/issues/10400)) ([66b3a70](https://github.com/Opentrons/opentrons/commit/66b3a705764e04e8fc88db55860e18e381795467)), closes [#10324](https://github.com/Opentrons/opentrons/issues/10324)
* **app:** poll protocol analyses not record in useProtocolDetailsForRun ([#10376](https://github.com/Opentrons/opentrons/issues/10376)) ([30babe4](https://github.com/Opentrons/opentrons/commit/30babe469e99171a68ee2083551f32fc01021af2)), closes [#10341](https://github.com/Opentrons/opentrons/issues/10341)
* **app:** protocol run page design qa ([#11013](https://github.com/Opentrons/opentrons/issues/11013)) ([529a0d4](https://github.com/Opentrons/opentrons/commit/529a0d40f4a78b2237dc85b76bc75b730d291d15))
* **app:** protocol Run Record protocolName no longer renders runId ([#10961](https://github.com/Opentrons/opentrons/issues/10961)) ([322c71c](https://github.com/Opentrons/opentrons/commit/322c71c69139c7b7acfa5f7e58a4d9840d24d278)), closes [#10899](https://github.com/Opentrons/opentrons/issues/10899) [#10658](https://github.com/Opentrons/opentrons/issues/10658)
* **app:** protocol sort order changing when clicking sort menu ([#10556](https://github.com/Opentrons/opentrons/issues/10556)) ([6083fb0](https://github.com/Opentrons/opentrons/commit/6083fb08eb859c10b306fab71efa98a5db351163)), closes [#10398](https://github.com/Opentrons/opentrons/issues/10398)
* **app:** remove array brackets in devices landing page jsx ([#11004](https://github.com/Opentrons/opentrons/issues/11004)) ([65e6f0d](https://github.com/Opentrons/opentrons/commit/65e6f0dc94a767422a9477eac5652ab047be88aa))
* **app:** remove focus state in nav on app load ([#11068](https://github.com/Opentrons/opentrons/issues/11068)) ([ace77fd](https://github.com/Opentrons/opentrons/commit/ace77fd5417e4b21602eb1fa155b84b4924d2b01))
* **app:** remove legacy modal content background color override prop ([#10992](https://github.com/Opentrons/opentrons/issues/10992)) ([346fafc](https://github.com/Opentrons/opentrons/commit/346fafce067bfd805e073309d0660feb7603b0d9)), closes [#10742](https://github.com/Opentrons/opentrons/issues/10742)
* **app:** remove Robot is now successful modal from update flow ([#11001](https://github.com/Opentrons/opentrons/issues/11001)) ([81373cb](https://github.com/Opentrons/opentrons/commit/81373cbff82a0f41f80a44d89525b8303b05d825))
* **app:** remove slideout and modal from robot overflow menu conditional render ([#10990](https://github.com/Opentrons/opentrons/issues/10990)) ([884396d](https://github.com/Opentrons/opentrons/commit/884396d9cb04753fd21e802ae1e9d9ecb5a51e6a)), closes [#10782](https://github.com/Opentrons/opentrons/issues/10782) [#10536](https://github.com/Opentrons/opentrons/issues/10536)
* **app:** remove unused intercom snippet ([#10620](https://github.com/Opentrons/opentrons/issues/10620)) ([8607bc0](https://github.com/Opentrons/opentrons/commit/8607bc0451cee5acc20b9e2a18608dc98f861679)), closes [#10547](https://github.com/Opentrons/opentrons/issues/10547)
* **app:** render LPC summary data as a table to prevent misalignment ([#11084](https://github.com/Opentrons/opentrons/issues/11084)) ([331c52e](https://github.com/Opentrons/opentrons/commit/331c52ec6bc926e06ecb4536dfb6a6f4732185f9)), closes [#11077](https://github.com/Opentrons/opentrons/issues/11077)
* **app:** reorder overeflow menu on protocol card ([#10522](https://github.com/Opentrons/opentrons/issues/10522)) ([5d737ce](https://github.com/Opentrons/opentrons/commit/5d737cef27ec114ba9021e710e256f17e9d98315)), closes [#10499](https://github.com/Opentrons/opentrons/issues/10499)
* **app:** rm analyzing state in run header for historical runs ([#11122](https://github.com/Opentrons/opentrons/issues/11122)) ([efa83d4](https://github.com/Opentrons/opentrons/commit/efa83d4da31d27bb2d16dd35ddd91757dace02fb))
* **app:** robot configuration unused pipette mount copy ([#10467](https://github.com/Opentrons/opentrons/issues/10467)) ([07d2dd0](https://github.com/Opentrons/opentrons/commit/07d2dd047cde571386801ac4eea354ae68b61c0f)), closes [#10466](https://github.com/Opentrons/opentrons/issues/10466)
* **app:** robot settings cal health check wizard issue ([#10525](https://github.com/Opentrons/opentrons/issues/10525)) ([b1a28e3](https://github.com/Opentrons/opentrons/commit/b1a28e3a14a44397a9ae12fa5bd2ff840edecf91))
* **app:** robot Update banner renders when bot is unavailable fix ([#10673](https://github.com/Opentrons/opentrons/issues/10673)) ([f8f8425](https://github.com/Opentrons/opentrons/commit/f8f84256f7d51783f05d40e3b0624c8cfffac4ee)), closes [#10670](https://github.com/Opentrons/opentrons/issues/10670)
* **app:** robot update Modal CTA fix ([#10592](https://github.com/Opentrons/opentrons/issues/10592)) ([33fd4ab](https://github.com/Opentrons/opentrons/commit/33fd4abdfbcf6aa2bf6c2aeb843a1d5914f50558)), closes [#10431](https://github.com/Opentrons/opentrons/issues/10431)
* **app:** RobotSettings deck calibration banner issue display issue ([#10515](https://github.com/Opentrons/opentrons/issues/10515)) ([4e975d3](https://github.com/Opentrons/opentrons/commit/4e975d383e788efb069144f5cc1a4d20e555c43f)), closes [#10484](https://github.com/Opentrons/opentrons/issues/10484)
* **app:** sanitize legacy command text in new run log to protect for non string values ([#11129](https://github.com/Opentrons/opentrons/issues/11129)) ([06edad6](https://github.com/Opentrons/opentrons/commit/06edad69dae9c8827c9083562304f59bc399c016))
* **app:** sanitize legacy command text in run log to protect for non string values ([#11127](https://github.com/Opentrons/opentrons/issues/11127)) ([e586bfe](https://github.com/Opentrons/opentrons/commit/e586bfefd904587673fa7ca4cd71ffee524aa484))
* **app:** See How Robot Calibration Works Modal ([#10415](https://github.com/Opentrons/opentrons/issues/10415)) ([b28a6be](https://github.com/Opentrons/opentrons/commit/b28a6be983b444a1b647f5d89d31a4ed03f1941b))
* **app:** see how to restore a previous sw version btn fix ([#10978](https://github.com/Opentrons/opentrons/issues/10978)) ([c20ad24](https://github.com/Opentrons/opentrons/commit/c20ad24feb1cfc54e07d633f3a3c4a9d8ef9933d)), closes [#10972](https://github.com/Opentrons/opentrons/issues/10972)
* **app:** show update modal for update from file and unlink unfinished update slideout ([#10405](https://github.com/Opentrons/opentrons/issues/10405)) ([04f24cd](https://github.com/Opentrons/opentrons/commit/04f24cdfd8c9a928b9d45018584b790dfcba5d95)), closes [#10312](https://github.com/Opentrons/opentrons/issues/10312)
* **app:** software update toggle logic refactor ([#10968](https://github.com/Opentrons/opentrons/issues/10968)) ([df3ab80](https://github.com/Opentrons/opentrons/commit/df3ab804f628299b728db56cd0cf5a11e2db524d)), closes [#10962](https://github.com/Opentrons/opentrons/issues/10962)
* **app:** stop click outside modal redirect  ([#10382](https://github.com/Opentrons/opentrons/issues/10382)) ([44dc04a](https://github.com/Opentrons/opentrons/commit/44dc04a8e4d4ab088571581c58c16e9723eafcf8)), closes [#10277](https://github.com/Opentrons/opentrons/issues/10277)
* **app:** sync robot clock on device and run detail page ([#10933](https://github.com/Opentrons/opentrons/issues/10933)) ([06a73a8](https://github.com/Opentrons/opentrons/commit/06a73a8c9571a1950d3055de8b971d77d3d6015b)), closes [#10804](https://github.com/Opentrons/opentrons/issues/10804)
* **app:** temporary redirect to devices page ([#10712](https://github.com/Opentrons/opentrons/issues/10712)) ([4eaedbe](https://github.com/Opentrons/opentrons/commit/4eaedbea2fa7d08a614c2633d7cb6a74955d4095)), closes [#10709](https://github.com/Opentrons/opentrons/issues/10709)
* **app:** this PR makes <Link> from opentrons componets tabbable ([#10930](https://github.com/Opentrons/opentrons/issues/10930)) ([c7fc0f0](https://github.com/Opentrons/opentrons/commit/c7fc0f0969b8c29325a153b61ac2796dda042703))
* **app:** this will fix [#11028](https://github.com/Opentrons/opentrons/issues/11028) ([#11053](https://github.com/Opentrons/opentrons/issues/11053)) ([7497d68](https://github.com/Opentrons/opentrons/commit/7497d683e143f00d20d90bb4c912ff74c46b4926))
* **app:** this will fix overflow menu overlapping issue on RobotSettings Calibration Tab ([#10661](https://github.com/Opentrons/opentrons/issues/10661)) ([44f9e81](https://github.com/Opentrons/opentrons/commit/44f9e8126006b0406139418af46607f3f7770646)), closes [#10640](https://github.com/Opentrons/opentrons/issues/10640)
* **app:** tweak copy on not avail modal ([#10428](https://github.com/Opentrons/opentrons/issues/10428)) ([ae729e7](https://github.com/Opentrons/opentrons/commit/ae729e724a47941160acae3508a8c7fed314f463))
* **app:** tweak protocol delete modal title ([#10464](https://github.com/Opentrons/opentrons/issues/10464)) ([fae7cb6](https://github.com/Opentrons/opentrons/commit/fae7cb67d61e6525d53677b017fffcfa697396d2)), closes [#10167](https://github.com/Opentrons/opentrons/issues/10167)
* **app:** update out of date support links ([#10388](https://github.com/Opentrons/opentrons/issues/10388)) ([fb4ed1f](https://github.com/Opentrons/opentrons/commit/fb4ed1f1ecec96195626c71a06e0cca2c3578b87)), closes [#10204](https://github.com/Opentrons/opentrons/issues/10204)
* **app:** update robot banner no longer accessible when robot is busy ([#10717](https://github.com/Opentrons/opentrons/issues/10717)) ([bb700df](https://github.com/Opentrons/opentrons/commit/bb700df918ee8ebfcb34f80add01f18fe4de1562)), closes [#10311](https://github.com/Opentrons/opentrons/issues/10311)
* **app:** Update robot rename rule ([#10318](https://github.com/Opentrons/opentrons/issues/10318)) ([ecd77ef](https://github.com/Opentrons/opentrons/commit/ecd77ef5404b693933f75748e2a12778681f5805))
* **app:** wire up Software Update Alerts toggle logic ([#10732](https://github.com/Opentrons/opentrons/issues/10732)) ([6c8c5c0](https://github.com/Opentrons/opentrons/commit/6c8c5c0b0980e5c33a836cf46c94a6597dd55046)), closes [#10576](https://github.com/Opentrons/opentrons/issues/10576)
* **app, react-api-client:** add run creation spinner and handle errors in slideouts during run creation ([#10944](https://github.com/Opentrons/opentrons/issues/10944)) ([3002093](https://github.com/Opentrons/opentrons/commit/300209338efcd77071632d88a677ab2a68636a71))


### Features

* **app:**  App robot settings advanced tab robot update ([#10010](https://github.com/Opentrons/opentrons/issues/10010)) ([cf4e9ec](https://github.com/Opentrons/opentrons/commit/cf4e9ecf1bc825bf86339fb0867781a8e25f7e3a))
* **app:** about Module Slideouts ([#9543](https://github.com/Opentrons/opentrons/issues/9543)) ([d40dbc3](https://github.com/Opentrons/opentrons/commit/d40dbc3502cef97bbb10956c831e94e48f0ed688)), closes [#9305](https://github.com/Opentrons/opentrons/issues/9305)
* **app:** add animation to StatusLabel icon ([#9388](https://github.com/Opentrons/opentrons/issues/9388)) ([ea03868](https://github.com/Opentrons/opentrons/commit/ea03868088fb6962a64216568a8b97bc9e0acd9c)), closes [#9356](https://github.com/Opentrons/opentrons/issues/9356)
* **app:** add delete protocol option to overflow menu and create modal ([#10984](https://github.com/Opentrons/opentrons/issues/10984)) ([2e4ad60](https://github.com/Opentrons/opentrons/commit/2e4ad6065a310c12f2fdbe8f3a8b576df9395374)), closes [#10402](https://github.com/Opentrons/opentrons/issues/10402)
* **app:** Add Download logs Toast to RobotSettingsAdvanced Tab ([#10088](https://github.com/Opentrons/opentrons/issues/10088)) ([f5b0ad8](https://github.com/Opentrons/opentrons/commit/f5b0ad8a7e395b3e438afe004f2453c89f3a4433))
* **app:** add feature flag for liquid setup ([#10554](https://github.com/Opentrons/opentrons/issues/10554)) ([d4d3666](https://github.com/Opentrons/opentrons/commit/d4d3666300faa78e802aba5c34cf3f4944a59039)), closes [#10520](https://github.com/Opentrons/opentrons/issues/10520)
* **app:** add filter and sort to labware landing ([#9954](https://github.com/Opentrons/opentrons/issues/9954)) ([4bd9dec](https://github.com/Opentrons/opentrons/commit/4bd9decfb63e569c24443f2bfedd64bfaf448fa9))
* **app:** add H-S 2d render to Power On page in Wizard ([#9757](https://github.com/Opentrons/opentrons/issues/9757)) ([177f5a5](https://github.com/Opentrons/opentrons/commit/177f5a58759baeb5f308b9834c26ac2275f13169)), closes [#9519](https://github.com/Opentrons/opentrons/issues/9519)
* **app:** add H-S labware set up info ([#9974](https://github.com/Opentrons/opentrons/issues/9974)) ([d064106](https://github.com/Opentrons/opentrons/commit/d064106d477332d6a72182a338b088ab5eaf291a)), closes [#9269](https://github.com/Opentrons/opentrons/issues/9269)
* **app:** add heater shaker attach module page ([#9517](https://github.com/Opentrons/opentrons/issues/9517)) ([caaab4e](https://github.com/Opentrons/opentrons/commit/caaab4e64ce321689ce930ee399f4c7fbecb2565))
* **app:** add heater shaker module card ([#9653](https://github.com/Opentrons/opentrons/issues/9653)) ([a26e918](https://github.com/Opentrons/opentrons/commit/a26e9182970ea30c9e7726201202adcd76026698)), closes [#9288](https://github.com/Opentrons/opentrons/issues/9288)
* **app:** add heater shaker wizard key parts page ([#9499](https://github.com/Opentrons/opentrons/issues/9499)) ([e75fe82](https://github.com/Opentrons/opentrons/commit/e75fe82c8b8f3723bebed40dcd32cfdf3b7f6c10))
* **app:** add heater shaker wizard scaffold ([#9451](https://github.com/Opentrons/opentrons/issues/9451)) ([c68b750](https://github.com/Opentrons/opentrons/commit/c68b75018f58343852d72c297c8970483760d6cd))
* **app:** add liquid setup list view static list ([#10608](https://github.com/Opentrons/opentrons/issues/10608)) ([4158875](https://github.com/Opentrons/opentrons/commit/415887527fcd161cc8fcffcc6536e746a4f7d7df)), closes [#10517](https://github.com/Opentrons/opentrons/issues/10517)
* **app:** add liquid setup step to run setup page ([#10591](https://github.com/Opentrons/opentrons/issues/10591)) ([9f54480](https://github.com/Opentrons/opentrons/commit/9f54480213cf033d32e0531a0b397b7626a2e86d)), closes [#8909](https://github.com/Opentrons/opentrons/issues/8909)
* **app:** add magnetic module card in device details ([#9347](https://github.com/Opentrons/opentrons/issues/9347)) ([466e056](https://github.com/Opentrons/opentrons/commit/466e0567065d8773a81c25cd1b5c7998e00adf2c)), closes [#9324](https://github.com/Opentrons/opentrons/issues/9324)
* **app:** add managed file system storage for protocols ([#9703](https://github.com/Opentrons/opentrons/issues/9703)) ([153431f](https://github.com/Opentrons/opentrons/commit/153431f7092ce542d068fcd603f423cd3f5442ad)), closes [#9483](https://github.com/Opentrons/opentrons/issues/9483) [#9405](https://github.com/Opentrons/opentrons/issues/9405)
* **app:** add module icon tooltips to robot card ([#10103](https://github.com/Opentrons/opentrons/issues/10103)) ([20472f4](https://github.com/Opentrons/opentrons/commit/20472f4a97a92049bf93dd68a15c1e7700a0f391)), closes [#8672](https://github.com/Opentrons/opentrons/issues/8672)
* **app:** add overFlow menu component and icon states ([#9409](https://github.com/Opentrons/opentrons/issues/9409)) ([40fcfd9](https://github.com/Opentrons/opentrons/commit/40fcfd9ee628dccace4a8e118d0039030ebd400c)), closes [#9362](https://github.com/Opentrons/opentrons/issues/9362)
* **app:** add protocol card sorting ([#10223](https://github.com/Opentrons/opentrons/issues/10223)) ([49f9b1f](https://github.com/Opentrons/opentrons/commit/49f9b1ff415ff5dc598028b5eb1662673101ef81)), closes [#8817](https://github.com/Opentrons/opentrons/issues/8817)
* **app:** add protocol labware details ([#10084](https://github.com/Opentrons/opentrons/issues/10084)) ([8429e2d](https://github.com/Opentrons/opentrons/commit/8429e2dcaf124636b42df65839092e667766706a)), closes [#8825](https://github.com/Opentrons/opentrons/issues/8825) [#9676](https://github.com/Opentrons/opentrons/issues/9676)
* **app:** Add protocol landing page empty state ([#9358](https://github.com/Opentrons/opentrons/issues/9358)) ([dc1d9e7](https://github.com/Opentrons/opentrons/commit/dc1d9e76c2a60b3f32cad6edb6e99e09b1f550e9)), closes [#8814](https://github.com/Opentrons/opentrons/issues/8814)
* **app:** add protocol overview section ([#10212](https://github.com/Opentrons/opentrons/issues/10212)) ([1066ff0](https://github.com/Opentrons/opentrons/commit/1066ff0238e091c9bcfeac23e729a4b74a063211)), closes [#8821](https://github.com/Opentrons/opentrons/issues/8821)
* **app:** add protocol robot configuration details ([#10033](https://github.com/Opentrons/opentrons/issues/10033)) ([363e7d5](https://github.com/Opentrons/opentrons/commit/363e7d55a50b3d81389bd2184546f2dd04771cf2)), closes [#8824](https://github.com/Opentrons/opentrons/issues/8824)
* **app:** Add protocols list skeleton layout ([#9638](https://github.com/Opentrons/opentrons/issues/9638)) ([cfa1aa5](https://github.com/Opentrons/opentrons/commit/cfa1aa50501677dab49cbb9b3e02e373f256293a))
* **app:** add reinstall button to robot advanced settings ([#10773](https://github.com/Opentrons/opentrons/issues/10773)) ([ace769c](https://github.com/Opentrons/opentrons/commit/ace769c678703d1d96d5e5e40eb70ba567cc23af)), closes [#10435](https://github.com/Opentrons/opentrons/issues/10435)
* **app:** add robot overview action menu ([#10020](https://github.com/Opentrons/opentrons/issues/10020)) ([43214aa](https://github.com/Opentrons/opentrons/commit/43214aac5f0c9bd63ad7200899fac23c50bfcc24)), closes [#8695](https://github.com/Opentrons/opentrons/issues/8695)
* **app:** Add robot side protocol analysis error states ([#10595](https://github.com/Opentrons/opentrons/issues/10595)) ([44cc077](https://github.com/Opentrons/opentrons/commit/44cc077c8c0457fdf76f3abdc00f9a5b95ed6864)), closes [#10357](https://github.com/Opentrons/opentrons/issues/10357)
* **app:** add run tab module controls ([#10006](https://github.com/Opentrons/opentrons/issues/10006)) ([2b157fc](https://github.com/Opentrons/opentrons/commit/2b157fc23544834687da3bce00b70e8757cdb155)), closes [#8752](https://github.com/Opentrons/opentrons/issues/8752)
* **app:** add selectors to Module Cards ([#9636](https://github.com/Opentrons/opentrons/issues/9636)) ([1c04d83](https://github.com/Opentrons/opentrons/commit/1c04d830f12b81f135315a8e71735dc21133ad0b)), closes [#9359](https://github.com/Opentrons/opentrons/issues/9359)
* **app:** add temperature module card in device details ([#9361](https://github.com/Opentrons/opentrons/issues/9361)) ([decbcbb](https://github.com/Opentrons/opentrons/commit/decbcbb753acdae9d7f0f1d79b332fb3a535e0cb)), closes [#9325](https://github.com/Opentrons/opentrons/issues/9325)
* **app:** add test shake slideout ([#9680](https://github.com/Opentrons/opentrons/issues/9680)) ([f3c8296](https://github.com/Opentrons/opentrons/commit/f3c82961939c5627de5dae1a68b78e2caad328d0)), closes [#9317](https://github.com/Opentrons/opentrons/issues/9317)
* **app:** add thermocycler module card in device details ([#9373](https://github.com/Opentrons/opentrons/issues/9373)) ([64575c0](https://github.com/Opentrons/opentrons/commit/64575c0201a24c233fc0462c3848dbc37b1d58e7)), closes [#9326](https://github.com/Opentrons/opentrons/issues/9326)
* **app:** add thermocycler slideout card ([#9421](https://github.com/Opentrons/opentrons/issues/9421)) ([d1a4a72](https://github.com/Opentrons/opentrons/commit/d1a4a7286b83bc4bbb6a366b647b27234efb9c84)), closes [#8789](https://github.com/Opentrons/opentrons/issues/8789)
* **app:** add useToggleGroup for toggle component ([#10558](https://github.com/Opentrons/opentrons/issues/10558)) ([ab66052](https://github.com/Opentrons/opentrons/commit/ab660524e7207dfbc33ec2f29f70b4479ff2793a)), closes [#10552](https://github.com/Opentrons/opentrons/issues/10552)
* **app:** adding selectors for the appSettings ([#9629](https://github.com/Opentrons/opentrons/issues/9629)) ([ec4b2e2](https://github.com/Opentrons/opentrons/commit/ec4b2e28f2390ddc7310426a87839936dc547585))
* **app:** App add reset option for run history ([#10461](https://github.com/Opentrons/opentrons/issues/10461)) ([73503a3](https://github.com/Opentrons/opentrons/commit/73503a392b1f208180b9e9796375d4391fc56d6f))
* **app:** App advanced settings u2e info ([#9876](https://github.com/Opentrons/opentrons/issues/9876)) ([5df5a33](https://github.com/Opentrons/opentrons/commit/5df5a33b6381b89704675ee23446598196fcff82))
* **app:** App robot settings advanced tab robot is busy ([#10368](https://github.com/Opentrons/opentrons/issues/10368)) ([4cfaadc](https://github.com/Opentrons/opentrons/commit/4cfaadc1d4847976781cae50e6e954f90b873157))
* **app:** App robot settings other tabs robot is busy ([#10369](https://github.com/Opentrons/opentrons/issues/10369)) ([c9500e0](https://github.com/Opentrons/opentrons/commit/c9500e0aabcf9634352993566b84509168791fe2))
* **app:** App robot settings temp netwroking ([#9924](https://github.com/Opentrons/opentrons/issues/9924)) ([88b4ef3](https://github.com/Opentrons/opentrons/commit/88b4ef34bfd9c5661da1a94746dd1c88f438e00e))
* **app:** App RobotSettings Calibration Tab Pipette Offset Calibrations and Tip Length Calibrations ([#10275](https://github.com/Opentrons/opentrons/issues/10275)) ([84eebb4](https://github.com/Opentrons/opentrons/commit/84eebb450de5ff284c5e41721ae433f7f25184de))
* **app:** app Settings for unified app ([#9489](https://github.com/Opentrons/opentrons/issues/9489)) ([af8d1ce](https://github.com/Opentrons/opentrons/commit/af8d1ce24071c5b75ef67ad244ca959246a4f9c7)), closes [#8885](https://github.com/Opentrons/opentrons/issues/8885) [#8884](https://github.com/Opentrons/opentrons/issues/8884) [#8886](https://github.com/Opentrons/opentrons/issues/8886) [#8882](https://github.com/Opentrons/opentrons/issues/8882) [#8880](https://github.com/Opentrons/opentrons/issues/8880) [#8879](https://github.com/Opentrons/opentrons/issues/8879)
* **app:** AppSettings Enable labware offset download link ([#9815](https://github.com/Opentrons/opentrons/issues/9815)) ([eeaccf4](https://github.com/Opentrons/opentrons/commit/eeaccf4ee7dc1f8b8e8b2dbe99ed8f8080e9172e))
* **app:** change H-S set shake speed button disabled reason ([#10421](https://github.com/Opentrons/opentrons/issues/10421)) ([0b1b15f](https://github.com/Opentrons/opentrons/commit/0b1b15f3d555c961a1c77c54d765406c454c3a41)), closes [#10418](https://github.com/Opentrons/opentrons/issues/10418)
* **app:** Connect Robot via IP Address Slidout ([#9811](https://github.com/Opentrons/opentrons/issues/9811)) ([4a93206](https://github.com/Opentrons/opentrons/commit/4a932064598cbdece69d47c475a90d9d602fa751)), closes [#8883](https://github.com/Opentrons/opentrons/issues/8883) [/github.com/Opentrons/opentrons/pull/9811#discussion_r837678382](https://github.com//github.com/Opentrons/opentrons/pull/9811/issues/discussion_r837678382)
* **app:** create app tooltip ([#9970](https://github.com/Opentrons/opentrons/issues/9970)) ([ac6c0b3](https://github.com/Opentrons/opentrons/commit/ac6c0b320eaf7ecaa5f1c4e046084c0d60f56408)), closes [#9962](https://github.com/Opentrons/opentrons/issues/9962)
* **app:** create Banner component and add throughout module cards ([#9740](https://github.com/Opentrons/opentrons/issues/9740)) ([161a554](https://github.com/Opentrons/opentrons/commit/161a554ce57133eff511e05e6975fb5491d2ce95)), closes [#9290](https://github.com/Opentrons/opentrons/issues/9290) [#9545](https://github.com/Opentrons/opentrons/issues/9545)
* **app:** create H-S confirm attachment modals ([#9813](https://github.com/Opentrons/opentrons/issues/9813)) ([4a85bbd](https://github.com/Opentrons/opentrons/commit/4a85bbd04fe65cefd55447f98e271ed0c76e8a2b)), closes [#9278](https://github.com/Opentrons/opentrons/issues/9278)
* **app:** create heater shaker wizard intro page ([#9469](https://github.com/Opentrons/opentrons/issues/9469)) ([b8848f2](https://github.com/Opentrons/opentrons/commit/b8848f28d534a7023e984c0b43814db9c966964f)), closes [#9283](https://github.com/Opentrons/opentrons/issues/9283)
* **app:** Create Labware card and Labware Landing ([#9612](https://github.com/Opentrons/opentrons/issues/9612)) ([d09dbd1](https://github.com/Opentrons/opentrons/commit/d09dbd1547c419b7fb63f7dca1589c7def5bcb43)), closes [#8861](https://github.com/Opentrons/opentrons/issues/8861)
* **app:** create Slideout component and make mag deck slideout ([#9382](https://github.com/Opentrons/opentrons/issues/9382)) ([1a3441b](https://github.com/Opentrons/opentrons/commit/1a3441b9532e5c37b699cd599a92fcb1a7837e2c)), closes [#8788](https://github.com/Opentrons/opentrons/issues/8788)
* **app:** creates temp module slideout ([#9415](https://github.com/Opentrons/opentrons/issues/9415)) ([4f85fd5](https://github.com/Opentrons/opentrons/commit/4f85fd560ba1b9f72fe8471b0b5ea6b4bcb32655)), closes [#8790](https://github.com/Opentrons/opentrons/issues/8790)
* **app:** DeckCalibration Section ([#10233](https://github.com/Opentrons/opentrons/issues/10233)) ([f9baa2d](https://github.com/Opentrons/opentrons/commit/f9baa2d9f890d3c13c498741648515363cded52e))
* **app:** delete Connection to Robot Lost modal ([#10416](https://github.com/Opentrons/opentrons/issues/10416)) ([1f0c98b](https://github.com/Opentrons/opentrons/commit/1f0c98be7f97f94ff3da9657fb61ed6a3f301837)), closes [#8795](https://github.com/Opentrons/opentrons/issues/8795)
* **app:** device Details design qa round 2 and fix card overflow btn bugs ([#11054](https://github.com/Opentrons/opentrons/issues/11054)) ([2804048](https://github.com/Opentrons/opentrons/commit/280404814882be82f12ea0b2d9b2ca8c9ea405b1)), closes [#10892](https://github.com/Opentrons/opentrons/issues/10892)
* **app:** device Details historical run log ([#10287](https://github.com/Opentrons/opentrons/issues/10287)) ([4d39ae0](https://github.com/Opentrons/opentrons/commit/4d39ae0595fb59437ea51baee892ff8bf869a34e)), closes [#8696](https://github.com/Opentrons/opentrons/issues/8696)
* **app:** edit Robot Overflow Menu, Pipette Card banner and Advanced Settings ([#10188](https://github.com/Opentrons/opentrons/issues/10188)) ([e21d8db](https://github.com/Opentrons/opentrons/commit/e21d8db51eac5818477264a45ef12c0a2d15fb72)), closes [#10117](https://github.com/Opentrons/opentrons/issues/10117) [#8673](https://github.com/Opentrons/opentrons/issues/8673)
* **app:** fix choose protocol/robot slideout robot busy error logic ([#11106](https://github.com/Opentrons/opentrons/issues/11106)) ([d7ae58b](https://github.com/Opentrons/opentrons/commit/d7ae58bba1bcdf5b2c9bc0197881a65e4488e4c2)), closes [#11060](https://github.com/Opentrons/opentrons/issues/11060)
* **app:** heater shaker banner ([#9424](https://github.com/Opentrons/opentrons/issues/9424)) ([17ee912](https://github.com/Opentrons/opentrons/commit/17ee91255c7dc996cec4cb7d54a9e26502a5e63a)), closes [#9243](https://github.com/Opentrons/opentrons/issues/9243)
* **app:** heater shaker is currently shaking modal ([#9807](https://github.com/Opentrons/opentrons/issues/9807)) ([0ffe555](https://github.com/Opentrons/opentrons/commit/0ffe555f12a2ded6b75f8fdb3b0786e041526829)), closes [#9281](https://github.com/Opentrons/opentrons/issues/9281)
* **app:** heater shaker wizard power on page ([#9536](https://github.com/Opentrons/opentrons/issues/9536)) ([f2cf483](https://github.com/Opentrons/opentrons/commit/f2cf48345cdef75c9b18045c8f4cbd18d09cd68a)), closes [#9283](https://github.com/Opentrons/opentrons/issues/9283)
* **app:** heater shaker wizard test shake ([#9549](https://github.com/Opentrons/opentrons/issues/9549)) ([fa6f9c6](https://github.com/Opentrons/opentrons/commit/fa6f9c6f146a2eb3c54ca0131461abb22c8ec715))
* **app:** heater shaker wizard thermal adapter page ([#9500](https://github.com/Opentrons/opentrons/issues/9500)) ([60b249b](https://github.com/Opentrons/opentrons/commit/60b249b8a088fc0604820416668cd45d31e55b8c)), closes [#9283](https://github.com/Opentrons/opentrons/issues/9283)
* **app:** import new custom labware definition ([#9749](https://github.com/Opentrons/opentrons/issues/9749)) ([d3479fd](https://github.com/Opentrons/opentrons/commit/d3479fdb07ab12cf8199e8d7160478ef99061601)), closes [#8866](https://github.com/Opentrons/opentrons/issues/8866)
* **app:** interactive liquid list view items ([#10696](https://github.com/Opentrons/opentrons/issues/10696)) ([9116db1](https://github.com/Opentrons/opentrons/commit/9116db1c565f73799983cbbebe7245cc6098aa6d)), closes [#10571](https://github.com/Opentrons/opentrons/issues/10571)
* **app:** liquid setup labware detail modal ([#10742](https://github.com/Opentrons/opentrons/issues/10742)) ([bda60f1](https://github.com/Opentrons/opentrons/commit/bda60f115ab929367c01e7b931622c28163b7960)), closes [#10669](https://github.com/Opentrons/opentrons/issues/10669)
* **app:** make pipette cards and overflow menus ([#9976](https://github.com/Opentrons/opentrons/issues/9976)) ([c2753cd](https://github.com/Opentrons/opentrons/commit/c2753cdb1b1f27c2d5762a220a5d3aba061bb921)), closes [#8692](https://github.com/Opentrons/opentrons/issues/8692) [#8693](https://github.com/Opentrons/opentrons/issues/8693)
* **app:** make protocol runs from history clickable ([#10537](https://github.com/Opentrons/opentrons/issues/10537)) ([b98abee](https://github.com/Opentrons/opentrons/commit/b98abee7ce9922b656ed4f2caf3baedc49fa0609)), closes [#10502](https://github.com/Opentrons/opentrons/issues/10502)
* **app:** make story for MenuItem, Slideout, and OverflowBtn ([#9455](https://github.com/Opentrons/opentrons/issues/9455)) ([b10dcb3](https://github.com/Opentrons/opentrons/commit/b10dcb3637d12149bd4d6b664c684c7117be3a9d)), closes [#9449](https://github.com/Opentrons/opentrons/issues/9449)
* **app:** map view of liquid setup  ([#10743](https://github.com/Opentrons/opentrons/issues/10743)) ([e8eab25](https://github.com/Opentrons/opentrons/commit/e8eab253444c546d0cefcfb116957a1666779b22)), closes [#10519](https://github.com/Opentrons/opentrons/issues/10519)
* **app:** modal design qa feedback round 2 ([#10868](https://github.com/Opentrons/opentrons/issues/10868)) ([aba9664](https://github.com/Opentrons/opentrons/commit/aba9664450a668d3295c47908a2e6a5f1c12521c)), closes [#10866](https://github.com/Opentrons/opentrons/issues/10866)
* **app:** module slideout QA feedback touchups  ([#10110](https://github.com/Opentrons/opentrons/issues/10110)) ([a9b0738](https://github.com/Opentrons/opentrons/commit/a9b073854bd9d51ba79bfc25a24b07b3b30b3a07)), closes [#9869](https://github.com/Opentrons/opentrons/issues/9869)
* **app:** nav Help Button link out to Salesforce ([#10302](https://github.com/Opentrons/opentrons/issues/10302)) ([eeb373e](https://github.com/Opentrons/opentrons/commit/eeb373e972c9164d9217f1d6b9a3cf76be06c342)), closes [#10239](https://github.com/Opentrons/opentrons/issues/10239)
* **app:** promote new navigational structure to default view ([#9980](https://github.com/Opentrons/opentrons/issues/9980)) ([4b40d83](https://github.com/Opentrons/opentrons/commit/4b40d8380327708b8a4fd4a7c628b3138e43fba0))
* **app:** propose recent labware offsets to be reapplied for new protocol runs ([#10216](https://github.com/Opentrons/opentrons/issues/10216)) ([15c372c](https://github.com/Opentrons/opentrons/commit/15c372c523f376fcd592f784072aceb6254f108a)), closes [#9795](https://github.com/Opentrons/opentrons/issues/9795)
* **app:** robot controls warning banner ([#10174](https://github.com/Opentrons/opentrons/issues/10174)) ([45fec50](https://github.com/Opentrons/opentrons/commit/45fec50e2574105bbb9291f9f65d361e2f61a0d2)), closes [#10123](https://github.com/Opentrons/opentrons/issues/10123)
* **app:** Robot Settings Design QA 2 ([#11020](https://github.com/Opentrons/opentrons/issues/11020)) ([8b43995](https://github.com/Opentrons/opentrons/commit/8b439959d97cc077e3795cfdfb82398ea6e62d9b)), closes [#10893](https://github.com/Opentrons/opentrons/issues/10893)
* **app:** RobotSettings Advanced Tab FactoryReset reset options ([#10066](https://github.com/Opentrons/opentrons/issues/10066)) ([b2ac094](https://github.com/Opentrons/opentrons/commit/b2ac094274d940f9a3585f593dd77998a33e4106))
* **app:** RobotSettings Calibration Tab Health Check Section ([#10234](https://github.com/Opentrons/opentrons/issues/10234)) ([03243f2](https://github.com/Opentrons/opentrons/commit/03243f2ba19156f0cdfdcef801d7e59379a36a23))
* **app:** show live labware offset while jogging during Labware Position Check ([#10264](https://github.com/Opentrons/opentrons/issues/10264)) ([a5df9e0](https://github.com/Opentrons/opentrons/commit/a5df9e0bbaa7b2429b1e06d0243a8886693c45a4)), closes [#9796](https://github.com/Opentrons/opentrons/issues/9796) [#9797](https://github.com/Opentrons/opentrons/issues/9797)
* **app:** slideout and functionality to heater shaker overflow menu ([#9682](https://github.com/Opentrons/opentrons/issues/9682)) ([271dea6](https://github.com/Opentrons/opentrons/commit/271dea6d1924a795f56aee1e2a0839ef8d10bf61)), closes [#9304](https://github.com/Opentrons/opentrons/issues/9304) [#9303](https://github.com/Opentrons/opentrons/issues/9303) [#9302](https://github.com/Opentrons/opentrons/issues/9302) [#9450](https://github.com/Opentrons/opentrons/issues/9450)
* **app:** wire up don't show me again checkbox for HS modal ([#10139](https://github.com/Opentrons/opentrons/issues/10139)) ([f86b664](https://github.com/Opentrons/opentrons/commit/f86b6646b9fb15cd493bb5302cf4e5dd222ae0f3)), closes [#9814](https://github.com/Opentrons/opentrons/issues/9814)
* **app:** wire up firmware update banner in Module Cards ([#9953](https://github.com/Opentrons/opentrons/issues/9953)) ([372cde0](https://github.com/Opentrons/opentrons/commit/372cde0c8e76adf44fdc8c62eca4cbf743c421bd)), closes [#9155](https://github.com/Opentrons/opentrons/issues/9155)
* **app:** wire up H-S AttachModule page and add MoAM support to wizard ([#9926](https://github.com/Opentrons/opentrons/issues/9926)) ([7d4258a](https://github.com/Opentrons/opentrons/commit/7d4258a18518169bc273b7ee037f7ade50f7550a)), closes [#9534](https://github.com/Opentrons/opentrons/issues/9534)
* **app:** wire up Heater Shaker wizard intro page ([#9867](https://github.com/Opentrons/opentrons/issues/9867)) ([f6235c0](https://github.com/Opentrons/opentrons/commit/f6235c055f1ff180edbd594692d2dc783ac3fc4a)), closes [#9518](https://github.com/Opentrons/opentrons/issues/9518)
* **app:** wire up Modal warning for Clear unavailable robots list button ([#10648](https://github.com/Opentrons/opentrons/issues/10648)) ([a701e09](https://github.com/Opentrons/opentrons/commit/a701e097bd0d7b2730a8dc5dced94bdaf6dfc79a)), closes [#10511](https://github.com/Opentrons/opentrons/issues/10511)
* **app:** wire up pipette overflow menu items ([#10009](https://github.com/Opentrons/opentrons/issues/10009)) ([19d9180](https://github.com/Opentrons/opentrons/commit/19d91803470b2817e68705b19acc3dbe887a1a13)), closes [#8785](https://github.com/Opentrons/opentrons/issues/8785) [#8786](https://github.com/Opentrons/opentrons/issues/8786) [#8787](https://github.com/Opentrons/opentrons/issues/8787) [#9972](https://github.com/Opentrons/opentrons/issues/9972)
* **app-shell, app:** change window width, height; add minWidth ([#10343](https://github.com/Opentrons/opentrons/issues/10343)) ([69685e3](https://github.com/Opentrons/opentrons/commit/69685e38a786a23de4bcf251cee39a00c7314aa7))
* **app, app-shell:** add labware details slideout and overflow menu ([#9894](https://github.com/Opentrons/opentrons/issues/9894)) ([dee5a11](https://github.com/Opentrons/opentrons/commit/dee5a11e594f48b9bd642755d5cc63c023d6c0dc)), closes [#8870](https://github.com/Opentrons/opentrons/issues/8870)
* **app, app-shell, api-client:** include analysis as cli tool within app for protocol ingestion  ([#9825](https://github.com/Opentrons/opentrons/issues/9825)) ([cdf6c59](https://github.com/Opentrons/opentrons/commit/cdf6c59a96ea6ea5dca2ed79269537dbc0bc6ff7))
* **components:** Add design system constants to components library ([#9398](https://github.com/Opentrons/opentrons/issues/9398)) ([657df06](https://github.com/Opentrons/opentrons/commit/657df06a813359d1a4ed519057c687f68b8559b0)), closes [#9389](https://github.com/Opentrons/opentrons/issues/9389)
* **protocol-designer:** add schema v6 migration support ([#9595](https://github.com/Opentrons/opentrons/issues/9595)) ([639cc00](https://github.com/Opentrons/opentrons/commit/639cc0093aac7cf960d0254796c5ca0131d15e25)), closes [#9542](https://github.com/Opentrons/opentrons/issues/9542)
* **shared-data:** add H/S to deck definition, bump deck definition schema ([#10417](https://github.com/Opentrons/opentrons/issues/10417)) ([183a1ac](https://github.com/Opentrons/opentrons/commit/183a1acd2db56750148d59a6058345aa32618311))





## [5.0.2](https://github.com/Opentrons/opentrons/compare/v5.0.1...v5.0.2) (2022-03-03)


### Bug Fixes

* **api, app:** display labware label ([#9587](https://github.com/Opentrons/opentrons/issues/9587)) ([7680d92](https://github.com/Opentrons/opentrons/commit/7680d92d4a966d641e8da558514a153e06946bce)), closes [#9105](https://github.com/Opentrons/opentrons/issues/9105) [#9088](https://github.com/Opentrons/opentrons/issues/9088)
* **app:** do not pass `directionControlButtonColor` into DOM ([#9615](https://github.com/Opentrons/opentrons/issues/9615)) ([0651d91](https://github.com/Opentrons/opentrons/commit/0651d914685f21ef9ca0f11e0339b147df745090))
* **app:** show labware def display name in lpc summary screen, fix nested lw render condition ([#9614](https://github.com/Opentrons/opentrons/issues/9614)) ([fa33c33](https://github.com/Opentrons/opentrons/commit/fa33c33cd586b2694ec6f87642d5019b4cf49c51))
* **app:** surface run record creation errors to users on upload page ([#9597](https://github.com/Opentrons/opentrons/issues/9597)) ([983306c](https://github.com/Opentrons/opentrons/commit/983306c70893fb19f593c9732b566e7b6cfe7a21))
* send custom labware definitions to the server during LPC setup ([#9588](https://github.com/Opentrons/opentrons/issues/9588)) ([7cf3233](https://github.com/Opentrons/opentrons/commit/7cf323370aefb952b0640d04738c64a0f4a2e5c9))





## [5.0.1](https://github.com/Opentrons/opentrons/compare/v5.0.0...v5.0.1) (2022-02-24)


### Bug Fixes

* **app:** add error boundary to LPC component ([#9508](https://github.com/Opentrons/opentrons/issues/9508)) ([6634454](https://github.com/Opentrons/opentrons/commit/66344543053709886a1f5213dff4dea3c9ddbba9))
* **app:** make sure pipette is being used during LPC flow ([#9501](https://github.com/Opentrons/opentrons/issues/9501)) ([459be85](https://github.com/Opentrons/opentrons/commit/459be854c3e34dc19abf7aa8d79cef3e542be2b3))





# [5.0.0](https://github.com/Opentrons/opentrons/compare/v4.7.0...v5.0.0) (2022-02-16)


### Bug Fixes

* **app:** add fileName to title bar if protocolName is undefined ([#9307](https://github.com/Opentrons/opentrons/issues/9307)) ([18cc3ac](https://github.com/Opentrons/opentrons/commit/18cc3acd78924f84e23384599133547ec6732d71)), closes [#9163](https://github.com/Opentrons/opentrons/issues/9163)
* **app:** add missing URL to RerunningProtocolModal ([#8806](https://github.com/Opentrons/opentrons/issues/8806)) ([ce4c2c9](https://github.com/Opentrons/opentrons/commit/ce4c2c985a8e821963b7feaa077d4497ac8b074e)), closes [#8801](https://github.com/Opentrons/opentrons/issues/8801)
* **app:** add null protection for empty file array on protocol upload ([#8809](https://github.com/Opentrons/opentrons/issues/8809)) ([24cc5af](https://github.com/Opentrons/opentrons/commit/24cc5afa3f7839b4da15d0a133133a61ffc188c1))
* **app:** adjust deck map and module warning sizes ([#9184](https://github.com/Opentrons/opentrons/issues/9184)) ([cb682f1](https://github.com/Opentrons/opentrons/commit/cb682f10dd2dd0891d96798610eba69cf59e9e89)), closes [#9158](https://github.com/Opentrons/opentrons/issues/9158)
* **app:** app ([#9165](https://github.com/Opentrons/opentrons/issues/9165)) ([b001ae7](https://github.com/Opentrons/opentrons/commit/b001ae79e6bb06f39ed2cd255a4693adfc4c293a)), closes [#9051](https://github.com/Opentrons/opentrons/issues/9051)
* **app:** block LPC when a protocol does not have a tip rack loaded ([#9145](https://github.com/Opentrons/opentrons/issues/9145)) ([feefc8b](https://github.com/Opentrons/opentrons/commit/feefc8b3dfd0a67bd3a4401c9ac2a12ab43fe080)), closes [#9090](https://github.com/Opentrons/opentrons/issues/9090)
* **app:** calibrate pipette cta goes to robotName/instruments ([#9310](https://github.com/Opentrons/opentrons/issues/9310)) ([0717d4f](https://github.com/Opentrons/opentrons/commit/0717d4f8724966a187e41d6acc877b653c41fac3)), closes [#9267](https://github.com/Opentrons/opentrons/issues/9267)
* **app:** close LPC success toast if relaunched ([#9385](https://github.com/Opentrons/opentrons/issues/9385)) ([4999f71](https://github.com/Opentrons/opentrons/commit/4999f71bba06902db08ce2f36c8210500b4e67cb)), closes [#9377](https://github.com/Opentrons/opentrons/issues/9377)
* **app:** continue to clone run even after receiving a conflict when run is stopped ([#8933](https://github.com/Opentrons/opentrons/issues/8933)) ([6f09043](https://github.com/Opentrons/opentrons/commit/6f0904316ce005dfae592ac521d7eaad17a67617))
* **app:** copy changes in LPC for consistency ([#9178](https://github.com/Opentrons/opentrons/issues/9178)) ([e7013e2](https://github.com/Opentrons/opentrons/commit/e7013e2fe2e72495920b46acc5deb2e77ce7b269)), closes [#9156](https://github.com/Opentrons/opentrons/issues/9156)
* **app:** display error and close run if protocol analysis is not-ok ([#9007](https://github.com/Opentrons/opentrons/issues/9007)) ([a4bf3b5](https://github.com/Opentrons/opentrons/commit/a4bf3b5458949cc8abed2f32de0f54b635d28ee1)), closes [#8984](https://github.com/Opentrons/opentrons/issues/8984)
* **app:** display runtime errors in run detail header ([#9435](https://github.com/Opentrons/opentrons/issues/9435)) ([7e5e1e7](https://github.com/Opentrons/opentrons/commit/7e5e1e77562847e3957d54eec2469d40f1389771))
* **app:** fix borken tooltip translation for LPC CTA when modules not detected ([#9189](https://github.com/Opentrons/opentrons/issues/9189)) ([fe92615](https://github.com/Opentrons/opentrons/commit/fe92615a941bb17becfef799a70cfcabe327ef41))
* **app:** fix bug in which runs and protocols were being queried with empty string params ([#8810](https://github.com/Opentrons/opentrons/issues/8810)) ([ee07fec](https://github.com/Opentrons/opentrons/commit/ee07feced5f92f5f3c824f416f8caa1d629ad7f4))
* **app:** fix loading and disabling of run cta button to avoid infinite spinner ([#9333](https://github.com/Opentrons/opentrons/issues/9333)) ([bce5334](https://github.com/Opentrons/opentrons/commit/bce533450ba6da489f4d4a38aee3a6b3d691fb29))
* **app:** fix missing null checks in protocol setup ([#9114](https://github.com/Opentrons/opentrons/issues/9114)) ([9fe24a4](https://github.com/Opentrons/opentrons/commit/9fe24a4e56ba23edd417957f92e973958d32b1c3))
* **app:** fix module status card error on run page ([#8938](https://github.com/Opentrons/opentrons/issues/8938)) ([1f7aca5](https://github.com/Opentrons/opentrons/commit/1f7aca547b893816346512daaeb4968189f6ddce))
* **app:** fix up labware offset matching logic for labware setup overlays ([#8932](https://github.com/Opentrons/opentrons/issues/8932)) ([91eb5e3](https://github.com/Opentrons/opentrons/commit/91eb5e3c1e62038d3cbb59067903658c62ee2bd3))
* **app:** flip run details redirect check for loaded run ([#9023](https://github.com/Opentrons/opentrons/issues/9023)) ([ba5b901](https://github.com/Opentrons/opentrons/commit/ba5b901454c8c8bb5678edd8cc1af52d5a9f48b3))
* **app:** ignore lpc commands when reconciling run and analysis for run log ([#8940](https://github.com/Opentrons/opentrons/issues/8940)) ([9541236](https://github.com/Opentrons/opentrons/commit/9541236c99bb7c9f903a9023e6e9c7933c9a5f22))
* **app:** initially expand correct setup step with modules and cal complete ([#9185](https://github.com/Opentrons/opentrons/issues/9185)) ([7e93404](https://github.com/Opentrons/opentrons/commit/7e9340441735d628d8d37f4c8a79675e3f78c2c7)), closes [#9127](https://github.com/Opentrons/opentrons/issues/9127)
* **app:** Load pipette centering images and fix styling ([#9148](https://github.com/Opentrons/opentrons/issues/9148)) ([3b3092b](https://github.com/Opentrons/opentrons/commit/3b3092b0a512b77e70e7739f1a7a8529132328fe))
* **app:** prevent run canceled banner from disappearing ([#9179](https://github.com/Opentrons/opentrons/issues/9179)) ([2bf57d9](https://github.com/Opentrons/opentrons/commit/2bf57d9795864c4fab8b5e54db57d34cd2b0d748)), closes [#9108](https://github.com/Opentrons/opentrons/issues/9108)
* **app:** prevent white screen when restarting and closing protocols ([#9091](https://github.com/Opentrons/opentrons/issues/9091)) ([391f606](https://github.com/Opentrons/opentrons/commit/391f606a740ad19ff3962bd7e9709b321f4d5def)), closes [#9082](https://github.com/Opentrons/opentrons/issues/9082) [#9083](https://github.com/Opentrons/opentrons/issues/9083)
* **app:** redirect to run page when run is cloned ([#9297](https://github.com/Opentrons/opentrons/issues/9297)) ([df85a2b](https://github.com/Opentrons/opentrons/commit/df85a2bae4fc0da110f7762fd41b7c70159c1539)), closes [#9106](https://github.com/Opentrons/opentrons/issues/9106)
* **app:** set run again button loading state for completed and stopped runs ([#9229](https://github.com/Opentrons/opentrons/issues/9229)) ([c74b241](https://github.com/Opentrons/opentrons/commit/c74b2417702ca65108d38b8c01774e4678710bf7)), closes [#9161](https://github.com/Opentrons/opentrons/issues/9161)
* **app:** shore up edge cases of current command tracking, use new commands endpoint link metadata ([#9418](https://github.com/Opentrons/opentrons/issues/9418)) ([3c27050](https://github.com/Opentrons/opentrons/commit/3c270503244ee6250d0fff3f902d9356b79892d3)), closes [#9379](https://github.com/Opentrons/opentrons/issues/9379)
* **app:** show cancel run when paused ([#8943](https://github.com/Opentrons/opentrons/issues/8943)) ([526892d](https://github.com/Opentrons/opentrons/commit/526892dfd4d1b7f5fe4694344ce82212f8dda512))
* **app:** show empty protocol upload page if current run is being dimissed ([#8983](https://github.com/Opentrons/opentrons/issues/8983)) ([b50f414](https://github.com/Opentrons/opentrons/commit/b50f4147ab049123ef6f9bc72ffc558772960993)), closes [#8953](https://github.com/Opentrons/opentrons/issues/8953)
* **app:** show protocol setup loading state after protocol record creation ([#8982](https://github.com/Opentrons/opentrons/issues/8982)) ([be485fe](https://github.com/Opentrons/opentrons/commit/be485fed08bc3ef6abf6bb0048d2822ac55455ae))
* **app:** show run errors in banner if run fails, hide errors if canceled ([#9464](https://github.com/Opentrons/opentrons/issues/9464)) ([008c116](https://github.com/Opentrons/opentrons/commit/008c1168a8e46ae35cec00505ca16c3cb6d571d5))
* **app:** titlebar cancel run button behavior and styling ([#9192](https://github.com/Opentrons/opentrons/issues/9192)) ([46c1428](https://github.com/Opentrons/opentrons/commit/46c14284a752d1a76558bf64e8a70e5cad4dcae5))
* **app:** update labware for drop_tip case to prevent whitescreen ([#9228](https://github.com/Opentrons/opentrons/issues/9228)) ([6402246](https://github.com/Opentrons/opentrons/commit/64022465b2321020b9c87fc0e8fe8b91c2a9703a))
* **app:** update protocol upload failed banner style ([#9180](https://github.com/Opentrons/opentrons/issues/9180)) ([d9e3cef](https://github.com/Opentrons/opentrons/commit/d9e3cef40965188125263c926634faa7d957c2c9)), closes [#9097](https://github.com/Opentrons/opentrons/issues/9097)
* **app:** while closing a protocol run, place loading spinner over whole app ([#9353](https://github.com/Opentrons/opentrons/issues/9353)) ([9d0775f](https://github.com/Opentrons/opentrons/commit/9d0775f4e9991cf2d13708cba93eb3b1fc7d91d9))
* **app, shared-data:** splice out first set of setup commands from run log only ([#9086](https://github.com/Opentrons/opentrons/issues/9086)) ([a86d9f7](https://github.com/Opentrons/opentrons/commit/a86d9f7d1b607aef3436a2ddcaa45042dfaf28b5)), closes [#9011](https://github.com/Opentrons/opentrons/issues/9011)


### Features

* **app:** add Comment text above comment commands in run details ([#9054](https://github.com/Opentrons/opentrons/issues/9054)) ([8c5d71f](https://github.com/Opentrons/opentrons/commit/8c5d71f2eb3c8262c556748424e1c390c06f4668)), closes [#9040](https://github.com/Opentrons/opentrons/issues/9040)
* **app:** add feedback link to protocol upload page ([#8854](https://github.com/Opentrons/opentrons/issues/8854)) ([03a61aa](https://github.com/Opentrons/opentrons/commit/03a61aaddb0b44d2fadc1ba3f26a4eb9242b1ce0)), closes [#8727](https://github.com/Opentrons/opentrons/issues/8727)
* **app:** add jupyter advanced setting to download offset data ([#9284](https://github.com/Opentrons/opentrons/issues/9284)) ([a15601b](https://github.com/Opentrons/opentrons/commit/a15601bd95bc775a9f203c02ee5681c1d67b4932))
* **app:** add Labware Offset Link in LPC ([#8967](https://github.com/Opentrons/opentrons/issues/8967)) ([ba6a9a1](https://github.com/Opentrons/opentrons/commit/ba6a9a14443cf543ecbae063eda285a191b6fee5)), closes [#8963](https://github.com/Opentrons/opentrons/issues/8963)
* **app:** add loader to LPC summary screen ([#9006](https://github.com/Opentrons/opentrons/issues/9006)) ([e9c1312](https://github.com/Opentrons/opentrons/commit/e9c13124f5e7d1950228547566ff63f0d9c6a180)), closes [#9001](https://github.com/Opentrons/opentrons/issues/9001)
* **app:** add loading text to LPC hook ([#8700](https://github.com/Opentrons/opentrons/issues/8700)) ([0372a76](https://github.com/Opentrons/opentrons/commit/0372a7645fe5cc51a7869f2e675f46e2d946b2f0)), closes [#8679](https://github.com/Opentrons/opentrons/issues/8679)
* **app:** add LPC Success Toast ([#8830](https://github.com/Opentrons/opentrons/issues/8830)) ([276afb1](https://github.com/Opentrons/opentrons/commit/276afb1525b95de3d39eacfc3eaeba18aa9cd726)), closes [#8486](https://github.com/Opentrons/opentrons/issues/8486)
* **app:** add module mismatch warning label to Module Setup ([#9250](https://github.com/Opentrons/opentrons/issues/9250)) ([af472e6](https://github.com/Opentrons/opentrons/commit/af472e6910c4726c876b025d23fe0c720c36e95a)), closes [#9160](https://github.com/Opentrons/opentrons/issues/9160)
* **app:** add tooltips if module connection or robot calibration is incomplete ([#9110](https://github.com/Opentrons/opentrons/issues/9110)) ([8e2a5a4](https://github.com/Opentrons/opentrons/commit/8e2a5a4bd024da47f066ad15fcd5e3e6bc2193f6)), closes [#9094](https://github.com/Opentrons/opentrons/issues/9094)
* **app:** add X icon to close out of exta attention warning labels ([#9258](https://github.com/Opentrons/opentrons/issues/9258)) ([9406ff6](https://github.com/Opentrons/opentrons/commit/9406ff6937173aafd86403335293d049b197decc)), closes [#8487](https://github.com/Opentrons/opentrons/issues/8487)
* **app:** added thermocycler error state status ([#8643](https://github.com/Opentrons/opentrons/issues/8643)) ([02544ae](https://github.com/Opentrons/opentrons/commit/02544ae2502335658e36e903450809416ee2e68b))
* **app:** apply in flight offsets to pick up tip and drop tip commands ([#8812](https://github.com/Opentrons/opentrons/issues/8812)) ([71b279d](https://github.com/Opentrons/opentrons/commit/71b279d38aa8f9549bbc0cdbbca757f17932f4ff))
* **app:** apply labware offsets to run record after LPC completes ([#8900](https://github.com/Opentrons/opentrons/issues/8900)) ([a961730](https://github.com/Opentrons/opentrons/commit/a961730ed9f21fbf0f8f226d7be9a5be3f432ab4))
* **app:** clear previous labware offsets on LPC start ([#8895](https://github.com/Opentrons/opentrons/issues/8895)) ([be31e2f](https://github.com/Opentrons/opentrons/commit/be31e2ff0553774a687296930c53e87058fa9f6f))
* **app:** confirm pick up tip button style ([#8968](https://github.com/Opentrons/opentrons/issues/8968)) ([b61ef1d](https://github.com/Opentrons/opentrons/commit/b61ef1d0822496dfb052a34c39df342e87899110)), closes [#8961](https://github.com/Opentrons/opentrons/issues/8961)
* **app:** disable start run until robot is ready ([#8924](https://github.com/Opentrons/opentrons/issues/8924)) ([79f0f0a](https://github.com/Opentrons/opentrons/commit/79f0f0a22011fb8c5178773191f349eb6fd57d96)), closes [#8915](https://github.com/Opentrons/opentrons/issues/8915)
* **app:** Display banners when stopped, failed, or succeeded ([#8800](https://github.com/Opentrons/opentrons/issues/8800)) ([700f5a2](https://github.com/Opentrons/opentrons/commit/700f5a22669b89154b26c5d715225c65ea229820)), closes [#8573](https://github.com/Opentrons/opentrons/issues/8573)
* **app:** explain no TLC data if pipette not attached ([#8848](https://github.com/Opentrons/opentrons/issues/8848)) ([2d11fc5](https://github.com/Opentrons/opentrons/commit/2d11fc50507c4ca6be868771e281171d1de28e52)), closes [#8585](https://github.com/Opentrons/opentrons/issues/8585)
* **app:** LPC add pick up tip confirmation  ([#8849](https://github.com/Opentrons/opentrons/issues/8849)) ([f560f3b](https://github.com/Opentrons/opentrons/commit/f560f3babca84d2464050f57c947606fb25832c6))
* **app:** LPC robot is moving modal ([#8657](https://github.com/Opentrons/opentrons/issues/8657)) ([8d7d47d](https://github.com/Opentrons/opentrons/commit/8d7d47d3d2e7d7f9bc289ef4aa46a7172288625b)), closes [#8216](https://github.com/Opentrons/opentrons/issues/8216)
* **app:** LPC: warn about offset destruction ([#8840](https://github.com/Opentrons/opentrons/issues/8840)) ([dd0e0d4](https://github.com/Opentrons/opentrons/commit/dd0e0d4e8d45d8b2576f77e80a288b5c70fc41e7)), closes [#8684](https://github.com/Opentrons/opentrons/issues/8684)
* **app:** pass through python file and run tab disabled reason hook up to run presence ([#8729](https://github.com/Opentrons/opentrons/issues/8729)) ([9f827e2](https://github.com/Opentrons/opentrons/commit/9f827e2a110e86fdedf6e38c9da7901230d748ce))
* **app:** place LPC success modal above metadata card ([#8917](https://github.com/Opentrons/opentrons/issues/8917)) ([8dfbf0c](https://github.com/Opentrons/opentrons/commit/8dfbf0cc7d00ede53652680a26f10b80ce72c5e1))
* **app:** PUR MoaM support ([#8838](https://github.com/Opentrons/opentrons/issues/8838)) ([3ed5be7](https://github.com/Opentrons/opentrons/commit/3ed5be7af0762a669ad1b92c1b1cf07d5200574d)), closes [#8713](https://github.com/Opentrons/opentrons/issues/8713)
* **app:** Run Details Command List ([#8682](https://github.com/Opentrons/opentrons/issues/8682)) ([9ddf133](https://github.com/Opentrons/opentrons/commit/9ddf133f724389444b1ab269238e6aeb862768fe)), closes [#8368](https://github.com/Opentrons/opentrons/issues/8368) [#8481](https://github.com/Opentrons/opentrons/issues/8481)
* **app:** save position right after executing movement command ([#8923](https://github.com/Opentrons/opentrons/issues/8923)) ([ee709ef](https://github.com/Opentrons/opentrons/commit/ee709ef1524dd137f1a7198a3bfa231c01f6b804))
* **app:** show correct number of offsets in rerun protocol section ([#8934](https://github.com/Opentrons/opentrons/issues/8934)) ([f38e78e](https://github.com/Opentrons/opentrons/commit/f38e78ede79d430d50e63fdc0006c15b774f16d0))
* **app:** show loader when setup for runs steps are still loading ([#8857](https://github.com/Opentrons/opentrons/issues/8857)) ([1f3191e](https://github.com/Opentrons/opentrons/commit/1f3191eb3d420a69b88b74cc12f54e763802d467)), closes [#8777](https://github.com/Opentrons/opentrons/issues/8777)
* **app:** show offset deletion warning if previous offsets exist ([#8919](https://github.com/Opentrons/opentrons/issues/8919)) ([98f9696](https://github.com/Opentrons/opentrons/commit/98f96961a66312fcb633f5ce4d3fcfec1506a3e0)), closes [#8841](https://github.com/Opentrons/opentrons/issues/8841)
* **app:** use module model when applying labware offsets ([#8992](https://github.com/Opentrons/opentrons/issues/8992)) ([eaea065](https://github.com/Opentrons/opentrons/commit/eaea0656710d8734168cd4ad84b08043783f50c0))
* **app:** wire up calibration status to protocol details ([#8853](https://github.com/Opentrons/opentrons/issues/8853)) ([1ffeb68](https://github.com/Opentrons/opentrons/commit/1ffeb68fe8b4fc47f606cc79ce2e963298f9739e)), closes [#8846](https://github.com/Opentrons/opentrons/issues/8846)
* **app:** wire up cancel run ([#8721](https://github.com/Opentrons/opentrons/issues/8721)) ([6450edb](https://github.com/Opentrons/opentrons/commit/6450edb0421f1c2484c292f8583602d8f6fd13b8)), closes [#8543](https://github.com/Opentrons/opentrons/issues/8543)
* **app:** wire up labware position check ([#8774](https://github.com/Opentrons/opentrons/issues/8774)) ([6b2c3f1](https://github.com/Opentrons/opentrons/commit/6b2c3f1cfcfcc98b200919ad34544a661641c2cb))
* **app:** wire up labware setup accordion step labware offsets ([#8887](https://github.com/Opentrons/opentrons/issues/8887)) ([8672854](https://github.com/Opentrons/opentrons/commit/8672854b28e5cfbec90f1cd9705ee91998355e63)), closes [#8859](https://github.com/Opentrons/opentrons/issues/8859)
* **app:** wire up protocol resource + LPC ([#8722](https://github.com/Opentrons/opentrons/issues/8722)) ([c463e0a](https://github.com/Opentrons/opentrons/commit/c463e0a22ebccf410d67c6b18fe3c50b8a4a8d03)), closes [#8553](https://github.com/Opentrons/opentrons/issues/8553)
* **app, api-client:** add custom labware support ([#9044](https://github.com/Opentrons/opentrons/issues/9044)) ([9cbff27](https://github.com/Opentrons/opentrons/commit/9cbff274e5989ae6434032052a9875606ab249b3)), closes [#9026](https://github.com/Opentrons/opentrons/issues/9026)
* **robot-server,api,app:** When adding a jog command over HTTP, wait for it to complete before returning ([#9410](https://github.com/Opentrons/opentrons/issues/9410)) ([4d811d5](https://github.com/Opentrons/opentrons/commit/4d811d5485754b45795a275424e0b267edc88270))


### Performance Improvements

* **app:** memoize command items to reduce rerender on run poll ([#9247](https://github.com/Opentrons/opentrons/issues/9247)) ([411c8db](https://github.com/Opentrons/opentrons/commit/411c8db05ac8b64f9a3d809685b82cbff40e4090))
* **app:** virtualize command list on run detail page ([#9275](https://github.com/Opentrons/opentrons/issues/9275)) ([028e85f](https://github.com/Opentrons/opentrons/commit/028e85f89a9e12da98824e009e822d2dbb0022ea)), closes [#9217](https://github.com/Opentrons/opentrons/issues/9217)
* **app, robot-server:** paginate /runs/:run_id/commands response ([#9348](https://github.com/Opentrons/opentrons/issues/9348)) ([b9eb7b4](https://github.com/Opentrons/opentrons/commit/b9eb7b4d98532480705d3c32fd2485508315bea9))
* **robot-server, api-client:** return run summaries from GET /runs rather than full run models ([#9332](https://github.com/Opentrons/opentrons/issues/9332)) ([66b1d7c](https://github.com/Opentrons/opentrons/commit/66b1d7c0082970c53306eb99006309914ad33b22))
* **robot-server, app:** remove commands from GET /runs/:run_id ([#9337](https://github.com/Opentrons/opentrons/issues/9337)) ([56f291a](https://github.com/Opentrons/opentrons/commit/56f291a1a4179322d440621e745186269e2dc4ee))





# [4.7.0](https://github.com/Opentrons/opentrons/compare/v4.6.2...v4.7.0) (2021-11-18)


### Features

* **app:** Add dependency on react-api-client and wrap app/ in QueryClientProvider ([#8614](https://github.com/Opentrons/opentrons/issues/8614)) ([63d4039](https://github.com/Opentrons/opentrons/commit/63d4039410da6ac3c45c5b6e7aaf57bcabce0361))
* **app:** add dynamic section + labware highlighting to LPC intro screen ([#8506](https://github.com/Opentrons/opentrons/issues/8506)) ([6da1eca](https://github.com/Opentrons/opentrons/commit/6da1ecaf7977341b7b290a1a2efee51175b1ceee)), closes [#8467](https://github.com/Opentrons/opentrons/issues/8467)
* **app:** add Generic Step Screen dynamic image ([#8519](https://github.com/Opentrons/opentrons/issues/8519)) ([9f25a91](https://github.com/Opentrons/opentrons/commit/9f25a914dedf396c1617e8e8b891c5eeb43b1ca3)), closes [#8510](https://github.com/Opentrons/opentrons/issues/8510)
* **app:** add ids to elements labware setup section ([#8461](https://github.com/Opentrons/opentrons/issues/8461)) ([c1e877f](https://github.com/Opentrons/opentrons/commit/c1e877f3f2f92fecd0609dcbbae706ece715615c)), closes [#8447](https://github.com/Opentrons/opentrons/issues/8447)
* **app:** add js api client utils and wire up generic step screen ([#8638](https://github.com/Opentrons/opentrons/issues/8638)) ([d790a0b](https://github.com/Opentrons/opentrons/commit/d790a0bd04e35b78d93526850d90cf4d46db91cc)), closes [#8552](https://github.com/Opentrons/opentrons/issues/8552)
* **app:** Add Labware Detail with Well Row/Column Highlighting ([#8499](https://github.com/Opentrons/opentrons/issues/8499)) ([158c0bb](https://github.com/Opentrons/opentrons/commit/158c0bbcfa9dc0a0af0acd9e5b24d76853ad913d)), closes [#8380](https://github.com/Opentrons/opentrons/issues/8380)
* **app:** add PE analysis schema v6 adapter ([31fcc98](https://github.com/Opentrons/opentrons/commit/31fcc9885c6be2b077f2b865f96fe99e981529c1)), closes [#8661](https://github.com/Opentrons/opentrons/issues/8661)
* **app:** create blank labware position check generic step screen and break out intro screen ([#8433](https://github.com/Opentrons/opentrons/issues/8433)) ([be5a764](https://github.com/Opentrons/opentrons/commit/be5a764b93807c29d36c74beb39cc00742c7ecf2))
* **app:** extend DeckMap component in Generic Step Screen ([#8541](https://github.com/Opentrons/opentrons/issues/8541)) ([3e15135](https://github.com/Opentrons/opentrons/commit/3e15135a66bdf28b3b72c9d9cec1919396f282fe)), closes [#8501](https://github.com/Opentrons/opentrons/issues/8501)
* **app:** extend SectionList component for Generic Step Screen ([#8513](https://github.com/Opentrons/opentrons/issues/8513)) ([bb5fab0](https://github.com/Opentrons/opentrons/commit/bb5fab030dbab11cf1c6d40bb0441cec1ca0e7fd)), closes [#8500](https://github.com/Opentrons/opentrons/issues/8500)
* **app:** labware position check generic screen dynamic text ([#8451](https://github.com/Opentrons/opentrons/issues/8451)) ([7f141dd](https://github.com/Opentrons/opentrons/commit/7f141ddadba79b464395abd6c04e85b46ac2811e))
* **app:** LPC final summary screen scaffolding ([#8575](https://github.com/Opentrons/opentrons/issues/8575)) ([d60e9fe](https://github.com/Opentrons/opentrons/commit/d60e9fe9cce7205498b5541d119b235363e0f09f)), closes [#8219](https://github.com/Opentrons/opentrons/issues/8219)
* **app:** protocol upload revamp confirm close protocol ([#8383](https://github.com/Opentrons/opentrons/issues/8383)) ([511c003](https://github.com/Opentrons/opentrons/commit/511c0037cf639a304510982c33d8f651a57c8aeb))
* **app:** PUR accordion steps copy updates ([#8465](https://github.com/Opentrons/opentrons/issues/8465)) ([ee22043](https://github.com/Opentrons/opentrons/commit/ee22043a27307a9b23b3170684031c83daf65a83)), closes [#8430](https://github.com/Opentrons/opentrons/issues/8430)
* **app:** reveal jog controls ([#8528](https://github.com/Opentrons/opentrons/issues/8528)) ([6750168](https://github.com/Opentrons/opentrons/commit/675016811cf3dc95255b42a686cc3aaf2b2b1b06)), closes [#8382](https://github.com/Opentrons/opentrons/issues/8382)
* **app:** rewire connect to robot ([#8567](https://github.com/Opentrons/opentrons/issues/8567)) ([913040e](https://github.com/Opentrons/opentrons/commit/913040e7fdb06f78ffe7adcb1b09f61a2b5a83f7)), closes [#8552](https://github.com/Opentrons/opentrons/issues/8552)
* **app:** Robot Cal Accordion Step ([#8333](https://github.com/Opentrons/opentrons/issues/8333)) ([78e413a](https://github.com/Opentrons/opentrons/commit/78e413a47da32004dee32ddf8b05835cd19b9268))
* **app:** Run Details Individual command styling ([#8612](https://github.com/Opentrons/opentrons/issues/8612)) ([bb0715b](https://github.com/Opentrons/opentrons/commit/bb0715b4040834ee8b21e4eaf3b6c420ae88d079)), closes [#8480](https://github.com/Opentrons/opentrons/issues/8480)
* **app:** wire up protocol upload ([#8663](https://github.com/Opentrons/opentrons/issues/8663)) ([3b8d754](https://github.com/Opentrons/opentrons/commit/3b8d7541f110279ce0955ded13bbc3af714bb0de))
* **components:** add pipette render component ([#8414](https://github.com/Opentrons/opentrons/issues/8414)) ([8c008c4](https://github.com/Opentrons/opentrons/commit/8c008c41ce4dc093770343f8edac18cc69ca4c51)), closes [#8379](https://github.com/Opentrons/opentrons/issues/8379)







**Note:** Version bump only for package @opentrons/app





## [4.6.2](https://github.com/Opentrons/opentrons/compare/v4.6.1...v4.6.2) (2021-09-30)

**Note:** Version bump only for package @opentrons/app





## [4.6.1](https://github.com/Opentrons/opentrons/compare/v4.6.0...v4.6.1) (2021-09-28)

**Note:** Version bump only for package @opentrons/app





# [4.6.0](https://github.com/Opentrons/opentrons/compare/v4.5.0...v4.6.0) (2021-09-27)


### Bug Fixes

* **api:** drop tip after cancel ([#8229](https://github.com/Opentrons/opentrons/issues/8229)) ([bb44718](https://github.com/Opentrons/opentrons/commit/bb447184b97f7607604eb79a4cdad942a9366bc1))


### Features

* **app:** add id attributes for e2e testing ([#8262](https://github.com/Opentrons/opentrons/issues/8262)) ([9d4274c](https://github.com/Opentrons/opentrons/commit/9d4274c565a43ddaeb748752ea17afa8c90a6fe0))
* **app:** add labware setup step to protocol setup flow ([#8172](https://github.com/Opentrons/opentrons/issues/8172)) ([e33deb7](https://github.com/Opentrons/opentrons/commit/e33deb7ca641900196dbc6c8edff0bea7e14343e)), closes [#7665](https://github.com/Opentrons/opentrons/issues/7665)
* **app:** add module attention warning to labware setup  ([#8230](https://github.com/Opentrons/opentrons/issues/8230)) ([618161c](https://github.com/Opentrons/opentrons/commit/618161c74e582845d5907e9368c199396486ed6f))
* **app:** add module setup step to protocol setup ([#8224](https://github.com/Opentrons/opentrons/issues/8224)) ([2b9e77c](https://github.com/Opentrons/opentrons/commit/2b9e77cc0644b8582ceb84764f073f260bdc8c2c))
* **app:** establish logic for labware position check ([#8246](https://github.com/Opentrons/opentrons/issues/8246)) ([9bf7f61](https://github.com/Opentrons/opentrons/commit/9bf7f615660d5949d47b7c410580cf5394011c29))
* **app:** gather all protocol and calibration data  ([#8182](https://github.com/Opentrons/opentrons/issues/8182)) ([31b8df5](https://github.com/Opentrons/opentrons/commit/31b8df583f23f79829e2e046b6db11c123acf4dc)), closes [#8097](https://github.com/Opentrons/opentrons/issues/8097)
* **app:** usb connection and moam modal functionality in module setup ([#8257](https://github.com/Opentrons/opentrons/issues/8257)) ([da516da](https://github.com/Opentrons/opentrons/commit/da516da0cfc6d8a88372f9282d9899d632a5eba4))





# [4.5.0](https://github.com/Opentrons/opentrons/compare/v4.4.0...v4.5.0) (2021-08-03)


### Bug Fixes

* **app:** Run timer stays at 00:00:00 if you reconnect in the middle of a delay ([#7937](https://github.com/Opentrons/opentrons/issues/7937)) ([6415c90](https://github.com/Opentrons/opentrons/commit/6415c9036e5f0368a9862cb11d6608702c0815a3))


### Features

* **labware-creator:** export and import tiprack defs ([#7947](https://github.com/Opentrons/opentrons/issues/7947)) ([a90e66d](https://github.com/Opentrons/opentrons/commit/a90e66d191a47d2a92a839e9554b8610aac27603)), closes [#7696](https://github.com/Opentrons/opentrons/issues/7696) [#7697](https://github.com/Opentrons/opentrons/issues/7697)





# [4.4.0](https://github.com/Opentrons/opentrons/compare/v4.3.1...v4.4.0) (2021-06-16)

**Note:** Version bump only for package @opentrons/app





## [4.3.1](https://github.com/Opentrons/opentrons/compare/v4.3.0...v4.3.1) (2021-05-10)

**Note:** Version bump only for package @opentrons/app





# [4.3.0](https://github.com/Opentrons/opentrons/compare/v4.2.1...v4.3.0) (2021-05-06)

* **app:** conditionally show module usb order instructions ([#7749](https://github.com/Opentrons/opentrons/issues/7749)) ([cc2e974](https://github.com/Opentrons/opentrons/commit/cc2e974))
* **app:** add USB hub port number ([#7738](https://github.com/Opentrons/opentrons/issues/7738)) ([2f317bc](https://github.com/Opentrons/opentrons/commit/2f317bc))
* **app:** add USB order to protocol module list ([#7710](https://github.com/Opentrons/opentrons/issues/7710)) ([64e87a7](https://github.com/Opentrons/opentrons/commit/64e87a7))
* **app:** fix calibrate page redirect url ([#7691](https://github.com/Opentrons/opentrons/issues/7691)) ([450a0c2](https://github.com/Opentrons/opentrons/commit/450a0c2))
* **app:** add missing border to thermocycler live status card ([#7681](https://github.com/Opentrons/opentrons/issues/7681)) ([6fdfe25](https://github.com/Opentrons/opentrons/commit/6fdfe25))
* **app:** use correct module order to get usb port ([#7651](https://github.com/Opentrons/opentrons/issues/7651)) ([4c08cee](https://github.com/Opentrons/opentrons/commit/4c08cee))

### Features

* **app:** allow robot restarts to track boot ID and timeout ([#7589](https://github.com/Opentrons/opentrons/issues/7589)) ([3b33102](https://github.com/Opentrons/opentrons/commit/3b33102)), closes [#6585](https://github.com/Opentrons/opentrons/issues/6585)





## [4.2.1](https://github.com/Opentrons/opentrons/compare/v4.2.0...v4.2.1) (2021-04-06)

**Note:** Version bump only for package @opentrons/app



# [4.2.0](https://github.com/Opentrons/opentrons/compare/v4.1.1...v4.2.0) (2021-03-18)

### Bug Fixes

* **app:** do not resume when clicking "back" from confirm cancel modal ([#7342](https://github.com/Opentrons/opentrons/issues/7342)) ([d55cdab](https://github.com/Opentrons/opentrons/commit/d55cdab)), closes [#5924](https://github.com/Opentrons/opentrons/issues/5924) [#5923](https://github.com/Opentrons/opentrons/issues/5923)
* **app:** ensure cal block prompt appears in pre protocol tlc ([#7278](https://github.com/Opentrons/opentrons/issues/7278)) ([2b55bde](https://github.com/Opentrons/opentrons/commit/2b55bde))


### Features

* **app:** add modules as a side panel group to the calibrate page ([#7312](https://github.com/Opentrons/opentrons/issues/7312)) ([8d1f3ab](https://github.com/Opentrons/opentrons/commit/8d1f3ab))





## [4.1.1](https://github.com/Opentrons/opentrons/compare/v4.1.0...v4.1.1) (2021-01-25)

**Note:** Version bump only for package @opentrons/app





# [4.1.0](https://github.com/Opentrons/opentrons/compare/v4.0.0...v4.1.0) (2021-01-20)

## Bug Fixes

* **app:** restrict size of reset config modal ([#7212](https://github.com/Opentrons/opentrons/issues/7212)) ([01ca11e](https://github.com/Opentrons/opentrons/commit/01ca11e))
* **app:** prompt whether to replace pipette after detach ([#7025](https://github.com/Opentrons/opentrons/issues/7025)) ([dfa92c3](https://github.com/Opentrons/opentrons/commit/dfa92c3))


## Features

* **app:** allow custom tiprack selection in deck cal & pipette offset cal ([#7155](https://github.com/Opentrons/opentrons/issues/7155)) ([c8fc9f2](https://github.com/Opentrons/opentrons/commit/c8fc9f2)), closes [#7087](https://github.com/Opentrons/opentrons/issues/7087)
* **app:** Allow Z jog in save-xy-point ([#7117](https://github.com/Opentrons/opentrons/issues/7117)) ([50865f0](https://github.com/Opentrons/opentrons/commit/50865f0)), closes [#7094](https://github.com/Opentrons/opentrons/issues/7094)
* **app:** track deck & pipette offset cal tiprack selection ([#7205](https://github.com/Opentrons/opentrons/issues/7205)) ([b2bfec5](https://github.com/Opentrons/opentrons/commit/b2bfec5)), closes [#7147](https://github.com/Opentrons/opentrons/issues/7147)
* **shared-data:** add default tipracks to each pipette name spec ([#7108](https://github.com/Opentrons/opentrons/issues/7108)) ([757ca85](https://github.com/Opentrons/opentrons/commit/757ca85))





# [4.0.0](https://github.com/Opentrons/opentrons/compare/v3.21.2...v4.0.0) (2020-11-20)


### Bug Fixes

* **app:** cal check: fix deck setup typo ([#7037](https://github.com/Opentrons/opentrons/issues/7037)) ([0c0013e](https://github.com/Opentrons/opentrons/commit/0c0013e))
* **app:** Filter pipette offset calibrations by mount as well ([#7017](https://github.com/Opentrons/opentrons/issues/7017)) ([8bf5a71](https://github.com/Opentrons/opentrons/commit/8bf5a71))
* **app:** fix pipette info page flag for configuring or changing pipette ([#7018](https://github.com/Opentrons/opentrons/issues/7018)) ([74d9cb4](https://github.com/Opentrons/opentrons/commit/74d9cb4))
* **app:** consistent date formatting for calibration last modified time ([#7003](https://github.com/Opentrons/opentrons/issues/7003)) ([3b3d75d](https://github.com/Opentrons/opentrons/commit/3b3d75d)), closes [#7002](https://github.com/Opentrons/opentrons/issues/7002)
* **app:** fix post attach pipette calibration double wizard ([#7008](https://github.com/Opentrons/opentrons/issues/7008)) ([f4ec258](https://github.com/Opentrons/opentrons/commit/f4ec258))
* **app:** fix required modules list on protocol info page ([#7012](https://github.com/Opentrons/opentrons/issues/7012)) ([47fdbb5](https://github.com/Opentrons/opentrons/commit/47fdbb5))
* **app:** misc cal overhaul sizing, font weight, and spacing tweaks ([#6999](https://github.com/Opentrons/opentrons/issues/6999)) ([ac07045](https://github.com/Opentrons/opentrons/commit/ac07045))
* **app:** pipette calibration info sections show be same height ([#6996](https://github.com/Opentrons/opentrons/issues/6996)) ([bb9cfc4](https://github.com/Opentrons/opentrons/commit/bb9cfc4))
* **app:** Accidental parens in react usememo deps ([#6968](https://github.com/Opentrons/opentrons/issues/6968)) ([df0a15e](https://github.com/Opentrons/opentrons/commit/df0a15e))
* **app:** Correct text when saving z point for all sessions ([#6955](https://github.com/Opentrons/opentrons/issues/6955)) ([71d5ff9](https://github.com/Opentrons/opentrons/commit/71d5ff9))
* **app:** Ensure we are using the correct logic for screen transitions in cal check ([#6960](https://github.com/Opentrons/opentrons/issues/6960)) ([2fbc872](https://github.com/Opentrons/opentrons/commit/2fbc872))
* **app:** fix buildroot download modal title ([#6966](https://github.com/Opentrons/opentrons/issues/6966)) ([9ea7b45](https://github.com/Opentrons/opentrons/commit/9ea7b45)), closes [#5546](https://github.com/Opentrons/opentrons/issues/5546)
* **app:** Fix calibration warning text ([#6977](https://github.com/Opentrons/opentrons/issues/6977)) ([32c90c5](https://github.com/Opentrons/opentrons/commit/32c90c5))
* **app:** fix change pipette and add tests ([#6976](https://github.com/Opentrons/opentrons/issues/6976)) ([079b8c3](https://github.com/Opentrons/opentrons/commit/079b8c3))
* **app:** full-width jog controls ([#6970](https://github.com/Opentrons/opentrons/issues/6970)) ([e41ab7a](https://github.com/Opentrons/opentrons/commit/e41ab7a))
* **app:** prettyprint cal check results ([#6964](https://github.com/Opentrons/opentrons/issues/6964)) ([8ebb9f7](https://github.com/Opentrons/opentrons/commit/8ebb9f7))
* **app:** Fix a typo in introduction ([#6946](https://github.com/Opentrons/opentrons/issues/6946)) ([8cba814](https://github.com/Opentrons/opentrons/commit/8cba814))
* **app:** place top portal at higher z index than page level portal ([#6950](https://github.com/Opentrons/opentrons/issues/6950)) ([b08c4d3](https://github.com/Opentrons/opentrons/commit/b08c4d3))
* **app:** debounce jogs in calcheck ([#6933](https://github.com/Opentrons/opentrons/issues/6933)) ([f355397](https://github.com/Opentrons/opentrons/commit/f355397))
* **app:** Fix intro screen layout with p1k tiprack ([#6932](https://github.com/Opentrons/opentrons/issues/6932)) ([431eacc](https://github.com/Opentrons/opentrons/commit/431eacc))
* **app:** Handle cal data without status ([#6936](https://github.com/Opentrons/opentrons/issues/6936)) ([1cfc0a5](https://github.com/Opentrons/opentrons/commit/1cfc0a5))
* **app:** suppress title bar exit in calcheck results ([#6941](https://github.com/Opentrons/opentrons/issues/6941)) ([e52c8db](https://github.com/Opentrons/opentrons/commit/e52c8db))
* **app:** change pipette exit button text ([#6930](https://github.com/Opentrons/opentrons/issues/6930)) ([7d4a6bd](https://github.com/Opentrons/opentrons/commit/7d4a6bd))
* **app:** Spinner for deck calibration button ([#6902](https://github.com/Opentrons/opentrons/issues/6902)) ([7df8b95](https://github.com/Opentrons/opentrons/commit/7df8b95))
* **app:** put blocking user flows in new top level modal portal ([#6821](https://github.com/Opentrons/opentrons/issues/6821)) ([0e62ff4](https://github.com/Opentrons/opentrons/commit/0e62ff4))
* **app:** Display if DC was migrated ([#6812](https://github.com/Opentrons/opentrons/issues/6812)) ([d37c0c0](https://github.com/Opentrons/opentrons/commit/d37c0c0))
* **app:** debounce calibration jog requests while others are in flight ([#6794](https://github.com/Opentrons/opentrons/issues/6794)) ([d5ae8cd](https://github.com/Opentrons/opentrons/commit/d5ae8cd))
* **app:** fix fetch-on-session-end epics for POC, TLC ([#6757](https://github.com/Opentrons/opentrons/issues/6757)) ([7124bd9](https://github.com/Opentrons/opentrons/commit/7124bd9)), closes [#6747](https://github.com/Opentrons/opentrons/issues/6747)
* **app:** Fix the fetch epics for real this time ([#6761](https://github.com/Opentrons/opentrons/issues/6761)) ([0df6dc5](https://github.com/Opentrons/opentrons/commit/0df6dc5))
* **app:** remove redundant tip rack display name from tooltip ([#6770](https://github.com/Opentrons/opentrons/issues/6770)) ([a81228a](https://github.com/Opentrons/opentrons/commit/a81228a))
* **app, robot-server:** add param to set has cal block command  ([#6792](https://github.com/Opentrons/opentrons/issues/6792)) ([4b9e582](https://github.com/Opentrons/opentrons/commit/4b9e582))
* **app:** fix fetch-on-session-end epics for POC, TLC ([#6757](https://github.com/Opentrons/opentrons/issues/6757)) ([7124bd9](https://github.com/Opentrons/opentrons/commit/7124bd9)), closes [#6747](https://github.com/Opentrons/opentrons/issues/6747)
* **app:** Fix the fetch epics for real this time ([#6761](https://github.com/Opentrons/opentrons/issues/6761)) ([0df6dc5](https://github.com/Opentrons/opentrons/commit/0df6dc5))
* **app:** remove redundant tip rack display name from tooltip ([#6770](https://github.com/Opentrons/opentrons/issues/6770)) ([a81228a](https://github.com/Opentrons/opentrons/commit/a81228a))
* **app, robot-server:** add param to set has cal block command  ([#6792](https://github.com/Opentrons/opentrons/issues/6792)) ([4b9e582](https://github.com/Opentrons/opentrons/commit/4b9e582))





### Features

* **api:** Mark calibrations as bad when determined they exceed threshold ([#6918](https://github.com/Opentrons/opentrons/issues/6918)) ([ac3a866](https://github.com/Opentrons/opentrons/commit/ac3a866))
* **app, robot-server:** Report both the minimum and maximum supported protocol api versions ([#6921](https://github.com/Opentrons/opentrons/issues/6921)) ([22fc36a](https://github.com/Opentrons/opentrons/commit/22fc36a))
* **app,discovery-client:** send Opentrons-Version header with HTTP requests ([#6914](https://github.com/Opentrons/opentrons/issues/6914)) ([089dd36](https://github.com/Opentrons/opentrons/commit/089dd36)), closes [#6852](https://github.com/Opentrons/opentrons/issues/6852)
* **app:** Send intercom event on no-cal-block selected ([#6893](https://github.com/Opentrons/opentrons/issues/6893)) ([8e7059a](https://github.com/Opentrons/opentrons/commit/8e7059a)), closes [#6781](https://github.com/Opentrons/opentrons/issues/6781)
* **app:** cal wizards show if session exists, always ask for cal block if not saved ([#6870](https://github.com/Opentrons/opentrons/issues/6870)) ([e19b850](https://github.com/Opentrons/opentrons/commit/e19b850))
* **app,robot-server:** Retry cal actions ([#6830](https://github.com/Opentrons/opentrons/issues/6830)) ([86c729b](https://github.com/Opentrons/opentrons/commit/86c729b)), closes [#6729](https://github.com/Opentrons/opentrons/issues/6729)
* **app:** Overhaul OT-2 calibration experience ([#6804](https://github.com/Opentrons/opentrons/issues/6804)) ([91f9e98](https://github.com/Opentrons/opentrons/commit/91f9e98)), closes [#6736](https://github.com/Opentrons/opentrons/issues/6736) [#6737](https://github.com/Opentrons/opentrons/issues/6737)
* **app:** update pipette attach flow to include calibration ([#6760](https://github.com/Opentrons/opentrons/issues/6760)) ([c873113](https://github.com/Opentrons/opentrons/commit/c873113)), closes [#2130](https://github.com/Opentrons/opentrons/issues/2130)
* **robot-server,app:** extend pipette offset cal to include tip length cal if needed ([#6641](https://github.com/Opentrons/opentrons/issues/6641)) ([5819f29](https://github.com/Opentrons/opentrons/commit/5819f29))
* **app:** update pipette attach flow to include calibration ([#6760](https://github.com/Opentrons/opentrons/issues/6760)) ([c873113](https://github.com/Opentrons/opentrons/commit/c873113)), closes [#2130](https://github.com/Opentrons/opentrons/issues/2130)
* **robot-server,app:** extend pipette offset cal to include tip length cal if needed ([#6641](https://github.com/Opentrons/opentrons/issues/6641)) ([5819f29](https://github.com/Opentrons/opentrons/commit/5819f29))




## [3.21.2](https://github.com/Opentrons/opentrons/compare/v3.21.1...v3.21.2) (2020-10-16)


### Bug Fixes


* **app:** add analytics and support tracking to ignore app update ([#6790](https://github.com/Opentrons/opentrons/issues/6790)) ([079c2e9](https://github.com/Opentrons/opentrons/commit/079c2e9))





## [3.21.1](https://github.com/Opentrons/opentrons/compare/v3.21.0...v3.21.1) (2020-10-14)


### Features

* **app:** allow app update pop-up notifications to be disabled ([#6715](https://github.com/Opentrons/opentrons/issues/6715)) ([7982d5f](https://github.com/Opentrons/opentrons/commit/7982d5f)), closes [#6684](https://github.com/Opentrons/opentrons/issues/6684)





# [3.21.0](https://github.com/Opentrons/opentrons/compare/v3.20.1...v3.21.0) (2020-09-30)


### Bug Fixes

* **app:** do not set the user's Intercom name to "Unknown User" ([#6468](https://github.com/Opentrons/opentrons/issues/6468)) ([66662a4](https://github.com/Opentrons/opentrons/commit/66662a4)), closes [#6461](https://github.com/Opentrons/opentrons/issues/6461)
* **app:** Ensure cal check exit button on the title modal only displays if there is no primary exit ([#6616](https://github.com/Opentrons/opentrons/issues/6616)) ([88bb0a8](https://github.com/Opentrons/opentrons/commit/88bb0a8))
* **app:** fix layout of calibration panel complete confirmation button ([#6509](https://github.com/Opentrons/opentrons/issues/6509)) ([093bddb](https://github.com/Opentrons/opentrons/commit/093bddb))
* **app:** flip modules on deck map when in slots 3, 6, or 9 ([#6383](https://github.com/Opentrons/opentrons/issues/6383)) ([d0347da](https://github.com/Opentrons/opentrons/commit/d0347da)), closes [#4422](https://github.com/Opentrons/opentrons/issues/4422)
* **app:** make cal commands chain instead of race ([#6561](https://github.com/Opentrons/opentrons/issues/6561)) ([20f01bc](https://github.com/Opentrons/opentrons/commit/20f01bc)), closes [#6535](https://github.com/Opentrons/opentrons/issues/6535)
* **app:** make tip length calibration use generic calibration move to tiprack command ([#6489](https://github.com/Opentrons/opentrons/issues/6489)) ([b5a59e0](https://github.com/Opentrons/opentrons/commit/b5a59e0))
* **app:** properly enable/disable robot update from file button ([#6483](https://github.com/Opentrons/opentrons/issues/6483)) ([a996cdc](https://github.com/Opentrons/opentrons/commit/a996cdc)), closes [#5429](https://github.com/Opentrons/opentrons/issues/5429)
* **app:** sync robot time with app time on connect ([#6501](https://github.com/Opentrons/opentrons/issues/6501)) ([66dc626](https://github.com/Opentrons/opentrons/commit/66dc626)), closes [#3872](https://github.com/Opentrons/opentrons/issues/3872)
* **app:** temporary fix for chained command race conditions in cal flows to unblock user testing ([#6530](https://github.com/Opentrons/opentrons/issues/6530)) ([3c17d9e](https://github.com/Opentrons/opentrons/commit/3c17d9e))
* **app, app-shell:** use mtime for custom labware date display ([#6396](https://github.com/Opentrons/opentrons/issues/6396)) ([45f7ec8](https://github.com/Opentrons/opentrons/commit/45f7ec8)), closes [#6381](https://github.com/Opentrons/opentrons/issues/6381)


### Features

* **app:** add Jupyter Notebook button to robot's Advanced Settings ([#6474](https://github.com/Opentrons/opentrons/issues/6474)) ([d615d2d](https://github.com/Opentrons/opentrons/commit/d615d2d)), closes [#6102](https://github.com/Opentrons/opentrons/issues/6102)
* **app:** rename base -> block for TC copy ([#6524](https://github.com/Opentrons/opentrons/issues/6524)) ([abd6b65](https://github.com/Opentrons/opentrons/commit/abd6b65)), closes [#6086](https://github.com/Opentrons/opentrons/issues/6086)
* **robot-server,app:** add download deck calibration button ([#6453](https://github.com/Opentrons/opentrons/issues/6453)) ([b3b365d](https://github.com/Opentrons/opentrons/commit/b3b365d)), closes [#6055](https://github.com/Opentrons/opentrons/issues/6055)





## [3.20.1](https://github.com/Opentrons/opentrons/compare/v3.20.0...v3.20.1) (2020-08-25)

### Bug Fixes

* **api, app:** Ensure index file exists before reading from it ([#6410](https://github.com/Opentrons/opentrons/issues/6410)) ([d616d0b](https://github.com/Opentrons/opentrons/commit/d616d0b)), closes [#6394](https://github.com/Opentrons/opentrons/issues/6394)





# [3.20.0](https://github.com/Opentrons/opentrons/compare/v3.19.0...v3.20.0) (2020-08-13)

### Bug Fixes

* **app:** fix tip probe button in apiV1 protocols ([#6318](https://github.com/Opentrons/opentrons/issues/6318)) ([3b75f5d](https://github.com/Opentrons/opentrons/commit/3b75f5d))
* **app:** fix labware list uniqueing logic for file info page ([#6309](https://github.com/Opentrons/opentrons/issues/6309)) ([ca85b7e](https://github.com/Opentrons/opentrons/commit/ca85b7e))
* **api, app:** Clear instrument offset before performing deck calibration, don't restart ([#6208](https://github.com/Opentrons/opentrons/issues/6208)) ([cefa633](https://github.com/Opentrons/opentrons/commit/cefa633)), closes [#5022](https://github.com/Opentrons/opentrons/issues/5022)
* **app:** correctly namespace calibration check command ([#6127](https://github.com/Opentrons/opentrons/issues/6127)) ([59faac6](https://github.com/Opentrons/opentrons/commit/59faac6))
* **app:** don't doublecount labware on modules ([#6246](https://github.com/Opentrons/opentrons/issues/6246)) ([837f153](https://github.com/Opentrons/opentrons/commit/837f153))
* **app:** fix calibrate to trough bottom image for multi pipettes ([#5974](https://github.com/Opentrons/opentrons/issues/5974)) ([dac535f](https://github.com/Opentrons/opentrons/commit/dac535f)), closes [#4734](https://github.com/Opentrons/opentrons/issues/4734)
* **app:** fix data reads from JSON Protocols later than v3 ([#6284](https://github.com/Opentrons/opentrons/issues/6284)) ([f0f7109](https://github.com/Opentrons/opentrons/commit/f0f7109)), closes [#6235](https://github.com/Opentrons/opentrons/issues/6235)
* **app:** show alert if WS closes **or** robot becomes unhealthy ([#6233](https://github.com/Opentrons/opentrons/issues/6233)) ([2cd4fd1](https://github.com/Opentrons/opentrons/commit/2cd4fd1))
* **app:** simplify discovery state to avoid stale IPs and health data ([#6193](https://github.com/Opentrons/opentrons/issues/6193)) ([0e089a7](https://github.com/Opentrons/opentrons/commit/0e089a7)), closes [#5985](https://github.com/Opentrons/opentrons/issues/5985) [#5250](https://github.com/Opentrons/opentrons/issues/5250)
* **app:** update link to support center ([#6087](https://github.com/Opentrons/opentrons/issues/6087)) ([be05ef9](https://github.com/Opentrons/opentrons/commit/be05ef9))
* **robot-server, app:** fix broken chained commands in tip length cal ([#6212](https://github.com/Opentrons/opentrons/issues/6212)) ([727ba64](https://github.com/Opentrons/opentrons/commit/727ba64))


### Features

* **app:** Expose Labware Calibration Status on the FileInfo Page ([#6100](https://github.com/Opentrons/opentrons/issues/6100)) ([2a22f59](https://github.com/Opentrons/opentrons/commit/2a22f59))
* **components:** add primitive btns and fix useHover on disabled buttons ([#5972](https://github.com/Opentrons/opentrons/issues/5972)) ([57cc219](https://github.com/Opentrons/opentrons/commit/57cc219))
* **robot-server:** Robot server command namespaces ([#6098](https://github.com/Opentrons/opentrons/issues/6098)) ([73152e3](https://github.com/Opentrons/opentrons/commit/73152e3)), closes [#6089](https://github.com/Opentrons/opentrons/issues/6089)





# [3.19.0](https://github.com/Opentrons/opentrons/compare/v3.18.1...v3.19.0) (2020-06-29)


### Bug Fixes

* **app:** fix clunky text wrapping for multi tip pick up in cal check ([#6026](https://github.com/Opentrons/opentrons/issues/6026)) ([76edd1d](https://github.com/Opentrons/opentrons/commit/76edd1d))
* **app:** calcheck: content fixups ([#5989](https://github.com/Opentrons/opentrons/issues/5989)) ([21b5e4e](https://github.com/Opentrons/opentrons/commit/21b5e4e))
* **app:** calcheck: fix display of bad deck transform ([#5988](https://github.com/Opentrons/opentrons/issues/5988)) ([22b15ff](https://github.com/Opentrons/opentrons/commit/22b15ff))
* **app:** replace wrong assets for xy multi cal check ([#5996](https://github.com/Opentrons/opentrons/issues/5996)) ([072062d](https://github.com/Opentrons/opentrons/commit/072062d))
* **app:** clear <input> value after robot update file select ([#5789](https://github.com/Opentrons/opentrons/issues/5789)) ([62372b0](https://github.com/Opentrons/opentrons/commit/62372b0)), closes [#5781](https://github.com/Opentrons/opentrons/issues/5781)
* **app:** delete local records of session if id not found  ([#5863](https://github.com/Opentrons/opentrons/issues/5863)) ([9f8adfb](https://github.com/Opentrons/opentrons/commit/9f8adfb))
* **app:** fix cal check tiprack images at large window sizes ([#5841](https://github.com/Opentrons/opentrons/issues/5841)) ([065ce49](https://github.com/Opentrons/opentrons/commit/065ce49))
* **app:** fix up calibration check copy ([#5779](https://github.com/Opentrons/opentrons/issues/5779)) ([57b9ca8](https://github.com/Opentrons/opentrons/commit/57b9ca8))
* **app:** interpolate session type into session exit event name ([#5804](https://github.com/Opentrons/opentrons/issues/5804)) ([bee8cb0](https://github.com/Opentrons/opentrons/commit/bee8cb0))
* **app:** restart MDNS browser when network interfaces change ([#5933](https://github.com/Opentrons/opentrons/issues/5933)) ([c9c6dc8](https://github.com/Opentrons/opentrons/commit/c9c6dc8)), closes [#5343](https://github.com/Opentrons/opentrons/issues/5343)
* **app:** use troubleshooting link when calcheck fails at tip pickup ([#5952](https://github.com/Opentrons/opentrons/issues/5952)) ([474c98f](https://github.com/Opentrons/opentrons/commit/474c98f))


### Features

* **api, app:** Check Robot Deck Transform ([#5845](https://github.com/Opentrons/opentrons/issues/5845)) ([ed67383](https://github.com/Opentrons/opentrons/commit/ed67383))
* **api, app:** implement automatic door safety stop feature ([#5706](https://github.com/Opentrons/opentrons/issues/5706)) ([ad94d07](https://github.com/Opentrons/opentrons/commit/ad94d07)), closes [#2820](https://github.com/Opentrons/opentrons/issues/2820) [#2752](https://github.com/Opentrons/opentrons/issues/2752)
* **app:** add network interface collection to system-info ([#5764](https://github.com/Opentrons/opentrons/issues/5764)) ([7d64efa](https://github.com/Opentrons/opentrons/commit/7d64efa)), closes [#5397](https://github.com/Opentrons/opentrons/issues/5397)
* **app:** introduce Robot Calibration Check tool ([#5960](https://github.com/Opentrons/opentrons/issues/5960)) ([bc7d5d5](https://github.com/Opentrons/opentrons/commit/bc7d5d5))
* **app, app-shell:** add ability to disable discovery cache ([#5759](https://github.com/Opentrons/opentrons/issues/5759)) ([5ad57d9](https://github.com/Opentrons/opentrons/commit/5ad57d9))
* **components:** add position props to primitive components ([#5926](https://github.com/Opentrons/opentrons/issues/5926)) ([9b0a666](https://github.com/Opentrons/opentrons/commit/9b0a666))
* **js:** update lodash to 4.17.15 ([#5788](https://github.com/Opentrons/opentrons/issues/5788)) ([5a145dc](https://github.com/Opentrons/opentrons/commit/5a145dc))




## [3.18.1](https://github.com/Opentrons/opentrons/compare/v3.18.0...v3.18.1) (2020-05-26)


### Bug Fixes

* **app:** workaround issues with Realtek's website and driver versions ([67d6d89](https://github.com/Opentrons/opentrons/commit/67d6d89))





# [3.18.0](https://github.com/Opentrons/opentrons/compare/v3.17.1...v3.18.0) (2020-05-20)


### Bug Fixes

* **app:** tighten filter logic that identifies Realtek U2E adapters ([#5707](https://github.com/Opentrons/opentrons/issues/5707)) ([ea9a6c4](https://github.com/Opentrons/opentrons/commit/ea9a6c4))


### Features

* **api, app:** add state change information to rpc ([#5512](https://github.com/Opentrons/opentrons/issues/5512)) ([ca3ef95](https://github.com/Opentrons/opentrons/commit/ca3ef95)), closes [#5502](https://github.com/Opentrons/opentrons/issues/5502)
* **app:** add UI to clear cached robots ([#5629](https://github.com/Opentrons/opentrons/issues/5629)) ([330acc0](https://github.com/Opentrons/opentrons/commit/330acc0)), closes [#2435](https://github.com/Opentrons/opentrons/issues/2435)
* **app:** alert user if Windows U2E driver is out of date ([#5656](https://github.com/Opentrons/opentrons/issues/5656)) ([02cd054](https://github.com/Opentrons/opentrons/commit/02cd054)), closes [#5493](https://github.com/Opentrons/opentrons/issues/5493)
* **app:** collect pipette and module load analytics from protocol runs' ([#5675](https://github.com/Opentrons/opentrons/issues/5675)) ([11feca3](https://github.com/Opentrons/opentrons/commit/11feca3)), closes [#5540](https://github.com/Opentrons/opentrons/issues/5540)
* **app,robot-server:** add support for sessions API ([#5628](https://github.com/Opentrons/opentrons/issues/5628)) ([441d682](https://github.com/Opentrons/opentrons/commit/441d682))
* **components:** add Box primitive to components library ([#5665](https://github.com/Opentrons/opentrons/issues/5665)) ([73614d0](https://github.com/Opentrons/opentrons/commit/73614d0))
* **components:** add Flex and Text primitives to components library ([#5637](https://github.com/Opentrons/opentrons/issues/5637)) ([b1b318e](https://github.com/Opentrons/opentrons/commit/b1b318e))





## [3.17.1](https://github.com/Opentrons/opentrons/compare/v3.17.0...v3.17.1) (2020-05-06)

### Bug Fixes

* **app:** ensure only one RPC connect request can go out at once ([#5322](https://github.com/Opentrons/opentrons/issues/5322)) ([9465cef](https://github.com/Opentrons/opentrons/commit/9465cef)), closes [#5241](https://github.com/Opentrons/opentrons/issues/5241) [#5307](https://github.com/Opentrons/opentrons/issues/5307)


### Features

* **app:** guide the user through leveling gen2 multis ([#5348](https://github.com/Opentrons/opentrons/issues/5348)) ([185d0ad](https://github.com/Opentrons/opentrons/commit/185d0ad)), closes [#5344](https://github.com/Opentrons/opentrons/issues/5344)





# [3.17.0](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.1...v3.17.0) (2020-04-23)

**Note:** Version bump only for package @opentrons/app





# [3.17.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.17.0-beta.0...v3.17.0-beta.1) (2020-04-14)

**Note:** Version bump only for package @opentrons/app





# [3.17.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.16.1...v3.17.0-beta.0) (2020-04-01)

### Bug Fixes

* **app:** alignment and time formatting in thermocycler card ([#5320](https://github.com/Opentrons/opentrons/issues/5320)) ([3c7fcc8](https://github.com/Opentrons/opentrons/commit/3c7fcc8))
* **app:** fix tiprack in tip probe instructions when tipracks are shared ([#5319](https://github.com/Opentrons/opentrons/issues/5319)) ([7d5f4ab](https://github.com/Opentrons/opentrons/commit/7d5f4ab)), closes [#5311](https://github.com/Opentrons/opentrons/issues/5311)
* **app:** accept mixed-case extensions for protocols and custom labware ([#5153](https://github.com/Opentrons/opentrons/issues/5153)) ([12cce54](https://github.com/Opentrons/opentrons/commit/12cce54)), closes [#5151](https://github.com/Opentrons/opentrons/issues/5151)
* **app:** build RPC pipette tip rack list from both containers and instruments ([#5147](https://github.com/Opentrons/opentrons/issues/5147)) ([2c5fc9f](https://github.com/Opentrons/opentrons/commit/2c5fc9f))
* **app:** Deck cal: Tell users to attach an Opentrons tip, not a GEB tip. ([#5048](https://github.com/Opentrons/opentrons/issues/5048)) ([336bb17](https://github.com/Opentrons/opentrons/commit/336bb17))
* **app:** disable module commands when protocol paused ([#5209](https://github.com/Opentrons/opentrons/issues/5209)) ([b313c95](https://github.com/Opentrons/opentrons/commit/b313c95))


### Features

* **api:** updated images for all modules ([#5210](https://github.com/Opentrons/opentrons/issues/5210)) ([7e80a5b](https://github.com/Opentrons/opentrons/commit/7e80a5b)), closes [#4224](https://github.com/Opentrons/opentrons/issues/4224)
* **app:** add Wi-Fi disconnect to app ([#5296](https://github.com/Opentrons/opentrons/issues/5296)) ([f6620ee](https://github.com/Opentrons/opentrons/commit/f6620ee))
* **app:** enable gen2 multi pipettes ([#5297](https://github.com/Opentrons/opentrons/issues/5297)) ([707f0ab](https://github.com/Opentrons/opentrons/commit/707f0ab)), closes [#4698](https://github.com/Opentrons/opentrons/issues/4698)
* **app:** report PAPI version during protocol analytics events ([#5053](https://github.com/Opentrons/opentrons/issues/5053)) ([493a2ea](https://github.com/Opentrons/opentrons/commit/493a2ea)), closes [#4971](https://github.com/Opentrons/opentrons/issues/4971)
* **app, components:** Support gen2 modules ([#5177](https://github.com/Opentrons/opentrons/issues/5177)) ([3a938ff](https://github.com/Opentrons/opentrons/commit/3a938ff)), closes [#4960](https://github.com/Opentrons/opentrons/issues/4960)
* **js:** update Formik to v2 ([#5190](https://github.com/Opentrons/opentrons/issues/5190)) ([b15d360](https://github.com/Opentrons/opentrons/commit/b15d360))





## [3.16.1](https://github.com/opentrons/opentrons/compare/v3.16.0...v3.16.1) (2020-02-25)

**Note:** Version bump only for package @opentrons/app





# [3.16.0](https://github.com/Opentrons/opentrons/compare/v3.15.2...v3.16.0) (2020-02-19)

### Bug Fixes

* **app:** add spinner to "Save" button in Pipette Settings ([#4685](https://github.com/Opentrons/opentrons/issues/4685)) ([b8a9aac](https://github.com/Opentrons/opentrons/commit/b8a9aac)), closes [#4583](https://github.com/Opentrons/opentrons/issues/4583)
* **app:** clear lw calibration state if top level home is called ([#4703](https://github.com/Opentrons/opentrons/issues/4703)) ([8fe7120](https://github.com/Opentrons/opentrons/commit/8fe7120))
* **app:** home all axes after lw calibration to allow deck access ([#4687](https://github.com/Opentrons/opentrons/issues/4687)) ([6e0ad61](https://github.com/Opentrons/opentrons/commit/6e0ad61)), closes [#4034](https://github.com/Opentrons/opentrons/issues/4034)


### Features

* **app:** allow custom labware dir to be opened and reset to default ([#4918](https://github.com/Opentrons/opentrons/issues/4918)) ([03c438a](https://github.com/Opentrons/opentrons/commit/03c438a)), closes [#4878](https://github.com/Opentrons/opentrons/issues/4878) [#4879](https://github.com/Opentrons/opentrons/issues/4879)
* **app:** enable module firmware update button when update available ([#4923](https://github.com/Opentrons/opentrons/issues/4923)) ([1edc587](https://github.com/Opentrons/opentrons/commit/1edc587)), closes [#4575](https://github.com/Opentrons/opentrons/issues/4575)





## [3.15.2](https://github.com/opentrons/opentrons/compare/v3.15.1...v3.15.2) (2019-12-17)


### Bug Fixes

* **app:** disable tip probe for unused pipettes ([#4584](https://github.com/Opentrons/opentrons/issues/4584)) ([9388391](https://github.com/Opentrons/opentrons/commit/9388391)), closes [#4570](https://github.com/Opentrons/opentrons/issues/4570)
* **app:** naïve loading state for tc open lid during lw cal ([#4616](https://github.com/Opentrons/opentrons/issues/4616)) ([c4a4cdf](https://github.com/Opentrons/opentrons/commit/c4a4cdf))


### Features

* **app:** add link to docs in resources card ([#4606](https://github.com/Opentrons/opentrons/issues/4606)) ([21ec9ff](https://github.com/Opentrons/opentrons/commit/21ec9ff))





## [3.15.1](https://github.com/Opentrons/opentrons/compare/v3.15.0...v3.15.1) (2019-12-09)

**Note:** Version bump only for package @opentrons/app





# [3.15.0](https://github.com/Opentrons/opentrons/compare/v3.14.1...v3.15.0) (2019-12-05)



### Features

* **app:** add simple aggregate event tracking for custom labware ([#4544](https://github.com/Opentrons/opentrons/issues/4544)) ([b4fd536](https://github.com/Opentrons/opentrons/commit/b4fd536)), closes [#4537](https://github.com/Opentrons/opentrons/issues/4537)
* **app:** put bundle upload + exec under ff ([#4541](https://github.com/Opentrons/opentrons/issues/4541)) ([9023d95](https://github.com/Opentrons/opentrons/commit/9023d95))
* **app:** enable custom labware management in the app ([#4525](https://github.com/Opentrons/opentrons/issues/4525)) ([e1c9958](https://github.com/Opentrons/opentrons/commit/e1c9958))
* **app:** Display robot and protocol api versions ([#4502](https://github.com/Opentrons/opentrons/issues/4502)) ([00f333e](https://github.com/Opentrons/opentrons/commit/00f333e)), closes [#4362](https://github.com/Opentrons/opentrons/issues/4362)
* **app:** parse subnest out of CIDR-notation IP address ([#4372](https://github.com/Opentrons/opentrons/issues/4372)) ([ac74c12](https://github.com/Opentrons/opentrons/commit/ac74c12)), closes [#4075](https://github.com/Opentrons/opentrons/issues/4075)
* **app,api:** allow rich version specification for python protocols ([#4358](https://github.com/Opentrons/opentrons/issues/4358)) ([b0adef5](https://github.com/Opentrons/opentrons/commit/b0adef5)), closes [#4338](https://github.com/Opentrons/opentrons/issues/4338)
* **protocol-designer:** show special-case warning for north/south ([#4361](https://github.com/Opentrons/opentrons/issues/4361)) ([86912e8](https://github.com/Opentrons/opentrons/commit/86912e8)), closes [#4332](https://github.com/Opentrons/opentrons/issues/4332)


### Bug Fixes

* **api:** ensure load name is attached to RPC "containers" ([#4530](https://github.com/Opentrons/opentrons/issues/4530)) ([4580aa4](https://github.com/Opentrons/opentrons/commit/4580aa4))
* **app:** consolidate nav state to disable calibrate link on file info page ([#4514](https://github.com/Opentrons/opentrons/issues/4514)) ([842f15c](https://github.com/Opentrons/opentrons/commit/842f15c))
* **app:** Call correct create method depending on protocol ([#4509](https://github.com/Opentrons/opentrons/issues/4509)) ([a3ec421](https://github.com/Opentrons/opentrons/commit/a3ec421)), closes [#4202](https://github.com/Opentrons/opentrons/issues/4202)
* **app:** display robot ip not robot ip subnet base ([#4411](https://github.com/Opentrons/opentrons/issues/4411)) ([57cdfee](https://github.com/Opentrons/opentrons/commit/57cdfee)), closes [#4372](https://github.com/Opentrons/opentrons/issues/4372)
* **app:** prevent user from proceeding if uploaded protocol has no steps ([#4381](https://github.com/Opentrons/opentrons/issues/4381)) ([a8344e9](https://github.com/Opentrons/opentrons/commit/a8344e9)), closes [#3121](https://github.com/Opentrons/opentrons/issues/3121)
* **app-shell:** improve context menu and log handling ([#4472](https://github.com/Opentrons/opentrons/issues/4472)) ([de15135](https://github.com/Opentrons/opentrons/commit/de15135)), closes [#4293](https://github.com/Opentrons/opentrons/issues/4293)
* **app,api:** display session error messages in SessionAlert ([#4378](https://github.com/Opentrons/opentrons/issues/4378)) ([19d3e00](https://github.com/Opentrons/opentrons/commit/19d3e00)), closes [#4367](https://github.com/Opentrons/opentrons/issues/4367)



## [3.14.1](https://github.com/Opentrons/opentrons/compare/v3.14.0...v3.14.1) (2019-11-11)

**Note:** Version bump only for package @opentrons/app





# [3.14.0](https://github.com/Opentrons/opentrons/compare/v3.13.2...v3.14.0) (2019-10-31)

### Features

* **app:** allow inexact cross-generational pipette compatibility ([#4311](https://github.com/Opentrons/opentrons/issues/4311)) ([95dae6a](https://github.com/Opentrons/opentrons/commit/95dae6a)), closes [#3598](https://github.com/Opentrons/opentrons/issues/3598)
* **app:** allow p1000 gen2 to fallback to specced p1000 gen1 ([#4316](https://github.com/Opentrons/opentrons/issues/4316)) ([0e33f65](https://github.com/Opentrons/opentrons/commit/0e33f65)), closes [#3598](https://github.com/Opentrons/opentrons/issues/3598)
* **app:** add robot restart alert for FF changes that require restart ([#4285](https://github.com/Opentrons/opentrons/issues/4285)) ([96408a1](https://github.com/Opentrons/opentrons/commit/96408a1))
* **app:** Enable GEN2 pipettes ([#4297](https://github.com/Opentrons/opentrons/issues/4297)) ([f9d2c3b](https://github.com/Opentrons/opentrons/commit/f9d2c3b)), closes [#3601](https://github.com/Opentrons/opentrons/issues/3601)
* **app:** improve modules on run tab, enable module temp control for tc and td ([#4172](https://github.com/Opentrons/opentrons/issues/4172)) ([c11de69](https://github.com/Opentrons/opentrons/commit/c11de69)), closes [#4021](https://github.com/Opentrons/opentrons/issues/4021)
* **app:** restrict calibrate and run on incompatible pipettes ([#4185](https://github.com/Opentrons/opentrons/issues/4185)) ([02fcd4c](https://github.com/Opentrons/opentrons/commit/02fcd4c))





## [3.13.2](https://github.com/Opentrons/opentrons/compare/v3.13.1...v3.13.2) (2019-10-10)


### Bug Fixes

* **app:** fix broken back-compat for pre-3.13.x robots ([#4203](https://github.com/Opentrons/opentrons/issues/4203)) ([9243a8d](https://github.com/Opentrons/opentrons/commit/9243a8d)), closes [#4202](https://github.com/Opentrons/opentrons/issues/4202)





## [3.13.1](https://github.com/Opentrons/opentrons/compare/v3.13.0...v3.13.1) (2019-10-09)

**Note:** Version bump only for package @opentrons/app





# [3.13.0](https://github.com/Opentrons/opentrons/compare/v3.12.0...v3.13.0) (2019-10-02)

### Bug Fixes

* **app:** fix zip mimetype bug ([#4150](https://github.com/Opentrons/opentrons/issues/4150)) ([9f4c357](https://github.com/Opentrons/opentrons/commit/9f4c357))
* **app:** Disable run start button if missing modules ([#3994](https://github.com/Opentrons/opentrons/issues/3994)) ([5c75152](https://github.com/Opentrons/opentrons/commit/5c75152)), closes [#2676](https://github.com/Opentrons/opentrons/issues/2676)
* **app:** ensure gantry not blocking pcr seal placement ([#4071](https://github.com/Opentrons/opentrons/issues/4071)) ([01d6858](https://github.com/Opentrons/opentrons/commit/01d6858)), closes [#4034](https://github.com/Opentrons/opentrons/issues/4034)
* **app,labware-library:** Upgrade to react-router 5 and fix imports ([#4084](https://github.com/Opentrons/opentrons/issues/4084)) ([5595f8d](https://github.com/Opentrons/opentrons/commit/5595f8d))


### Features

* **app:** show spinner while robot logs are downloading ([#4158](https://github.com/Opentrons/opentrons/issues/4158)) ([cd50c42](https://github.com/Opentrons/opentrons/commit/cd50c42))
* **api:** support experimental bundle execution ([#4099](https://github.com/Opentrons/opentrons/issues/4099)) ([1c503ed](https://github.com/Opentrons/opentrons/commit/1c503ed))
* **components, app:** add custom pipette select with category support ([#3996](https://github.com/Opentrons/opentrons/issues/3996)) ([47f0713](https://github.com/Opentrons/opentrons/commit/47f0713))





# [3.12.0](https://github.com/Opentrons/opentrons/compare/v3.11.4....v3.12.0) (2019-09-13)

### Bug Fixes

* **api:** remove protocol file size limit and ack immediately ([#4006](https://github.com/Opentrons/opentrons/issues/4006)) ([2a82724](https://github.com/Opentrons/opentrons/commit/2a82724)), closes [#3998](https://github.com/Opentrons/opentrons/issues/3998)
* **app:** Add tip rack name to tip probe wizard instructions ([#3940](https://github.com/Opentrons/opentrons/issues/3940)) ([e053008](https://github.com/Opentrons/opentrons/commit/e053008))
* **app:** compensate for differences in app and robot clocks ([#3875](https://github.com/Opentrons/opentrons/issues/3875)) ([a3ee4eb](https://github.com/Opentrons/opentrons/commit/a3ee4eb)), closes [#3872](https://github.com/Opentrons/opentrons/issues/3872)
* **app:** Improve tip probe wizard state and error handling ([#3959](https://github.com/Opentrons/opentrons/issues/3959)) ([b88c73b](https://github.com/Opentrons/opentrons/commit/b88c73b)), closes [#3948](https://github.com/Opentrons/opentrons/issues/3948) [#3944](https://github.com/Opentrons/opentrons/issues/3944) [#3943](https://github.com/Opentrons/opentrons/issues/3943) [#2008](https://github.com/Opentrons/opentrons/issues/2008)
* **app:** make shell remote check lazier to avoid spurious assertions ([#3895](https://github.com/Opentrons/opentrons/issues/3895)) ([7aaad6d](https://github.com/Opentrons/opentrons/commit/7aaad6d))
* **app:** Remove incorrect data removal warning from change pipette ([#3942](https://github.com/Opentrons/opentrons/issues/3942)) ([27b315c](https://github.com/Opentrons/opentrons/commit/27b315c))


### Features

* **app:** display custom labware on deckmap ([#3891](https://github.com/Opentrons/opentrons/issues/3891)) ([f3ee4b3](https://github.com/Opentrons/opentrons/commit/f3ee4b3)), closes [#3826](https://github.com/Opentrons/opentrons/issues/3826)





## [3.11.4](https://github.com/Opentrons/opentrons/compare/v3.11.3...v3.11.4) (2019-08-29)

**Note:** Version bump only for package @opentrons/app





## [3.11.3](https://github.com/Opentrons/opentrons/compare/v3.11.2...v3.11.3) (2019-08-28)

**Note:** Version bump only for package @opentrons/app





## [3.11.2](https://github.com/Opentrons/opentrons/compare/v3.11.1...v3.11.2) (2019-08-21)


### Bug Fixes

* **app:** Fix regression breaking trash removal modal before tip probe ([f0d1da3](https://github.com/Opentrons/opentrons/commit/f0d1da3))





## [3.11.1](https://github.com/Opentrons/opentrons/compare/v3.11.0...v3.11.1) (2019-08-21)


### Bug Fixes

* **app:** Fix paths to BR premigration wheels on Windows ([0ff8638](https://github.com/Opentrons/opentrons/commit/0ff8638))





# [3.11.0](https://github.com/Opentrons/opentrons/compare/v3.10.3...v3.11.0) (2019-08-21)


### Bug Fixes

* **app:** eagerly fetch modules and instruments on robot connect ([#3854](https://github.com/Opentrons/opentrons/issues/3854)) ([88f5aec](https://github.com/Opentrons/opentrons/commit/88f5aec)), closes [#3844](https://github.com/Opentrons/opentrons/issues/3844)
* **app:** Remove Electron RPC remote objects from Redux state ([#3820](https://github.com/Opentrons/opentrons/issues/3820)) ([d5f3fe3](https://github.com/Opentrons/opentrons/commit/d5f3fe3))


### Features

* **app:** Add robot logging opt-out alert ([#3869](https://github.com/Opentrons/opentrons/issues/3869)) ([9ab6938](https://github.com/Opentrons/opentrons/commit/9ab6938))
* **app:** add control of modules to run cards ([#3841](https://github.com/Opentrons/opentrons/issues/3841)) ([9b34f9f](https://github.com/Opentrons/opentrons/commit/9b34f9f))
* **app:** display TC on Deck Map ([#3786](https://github.com/Opentrons/opentrons/issues/3786)) ([272a6ad](https://github.com/Opentrons/opentrons/commit/272a6ad)), closes [#3553](https://github.com/Opentrons/opentrons/issues/3553) [#3064](https://github.com/Opentrons/opentrons/issues/3064)
* **app:** Enable buildroot updates by default ([#3861](https://github.com/Opentrons/opentrons/issues/3861)) ([bf68ad9](https://github.com/Opentrons/opentrons/commit/bf68ad9)), closes [#3822](https://github.com/Opentrons/opentrons/issues/3822)
* **app:** prompt to open TC lid before labware calibration ([#3853](https://github.com/Opentrons/opentrons/issues/3853)) ([2b7efbc](https://github.com/Opentrons/opentrons/commit/2b7efbc)), closes [#3066](https://github.com/Opentrons/opentrons/issues/3066)
* **app, api:** Key calibration by parent-type/labware-type combo ([#3800](https://github.com/Opentrons/opentrons/issues/3800)) ([ba0df67](https://github.com/Opentrons/opentrons/commit/ba0df67)), closes [#3775](https://github.com/Opentrons/opentrons/issues/3775)





<a name="3.10.3"></a>
## [3.10.3](https://github.com/Opentrons/opentrons/compare/v3.10.2...v3.10.3) (2019-07-26)

**Note:** Version bump only for package @opentrons/app




<a name="3.10.2"></a>
## [3.10.2](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.2) (2019-07-25)


### Features

* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)





<a name="3.10.1"></a>
## [3.10.1](https://github.com/Opentrons/opentrons/compare/v3.10.0...v3.10.1) (2019-07-19)


### Features

* **app:** add GEN2 images to change pipette ([#3734](https://github.com/Opentrons/opentrons/issues/3734)) ([1016c16](https://github.com/Opentrons/opentrons/commit/1016c16)), closes [#3630](https://github.com/Opentrons/opentrons/issues/3630)





<a name="3.10.0"></a>
# [3.10.0](https://github.com/Opentrons/opentrons/compare/v3.9.0...v3.10.0) (2019-07-15)


### Bug Fixes

* **app:** Add reservior calibration instruction support ([#3704](https://github.com/Opentrons/opentrons/issues/3704)) ([1464772](https://github.com/Opentrons/opentrons/commit/1464772))
* **app:** Do not swallow protocol run errors ([#3723](https://github.com/Opentrons/opentrons/issues/3723)) ([73d06d8](https://github.com/Opentrons/opentrons/commit/73d06d8)), closes [#1828](https://github.com/Opentrons/opentrons/issues/1828)
* **app:** Stop long labware names overflowing calibration screens ([#3715](https://github.com/Opentrons/opentrons/issues/3715)) ([22fd8ad](https://github.com/Opentrons/opentrons/commit/22fd8ad))
* **app,pd:** Truncate long labware names ([#3644](https://github.com/Opentrons/opentrons/issues/3644)) ([abe4bc7](https://github.com/Opentrons/opentrons/commit/abe4bc7)), closes [#3617](https://github.com/Opentrons/opentrons/issues/3617) [#2444](https://github.com/Opentrons/opentrons/issues/2444)


### Features

* **app:** add support for v2 labware ([#3590](https://github.com/Opentrons/opentrons/issues/3590)) ([0b74937](https://github.com/Opentrons/opentrons/commit/0b74937)), closes [#3451](https://github.com/Opentrons/opentrons/issues/3451)
* **app:** Get protocolDisplayData based on protocol schema ([#3531](https://github.com/Opentrons/opentrons/issues/3531)) ([ec69d84](https://github.com/Opentrons/opentrons/commit/ec69d84)), closes [#3494](https://github.com/Opentrons/opentrons/issues/3494)
* **protocol-designer:** load v3 protocols ([#3591](https://github.com/Opentrons/opentrons/issues/3591)) ([8a10ec6](https://github.com/Opentrons/opentrons/commit/8a10ec6)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336)
* **protocol-designer:** save v3 protocols ([#3588](https://github.com/Opentrons/opentrons/issues/3588)) ([40f3a9e](https://github.com/Opentrons/opentrons/commit/40f3a9e)), closes [#3336](https://github.com/Opentrons/opentrons/issues/3336) [#3414](https://github.com/Opentrons/opentrons/issues/3414)





<a name="3.9.0"></a>
# [3.9.0](https://github.com/Opentrons/opentrons/compare/v3.8.3...v3.9.0) (2019-05-29)


### Bug Fixes

* **app:** Allow valid pipette+ model names for display images ([#3413](https://github.com/Opentrons/opentrons/issues/3413)) ([1f77a08](https://github.com/Opentrons/opentrons/commit/1f77a08))
* **app:** Re-enable change pipette and pipette settings ([#3475](https://github.com/Opentrons/opentrons/issues/3475)) ([2419110](https://github.com/Opentrons/opentrons/commit/2419110))
* **app:** Verify attached/protocol pipettes ([#3458](https://github.com/Opentrons/opentrons/issues/3458)) ([20988b8](https://github.com/Opentrons/opentrons/commit/20988b8))


### Features

* **api:** Add G Code for pipette config in driver ([#3388](https://github.com/Opentrons/opentrons/issues/3388)) ([77fffa6](https://github.com/Opentrons/opentrons/commit/77fffa6))
* **app:** Enable pipette quirks in pipette config ([#3488](https://github.com/Opentrons/opentrons/issues/3488)) ([b17f568](https://github.com/Opentrons/opentrons/commit/b17f568))


<a name="3.8.3"></a>
## [3.8.3](https://github.com/Opentrons/opentrons/compare/v3.8.2...v3.8.3) (2019-04-30)

**Note:** Version bump only for package @opentrons/app

<a name="3.8.2"></a>
## [3.8.2](https://github.com/Opentrons/opentrons/compare/v3.8.1...v3.8.2) (2019-04-23)


### Bug Fixes

* **app:** Clear deck cal request states on wizard exit ([#3378](https://github.com/Opentrons/opentrons/issues/3378)) ([408b8aa](https://github.com/Opentrons/opentrons/commit/408b8aa))
* **app:** Disable manual ip double submit on enter keypress ([#3376](https://github.com/Opentrons/opentrons/issues/3376)) ([81291ca](https://github.com/Opentrons/opentrons/commit/81291ca))
* **app:** render correct image for vial and tube racks ([#3298](https://github.com/Opentrons/opentrons/issues/3298)) ([b9e1ebb](https://github.com/Opentrons/opentrons/commit/b9e1ebb)), closes [#3294](https://github.com/Opentrons/opentrons/issues/3294)


### Features

* **app:** Enable adding manual robot IP addresses in app settings ([#3284](https://github.com/Opentrons/opentrons/issues/3284)) ([c34fcfa](https://github.com/Opentrons/opentrons/commit/c34fcfa)), closes [#2741](https://github.com/Opentrons/opentrons/issues/2741)





<a name="3.8.1"></a>
## [3.8.1](https://github.com/Opentrons/opentrons/compare/v3.8.0...v3.8.1) (2019-03-29)


### Bug Fixes

* **app:** Fix modules not populating the modules card ([#3278](https://github.com/Opentrons/opentrons/issues/3278)) ([1fd936d](https://github.com/Opentrons/opentrons/commit/1fd936d))


### Features

* **protocol-designer:** update transfer form design ([#3221](https://github.com/Opentrons/opentrons/issues/3221)) ([775ec4b](https://github.com/Opentrons/opentrons/commit/775ec4b))





<a name="3.8.0"></a>
# [3.8.0](https://github.com/Opentrons/opentrons/compare/v3.7.0...v3.8.0) (2019-03-19)


### Features

* **app:** Enable pipette config modal and form ([#3202](https://github.com/Opentrons/opentrons/issues/3202)) ([49c1fe9](https://github.com/Opentrons/opentrons/commit/49c1fe9)), closes [#3112](https://github.com/Opentrons/opentrons/issues/3112)





<a name="3.7.0"></a>
# [3.7.0](https://github.com/Opentrons/opentrons/compare/v3.6.5...v3.7.0) (2019-02-19)


### Features

* **api:** pipette config plunger position ([#2999](https://github.com/Opentrons/opentrons/issues/2999)) ([cbd559a](https://github.com/Opentrons/opentrons/commit/cbd559a))
* **app:** Add robot pipettes, versions, FFs to mixpanel and intercom ([#3059](https://github.com/Opentrons/opentrons/issues/3059)) ([de4a15f](https://github.com/Opentrons/opentrons/commit/de4a15f)), closes [#3009](https://github.com/Opentrons/opentrons/issues/3009) [#3010](https://github.com/Opentrons/opentrons/issues/3010)
* **app:** Configure analytics to send Python and JSON protocol info ([#2946](https://github.com/Opentrons/opentrons/issues/2946)) ([22f419d](https://github.com/Opentrons/opentrons/commit/22f419d)), closes [#2615](https://github.com/Opentrons/opentrons/issues/2615) [#2618](https://github.com/Opentrons/opentrons/issues/2618)
* **app:** Enable new app update modal ([#3044](https://github.com/Opentrons/opentrons/issues/3044)) ([d36071e](https://github.com/Opentrons/opentrons/commit/d36071e))
* **app:** Replace P10 update warning with one for all pipettes ([#3043](https://github.com/Opentrons/opentrons/issues/3043)) ([9bd3eb2](https://github.com/Opentrons/opentrons/commit/9bd3eb2)), closes [#3011](https://github.com/Opentrons/opentrons/issues/3011)
* **protocol-designer:** use SelectField for change tip ([#3001](https://github.com/Opentrons/opentrons/issues/3001)) ([b477f34](https://github.com/Opentrons/opentrons/commit/b477f34)), closes [#2915](https://github.com/Opentrons/opentrons/issues/2915)





<a name="3.6.5"></a>
## [3.6.5](https://github.com/Opentrons/opentrons/compare/v3.6.4...v3.6.5) (2018-12-18)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.4"></a>
## [3.6.4](https://github.com/Opentrons/opentrons/compare/v3.6.3...v3.6.4) (2018-12-17)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.3"></a>
## [3.6.3](https://github.com/Opentrons/opentrons/compare/v3.6.2...v3.6.3) (2018-12-13)


### Features

* **app:** Add opt-in modal for new p10s ([#2816](https://github.com/Opentrons/opentrons/issues/2816)) ([cd69e19](https://github.com/Opentrons/opentrons/commit/cd69e19)), closes [#2793](https://github.com/Opentrons/opentrons/issues/2793)
* **app:** Display Python protocol metadata in the app ([#2805](https://github.com/Opentrons/opentrons/issues/2805)) ([f854953](https://github.com/Opentrons/opentrons/commit/f854953)), closes [#2617](https://github.com/Opentrons/opentrons/issues/2617)
* **app:** Implement clearer robot server upgrade/downgrade information ([#2807](https://github.com/Opentrons/opentrons/issues/2807)) ([d37e3aa](https://github.com/Opentrons/opentrons/commit/d37e3aa)), closes [#2401](https://github.com/Opentrons/opentrons/issues/2401)





<a name="3.6.2"></a>
## [3.6.2](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.2) (2018-12-11)


### Bug Fixes

* **app:** Show main nav notification dot for updatable connected robot ([#2801](https://github.com/Opentrons/opentrons/issues/2801)) ([6a67c86](https://github.com/Opentrons/opentrons/commit/6a67c86)), closes [#2642](https://github.com/Opentrons/opentrons/issues/2642)


### Features

* **protocol-designer:** enable sharing tip racks between pipettes ([#2753](https://github.com/Opentrons/opentrons/issues/2753)) ([45db100](https://github.com/Opentrons/opentrons/commit/45db100))





<a name="3.6.1"></a>
## [3.6.1](https://github.com/Opentrons/opentrons/compare/v3.6.0...v3.6.1) (2018-12-05)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0"></a>
# [3.6.0](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.1...v3.6.0) (2018-11-29)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0-beta.1"></a>
# [3.6.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.6.0-beta.0...v3.6.0-beta.1) (2018-11-27)

**Note:** Version bump only for package @opentrons/app





<a name="3.6.0-beta.0"></a>
# [3.6.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.5.1...v3.6.0-beta.0) (2018-11-13)


### Features

* **app:** Home pipette after tip probe confirmed ([#2586](https://github.com/Opentrons/opentrons/issues/2586)) ([3119379](https://github.com/Opentrons/opentrons/commit/3119379)), closes [#2544](https://github.com/Opentrons/opentrons/issues/2544)
* **app:** Implement new connectivity card ([#2608](https://github.com/Opentrons/opentrons/issues/2608)) ([a4b26a2](https://github.com/Opentrons/opentrons/commit/a4b26a2)), closes [#2555](https://github.com/Opentrons/opentrons/issues/2555)
* **app:** Track restart status in discovery state for better alerts ([#2639](https://github.com/Opentrons/opentrons/issues/2639)) ([b4ba600](https://github.com/Opentrons/opentrons/commit/b4ba600)), closes [#2516](https://github.com/Opentrons/opentrons/issues/2516)
* **shared-data:** support unversioned pipettes in JSON protocols ([#2605](https://github.com/Opentrons/opentrons/issues/2605)) ([9e84ff6](https://github.com/Opentrons/opentrons/commit/9e84ff6))





<a name="3.5.1"></a>
# [3.5.1](https://github.com/Opentrons/opentrons/compare/v3.5.0...v3.5.1) (2018-10-26)


### Bug Fixes

* **app:** Show the correct release notes for robot update ([#2560](https://github.com/Opentrons/opentrons/issues/2560)) ([7b0279c](https://github.com/Opentrons/opentrons/commit/7b0279c))


<a name="3.5.0"></a>
# [3.5.0](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.1...v3.5.0) (2018-10-25)


### Features

* **app:** Show all labware of same type as confirmed ([#2525](https://github.com/Opentrons/opentrons/issues/2525)) ([ab8fdd9](https://github.com/Opentrons/opentrons/commit/ab8fdd9)), closes [#2523](https://github.com/Opentrons/opentrons/issues/2523)





<a name="3.5.0-beta.1"></a>
# [3.5.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.5.0-beta.0...v3.5.0-beta.1) (2018-10-16)


### Bug Fixes

* **app:** Check semver validity of API returned version strings ([#2492](https://github.com/Opentrons/opentrons/issues/2492)) ([d9a48bf](https://github.com/Opentrons/opentrons/commit/d9a48bf))


### Features

* **app:** Move deck calibration to robot controls ([#2470](https://github.com/Opentrons/opentrons/issues/2470)) ([b6ef29c](https://github.com/Opentrons/opentrons/commit/b6ef29c)), closes [#2377](https://github.com/Opentrons/opentrons/issues/2377)





<a name="3.5.0-beta.0"></a>
# [3.5.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.4.0...v3.5.0-beta.0) (2018-10-11)


### Bug Fixes

* **app:** Allow portal to re-check for root element ([#2440](https://github.com/Opentrons/opentrons/issues/2440)) ([5930a34](https://github.com/Opentrons/opentrons/commit/5930a34))
* **app:** Use type for labware table, not name ([#2441](https://github.com/Opentrons/opentrons/issues/2441)) ([cf91003](https://github.com/Opentrons/opentrons/commit/cf91003)), closes [#2407](https://github.com/Opentrons/opentrons/issues/2407)
* **discovery-client:** Ensure IPs are actually de-duped ([#2404](https://github.com/Opentrons/opentrons/issues/2404)) ([928dcab](https://github.com/Opentrons/opentrons/commit/928dcab))


### Features

* **app:** Add release notes to robot update modals ([#2397](https://github.com/Opentrons/opentrons/issues/2397)) ([f5e5fd9](https://github.com/Opentrons/opentrons/commit/f5e5fd9)), closes [#2353](https://github.com/Opentrons/opentrons/issues/2353)
* **app:** Add upgrade and downgrade logic to robot updates ([#2376](https://github.com/Opentrons/opentrons/issues/2376)) ([d44386a](https://github.com/Opentrons/opentrons/commit/d44386a))
* **app:** Display reachable but non-connectable robots ([#2455](https://github.com/Opentrons/opentrons/issues/2455)) ([8785ea8](https://github.com/Opentrons/opentrons/commit/8785ea8)), closes [#2345](https://github.com/Opentrons/opentrons/issues/2345)
* **app:** Display unreachable robots in list ([#2434](https://github.com/Opentrons/opentrons/issues/2434)) ([9b47f2d](https://github.com/Opentrons/opentrons/commit/9b47f2d)), closes [#2344](https://github.com/Opentrons/opentrons/issues/2344)
* **app:** Only display instrument settings for selected robot ([#2406](https://github.com/Opentrons/opentrons/issues/2406)) ([9150e21](https://github.com/Opentrons/opentrons/commit/9150e21)), closes [#2362](https://github.com/Opentrons/opentrons/issues/2362)
* **app:** Prompt user to update app in robot update modal ([#2386](https://github.com/Opentrons/opentrons/issues/2386)) ([c389750](https://github.com/Opentrons/opentrons/commit/c389750)), closes [#2354](https://github.com/Opentrons/opentrons/issues/2354)
* **app:** Remove 'opentrons-' prefix in robot displayNames ([#2459](https://github.com/Opentrons/opentrons/issues/2459)) ([06f158a](https://github.com/Opentrons/opentrons/commit/06f158a)), closes [#2357](https://github.com/Opentrons/opentrons/issues/2357)
* **discovery-client:** Add mdns flag and health responses to services ([#2420](https://github.com/Opentrons/opentrons/issues/2420)) ([0c06d32](https://github.com/Opentrons/opentrons/commit/0c06d32))


### Performance Improvements

* **app:** Upgrade Electron to v3 and remove Node in renderer ([#2374](https://github.com/Opentrons/opentrons/issues/2374)) ([778b9af](https://github.com/Opentrons/opentrons/commit/778b9af))





<a name="3.4.0"></a>
# [3.4.0](https://github.com/Opentrons/opentrons/compare/v3.4.0-beta.0...v3.4.0) (2018-09-21)


### Bug Fixes

* **app:** Fix robot list scroll clipping ([#2288](https://github.com/Opentrons/opentrons/issues/2288)) ([28556ef](https://github.com/Opentrons/opentrons/commit/28556ef)), closes [#2046](https://github.com/Opentrons/opentrons/issues/2046)
* **app:** Open external links in browser instead of app window ([#2327](https://github.com/Opentrons/opentrons/issues/2327)) ([5bf5d5f](https://github.com/Opentrons/opentrons/commit/5bf5d5f))
* **app:** Prevent keypresses from changing jog jump size ([#2315](https://github.com/Opentrons/opentrons/issues/2315)) ([1b32d6d](https://github.com/Opentrons/opentrons/commit/1b32d6d))
* **app:** Wrap runscreen modals in portal ([#2308](https://github.com/Opentrons/opentrons/issues/2308)) ([aefad0a](https://github.com/Opentrons/opentrons/commit/aefad0a))


### Features

* **app:** Add release notes to app update modal ([#2316](https://github.com/Opentrons/opentrons/issues/2316)) ([745a1f8](https://github.com/Opentrons/opentrons/commit/745a1f8))
* **app:** Enable autoupdate on Linux by switching to AppImage builds ([#2329](https://github.com/Opentrons/opentrons/issues/2329)) ([caade74](https://github.com/Opentrons/opentrons/commit/caade74)), closes [#2303](https://github.com/Opentrons/opentrons/issues/2303)





<a name="3.4.0-beta.0"></a>
# [3.4.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.1-beta.0...v3.4.0-beta.0) (2018-09-14)


### Features

* **app:** Add protocol file info page ([#2221](https://github.com/Opentrons/opentrons/issues/2221)) ([e861365](https://github.com/Opentrons/opentrons/commit/e861365))
* **app:** Parse JSON protocols into state ([#2231](https://github.com/Opentrons/opentrons/issues/2231)) ([b5f3666](https://github.com/Opentrons/opentrons/commit/b5f3666))
* **app:** Populate FileInfo page with JSON protocol metadata ([#2278](https://github.com/Opentrons/opentrons/issues/2278)) ([995038a](https://github.com/Opentrons/opentrons/commit/995038a)), closes [#2129](https://github.com/Opentrons/opentrons/issues/2129)





<a name="3.3.1-beta.0"></a>
## [3.3.1-beta.0](https://github.com/Opentrons/opentrons/compare/v3.3.0...v3.3.1-beta.0) (2018-09-10)


### Bug Fixes

* **app:** Grab intercom handler from window on every call ([#2179](https://github.com/Opentrons/opentrons/issues/2179)) ([a90aaae](https://github.com/Opentrons/opentrons/commit/a90aaae))


### Features

* **app:** Add attached pipette info to intercom support ([#2140](https://github.com/Opentrons/opentrons/issues/2140)) ([b06e845](https://github.com/Opentrons/opentrons/commit/b06e845)), closes [#2019](https://github.com/Opentrons/opentrons/issues/2019)





<a name="3.3.0"></a>
# [3.3.0](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.1...v3.3.0) (2018-08-22)


### Bug Fixes

* **app:** Fix copy typos in update error modal ([#2027](https://github.com/Opentrons/opentrons/issues/2027)) ([37795ce](https://github.com/Opentrons/opentrons/commit/37795ce))


### Features

* **api:** publish module commands and make module data endpoint ([#2053](https://github.com/Opentrons/opentrons/issues/2053)) ([c25c081](https://github.com/Opentrons/opentrons/commit/c25c081)), closes [#1653](https://github.com/Opentrons/opentrons/issues/1653)
* **app:** Add persistent unique user ID to intercom data ([#2004](https://github.com/Opentrons/opentrons/issues/2004)) ([0a47d64](https://github.com/Opentrons/opentrons/commit/0a47d64)), closes [#1999](https://github.com/Opentrons/opentrons/issues/1999)
* **app:** Add robot name to intercom on connect ([#2069](https://github.com/Opentrons/opentrons/issues/2069)) ([f5be08d](https://github.com/Opentrons/opentrons/commit/f5be08d))
* **app:** Add update channel selector to advanced settings ([#2010](https://github.com/Opentrons/opentrons/issues/2010)) ([f7fb865](https://github.com/Opentrons/opentrons/commit/f7fb865))
* **app:** Add upload protocol warning modal ([#1988](https://github.com/Opentrons/opentrons/issues/1988)) ([8e010cf](https://github.com/Opentrons/opentrons/commit/8e010cf)), closes [#1032](https://github.com/Opentrons/opentrons/issues/1032)
* **app:** Enable download robot logs in advanced settings ([#2014](https://github.com/Opentrons/opentrons/issues/2014)) ([6e51ba0](https://github.com/Opentrons/opentrons/commit/6e51ba0)), closes [#1727](https://github.com/Opentrons/opentrons/issues/1727)
* **app:** Enable support for IPv4 wired robots by default ([#2090](https://github.com/Opentrons/opentrons/issues/2090)) ([d3a3afa](https://github.com/Opentrons/opentrons/commit/d3a3afa)), closes [#990](https://github.com/Opentrons/opentrons/issues/990) [#1964](https://github.com/Opentrons/opentrons/issues/1964)
* **app:** Persist known robots to file-system when using new discovery ([#2065](https://github.com/Opentrons/opentrons/issues/2065)) ([55b4000](https://github.com/Opentrons/opentrons/commit/55b4000))
* **app,api:** Add opt-in ping/pong monitoring to RPC websocket ([#2083](https://github.com/Opentrons/opentrons/issues/2083)) ([a9b3f0e](https://github.com/Opentrons/opentrons/commit/a9b3f0e)), closes [#2052](https://github.com/Opentrons/opentrons/issues/2052)





<a name="3.3.0-beta.1"></a>
# [3.3.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.3.0-beta.0...v3.3.0-beta.1) (2018-08-02)


### Bug Fixes

* **app:** Check if modulesRequired when displaying review modals ([#1940](https://github.com/Opentrons/opentrons/issues/1940)) ([14a54a5](https://github.com/Opentrons/opentrons/commit/14a54a5))


### Features

* **app:** Add and implement module selectors in calibration ([#1895](https://github.com/Opentrons/opentrons/issues/1895)) ([2cf1b4d](https://github.com/Opentrons/opentrons/commit/2cf1b4d))
* **app:** Add continuous polling to modules during run ([#1961](https://github.com/Opentrons/opentrons/issues/1961)) ([5f7d6f4](https://github.com/Opentrons/opentrons/commit/5f7d6f4))
* **app:** Add deck map to module review modal ([#1910](https://github.com/Opentrons/opentrons/issues/1910)) ([f2e63e3](https://github.com/Opentrons/opentrons/commit/f2e63e3)), closes [#1737](https://github.com/Opentrons/opentrons/issues/1737)
* **app:** Add realtime status TempDeck card to run panel ([#1932](https://github.com/Opentrons/opentrons/issues/1932)) ([75c8df4](https://github.com/Opentrons/opentrons/commit/75c8df4)), closes [#1740](https://github.com/Opentrons/opentrons/issues/1740)
* **app:** Add support for modules to RPC API client ([#1891](https://github.com/Opentrons/opentrons/issues/1891)) ([331305f](https://github.com/Opentrons/opentrons/commit/331305f))
* **app:** Render calibrate to bottom instructions when enabled ([#1865](https://github.com/Opentrons/opentrons/issues/1865)) ([c427599](https://github.com/Opentrons/opentrons/commit/c427599))
* **app:** Show connect modules modal when session modules detected ([#1897](https://github.com/Opentrons/opentrons/issues/1897)) ([8306130](https://github.com/Opentrons/opentrons/commit/8306130)), closes [#1738](https://github.com/Opentrons/opentrons/issues/1738)
* **app:** Show module name over labware on deckmaps ([#1913](https://github.com/Opentrons/opentrons/issues/1913)) ([c40905b](https://github.com/Opentrons/opentrons/commit/c40905b)), closes [#1739](https://github.com/Opentrons/opentrons/issues/1739)
* **app:** Show modules on review and calibration deckmaps ([#1898](https://github.com/Opentrons/opentrons/issues/1898)) ([5917a2b](https://github.com/Opentrons/opentrons/commit/5917a2b))
* **app:** Wire modules card to API calls (and keep stubbed response) ([#1860](https://github.com/Opentrons/opentrons/issues/1860)) ([a30912f](https://github.com/Opentrons/opentrons/commit/a30912f))





<a name="3.3.0-beta.0"></a>
# [3.3.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.3.0-beta.0) (2018-07-12)


### Bug Fixes

* **app:** Call GET /pipettes before starting calibration ([#1830](https://github.com/Opentrons/opentrons/issues/1830)) ([011a3a8](https://github.com/Opentrons/opentrons/commit/011a3a8))
* **app:** Disable calibration page unless protocol is fresh ([#1821](https://github.com/Opentrons/opentrons/issues/1821)) ([c9168c8](https://github.com/Opentrons/opentrons/commit/c9168c8)), closes [#1817](https://github.com/Opentrons/opentrons/issues/1817)
* **app:** Make WiFi card more lenient and understandable ([#1771](https://github.com/Opentrons/opentrons/issues/1771)) ([6f2f37d](https://github.com/Opentrons/opentrons/commit/6f2f37d))
* **app:** Remove holdover /calibrate/instruments missed by [#1765](https://github.com/Opentrons/opentrons/issues/1765) ([#1787](https://github.com/Opentrons/opentrons/issues/1787)) ([03dd305](https://github.com/Opentrons/opentrons/commit/03dd305))
* **app:** Remove tip-probed check in calibrator selector ([#1847](https://github.com/Opentrons/opentrons/issues/1847)) ([bb50677](https://github.com/Opentrons/opentrons/commit/bb50677))
* **app:** Show spinner during home on deck calibration exit ([#1760](https://github.com/Opentrons/opentrons/issues/1760)) ([b6999a8](https://github.com/Opentrons/opentrons/commit/b6999a8)), closes [#1613](https://github.com/Opentrons/opentrons/issues/1613)
* **components:** fix Deck component viewBox ([#1807](https://github.com/Opentrons/opentrons/issues/1807)) ([bff921f](https://github.com/Opentrons/opentrons/commit/bff921f))
* **components:** Make preventDefault call in HandleKeypress opt-in ([#1768](https://github.com/Opentrons/opentrons/issues/1768)) ([9e64fb2](https://github.com/Opentrons/opentrons/commit/9e64fb2)), closes [#1764](https://github.com/Opentrons/opentrons/issues/1764)


### Features

* **app:** Add advanced settings card to robot settings page ([#1762](https://github.com/Opentrons/opentrons/issues/1762)) ([b70f9b8](https://github.com/Opentrons/opentrons/commit/b70f9b8)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Add attached modules card UI to instrument settings page ([#1854](https://github.com/Opentrons/opentrons/issues/1854)) ([3a57807](https://github.com/Opentrons/opentrons/commit/3a57807)), closes [#1735](https://github.com/Opentrons/opentrons/issues/1735)
* **app:** Add GET /modules to API client ([#1837](https://github.com/Opentrons/opentrons/issues/1837)) ([da88936](https://github.com/Opentrons/opentrons/commit/da88936))
* **app:** Add keyboard shortcuts to jog controls ([#1761](https://github.com/Opentrons/opentrons/issues/1761)) ([7c51e98](https://github.com/Opentrons/opentrons/commit/7c51e98)), closes [#1476](https://github.com/Opentrons/opentrons/issues/1476)
* **app:** Add modules and pipettes settings page ([#1785](https://github.com/Opentrons/opentrons/issues/1785)) ([7ce12b3](https://github.com/Opentrons/opentrons/commit/7ce12b3))
* **app:** Add robot settings toggles to Advanced Settings card ([#1795](https://github.com/Opentrons/opentrons/issues/1795)) ([73f7528](https://github.com/Opentrons/opentrons/commit/73f7528)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
* **app:** Log tracebacks from failed RPC calls  ([#1846](https://github.com/Opentrons/opentrons/issues/1846)) ([0c07c52](https://github.com/Opentrons/opentrons/commit/0c07c52)), closes [#1841](https://github.com/Opentrons/opentrons/issues/1841)




<a name="3.2.0"></a>
# [3.2.0](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.3...v3.2.0) (2018-07-10)

**Note:** Version bump only for package @opentrons/app





<a name="3.2.0-beta.3"></a>
# [3.2.0-beta.3](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.2...v3.2.0-beta.3) (2018-06-25)


### Bug Fixes

* **app:** Fix overlay and redirect duplication in robot settings page ([#1759](https://github.com/Opentrons/opentrons/issues/1759)) ([ce94b22](https://github.com/Opentrons/opentrons/commit/ce94b22))
* **components:** Resize main navbar and title bar to match designs ([#1757](https://github.com/Opentrons/opentrons/issues/1757)) ([4d46011](https://github.com/Opentrons/opentrons/commit/4d46011)), closes [#1285](https://github.com/Opentrons/opentrons/issues/1285)





<a name="3.2.0-beta.2"></a>
# [3.2.0-beta.2](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.1...v3.2.0-beta.2) (2018-06-22)


### Features

* **app:** Connect home button to API on robot settings ([#1726](https://github.com/Opentrons/opentrons/issues/1726)) ([103d8c0](https://github.com/Opentrons/opentrons/commit/103d8c0)), closes [#856](https://github.com/Opentrons/opentrons/issues/856)





<a name="3.2.0-beta.1"></a>
# [3.2.0-beta.1](https://github.com/Opentrons/opentrons/compare/v3.2.0-beta.0...v3.2.0-beta.1) (2018-06-19)


### Bug Fixes

* **app:** Enable robot update even if API reports up-to-date ([#1721](https://github.com/Opentrons/opentrons/issues/1721)) ([16bb8eb](https://github.com/Opentrons/opentrons/commit/16bb8eb))
* **app:** Fix alignment issues in modals, fix titlebar on page ([#1719](https://github.com/Opentrons/opentrons/issues/1719)) ([ccf4881](https://github.com/Opentrons/opentrons/commit/ccf4881))
* **app:** Switch to hash routes to enable goBack in prod ([#1722](https://github.com/Opentrons/opentrons/issues/1722)) ([9bf2398](https://github.com/Opentrons/opentrons/commit/9bf2398))


### Features

* **app:** Add toggle to turn on/off robot rail lights ([#1710](https://github.com/Opentrons/opentrons/issues/1710)) ([d2c182c](https://github.com/Opentrons/opentrons/commit/d2c182c)), closes [#1684](https://github.com/Opentrons/opentrons/issues/1684)
* **app:** Show connect alert banner on successful connection ([#1700](https://github.com/Opentrons/opentrons/issues/1700)) ([70cd8b2](https://github.com/Opentrons/opentrons/commit/70cd8b2)), closes [#1314](https://github.com/Opentrons/opentrons/issues/1314)





<a name="3.2.0-beta.0"></a>
# [3.2.0-beta.0](https://github.com/Opentrons/opentrons/compare/v3.1.2...v3.2.0-beta.0) (2018-06-13)


### Bug Fixes

* **app:** Add priority 2 analytics events ([#1627](https://github.com/Opentrons/opentrons/issues/1627)) ([08e622e](https://github.com/Opentrons/opentrons/commit/08e622e)), closes [#1553](https://github.com/Opentrons/opentrons/issues/1553)
* **app:** Hide modal title in pick up tip spinner ([#1635](https://github.com/Opentrons/opentrons/issues/1635)) ([1509f1a](https://github.com/Opentrons/opentrons/commit/1509f1a)), closes [#1630](https://github.com/Opentrons/opentrons/issues/1630)
* **app:** Reset calibration state on reset run ([#1682](https://github.com/Opentrons/opentrons/issues/1682)) ([689e586](https://github.com/Opentrons/opentrons/commit/689e586)), closes [#1597](https://github.com/Opentrons/opentrons/issues/1597)
* **app:** Tip probe clears labware calibration progress ([#1634](https://github.com/Opentrons/opentrons/issues/1634)) ([9d216a4](https://github.com/Opentrons/opentrons/commit/9d216a4)), closes [#1620](https://github.com/Opentrons/opentrons/issues/1620)
* **app:** Update cancel button text ([#1644](https://github.com/Opentrons/opentrons/issues/1644)) ([c0870d8](https://github.com/Opentrons/opentrons/commit/c0870d8)), closes [#1639](https://github.com/Opentrons/opentrons/issues/1639)
* **app:** Update Z calibration slot 5 diagram ([#1638](https://github.com/Opentrons/opentrons/issues/1638)) ([35e50cb](https://github.com/Opentrons/opentrons/commit/35e50cb)), closes [#1608](https://github.com/Opentrons/opentrons/issues/1608)


### Features

* **app:** Add firmware version to robot settings page ([#1633](https://github.com/Opentrons/opentrons/issues/1633)) ([9a32383](https://github.com/Opentrons/opentrons/commit/9a32383))
* **app:** Add resources page to more section ([#1631](https://github.com/Opentrons/opentrons/issues/1631)) ([443afc0](https://github.com/Opentrons/opentrons/commit/443afc0)), closes [#1607](https://github.com/Opentrons/opentrons/issues/1607)
* **app:** Capture and display errors during deck calibration ([#1680](https://github.com/Opentrons/opentrons/issues/1680)) ([4f75ed7](https://github.com/Opentrons/opentrons/commit/4f75ed7)), closes [#1641](https://github.com/Opentrons/opentrons/issues/1641)
* **app:** Pass server-lib and firmware to /server/update ([#1679](https://github.com/Opentrons/opentrons/issues/1679)) ([4dc8a76](https://github.com/Opentrons/opentrons/commit/4dc8a76)), closes [#1115](https://github.com/Opentrons/opentrons/issues/1115)
* **app:** Toggle devtools feature flag in app settings ([#1678](https://github.com/Opentrons/opentrons/issues/1678)) ([6676903](https://github.com/Opentrons/opentrons/commit/6676903)), closes [#1632](https://github.com/Opentrons/opentrons/issues/1632)
