import type {
  CutoutId,
  CutoutFixtureId,
  AddressableAreaName,
} from '@opentrons/shared-data'

export interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
  requiredAddressableAreas: AddressableAreaName[]
}
