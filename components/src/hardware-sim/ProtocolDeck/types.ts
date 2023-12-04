import {
  AddressableAreaName,
  CutoutConfig,
  CutoutFixtureId,
} from '@opentrons/shared-data'

export interface CutoutConfigProtocolSpec extends CutoutConfig {
  requiredAddressableAreas: AddressableAreaName[]
}
export interface CutoutConfigAndCompatibility extends CutoutConfigProtocolSpec {
  compatibleCutoutFixtureIds: CutoutFixtureId[]
}

export interface LabwareByLiquidId {
  [liquidId: string]: Array<{
    labwareId: string
    volumeByWell: { [well: string]: number }
  }>
}
