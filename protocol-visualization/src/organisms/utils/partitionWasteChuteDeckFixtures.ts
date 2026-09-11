import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import type {
  StagingAreaEntities,
  StagingAreaEntity,
  WasteChuteEntities,
  WasteChuteEntity,
} from '@opentrons/step-generation'

export interface WasteChuteDeckFixturePartitions {
  stagingAreaFixtures: StagingAreaEntity[]
  wasteChuteOnlyFixtures: WasteChuteEntity[]
  wasteChuteStagingAreaFixtures: StagingAreaEntity[]
}

/**
 * D4 (and other column-4) staging maps to cutoutD3, which is also the waste chute cutout.
 * Only render WasteChuteStagingAreaFixture when a waste chute entity is present.
 * Prefer the combined fixture over WasteChuteFixture + StagingAreaFixture when both apply.
 */
export function partitionWasteChuteDeckFixtures(
  stagingAreaEntities: StagingAreaEntities,
  wasteChuteEntities: WasteChuteEntities
): WasteChuteDeckFixturePartitions {
  const hasWasteChute = Object.keys(wasteChuteEntities).length > 0
  const stagingAreas = Object.values(stagingAreaEntities)
  const wasteChuteStagingAreaFixtures = hasWasteChute
    ? stagingAreas.filter(
        stagingArea => stagingArea.location === WASTE_CHUTE_CUTOUT
      )
    : []
  const wasteChuteStagingIds = new Set(
    wasteChuteStagingAreaFixtures.map(fixture => fixture.id)
  )
  const stagingAreaFixtures = stagingAreas.filter(
    stagingArea => !wasteChuteStagingIds.has(stagingArea.id)
  )
  const wasteChuteOnlyFixtures =
    wasteChuteStagingAreaFixtures.length > 0
      ? []
      : Object.values(wasteChuteEntities)

  return {
    stagingAreaFixtures,
    wasteChuteOnlyFixtures,
    wasteChuteStagingAreaFixtures,
  }
}
