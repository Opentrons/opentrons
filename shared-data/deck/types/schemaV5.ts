export type FlexAddressableAreaName =
  | 'A1'
  | 'B1'
  | 'C1'
  | 'D1'
  | 'A2'
  | 'B2'
  | 'C2'
  | 'D2'
  | 'A3'
  | 'B3'
  | 'C3'
  | 'D3'
  | 'A4'
  | 'B4'
  | 'C4'
  | 'D4'
  | 'movableTrashA1'
  | 'movableTrashB1'
  | 'movableTrashC1'
  | 'movableTrashD1'
  | 'movableTrashA3'
  | 'movableTrashB3'
  | 'movableTrashC3'
  | 'movableTrashD3'
  | '1ChannelWasteChute'
  | '8ChannelWasteChute'
  | '96ChannelWasteChute'
  | 'gripperWasteChute'
  | 'thermocyclerModule'
  | 'heaterShakerA1'
  | 'heaterShakerB1'
  | 'heaterShakerC1'
  | 'heaterShakerD1'
  | 'heaterShakerA3'
  | 'heaterShakerB3'
  | 'heaterShakerC3'
  | 'heaterShakerD3'
  | 'temperatureModuleA1'
  | 'temperatureModuleB1'
  | 'temperatureModuleC1'
  | 'temperatureModuleD1'
  | 'temperatureModuleA3'
  | 'temperatureModuleB3'
  | 'temperatureModuleC3'
  | 'temperatureModuleD3'

export type OT2AddressableAreaName =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | 'fixedTrash'

export type AddressableAreaName =
  | FlexAddressableAreaName
  | OT2AddressableAreaName

export type CutoutId =
  | 'cutoutD1'
  | 'cutoutD2'
  | 'cutoutD3'
  | 'cutoutC1'
  | 'cutoutC2'
  | 'cutoutC3'
  | 'cutoutB1'
  | 'cutoutB2'
  | 'cutoutB3'
  | 'cutoutA1'
  | 'cutoutA2'
  | 'cutoutA3'

export type OT2CutoutId =
  | 'cutout1'
  | 'cutout2'
  | 'cutout3'
  | 'cutout4'
  | 'cutout5'
  | 'cutout6'
  | 'cutout7'
  | 'cutout8'
  | 'cutout9'
  | 'cutout10'
  | 'cutout11'
  | 'cutout12'

export type SingleSlotCutoutFixtureId =
  | 'singleLeftSlot'
  | 'singleCenterSlot'
  | 'singleRightSlot'

export type StagingAreaRightSlotFixtureId = 'stagingAreaRightSlot'

export type TrashBinAdapterCutoutFixtureId = 'trashBinAdapter'

export type WasteChuteCutoutFixtureId =
  | 'wasteChuteRightAdapterCovered'
  | 'wasteChuteRightAdapterNoCover'
  | 'stagingAreaSlotWithWasteChuteRightAdapterCovered'
  | 'stagingAreaSlotWithWasteChuteRightAdapterNoCover'

export type FlexModuleCutoutFixtureId = 
  | 'heaterShakerModule'
  | 'temperatureModule'
  | 'magneticBlockModule'
  | 'thermocyclerModuleRear'
  | 'thermocyclerModuleFront'

export type OT2SingleStandardSlot = 'singleStandardSlot'

export type OT2FixedTrashSlot = 'fixedTrashSlot'

export type CutoutFixtureId =
  | SingleSlotCutoutFixtureId
  | StagingAreaRightSlotFixtureId
  | TrashBinAdapterCutoutFixtureId
  | WasteChuteCutoutFixtureId
  | FlexModuleCutoutFixtureId 
  | OT2SingleStandardSlot
  | OT2FixedTrashSlot
