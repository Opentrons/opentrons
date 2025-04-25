import type {
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
} from '@opentrons/shared-data'

export interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
  requiredAddressableAreas: AddressableAreaName[]
}
