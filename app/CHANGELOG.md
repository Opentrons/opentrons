# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
