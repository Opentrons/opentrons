export type FlexAddressableAreaName =
  | 'D1'
  | 'D2'
  | 'D3'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'B4'
  | 'C4'
  | 'D4'
  | 'movableTrashA1'
  | 'movableTrashA3'
  | 'movableTrashB1'
  | 'movableTrashB3'
  | 'movableTrashC1'
  | 'movableTrashC3'
  | 'movableTrashD1'
  | 'movableTrashD3'
  | '1and8ChannelWasteChute'
  | '96ChannelWasteChute'
  | 'gripperWasteChute'

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

export type CutoutFixtureId =
  | SingleSlotCutoutFixtureId
  | StagingAreaRightSlotFixtureId
  | TrashBinAdapterCutoutFixtureId
  | WasteChuteCutoutFixtureId
  | 'stagingAreaRightSlot'
