import { describe, expect, it } from 'vitest'

import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { partitionWasteChuteDeckFixtures } from '../partitionWasteChuteDeckFixtures'

import type {
  StagingAreaEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'

const stagingAtD3: StagingAreaEntities = {
  'staging-d4': { id: 'staging-d4', location: WASTE_CHUTE_CUTOUT },
}

const stagingAtA3: StagingAreaEntities = {
  'staging-a4': { id: 'staging-a4', location: 'cutoutA3' },
}

const wasteChute: WasteChuteEntities = {
  'waste-1': {
    id: 'waste-1',
    location: WASTE_CHUTE_CUTOUT,
    pythonName: 'waste_chute',
  },
}

describe('partitionWasteChuteDeckFixtures', () => {
  it('does not treat D4 staging as waste chute when wasteChuteEntities is empty', () => {
    const result = partitionWasteChuteDeckFixtures(stagingAtD3, {})

    expect(result.wasteChuteStagingAreaFixtures).toEqual([])
    expect(result.wasteChuteOnlyFixtures).toEqual([])
    expect(result.stagingAreaFixtures).toEqual([stagingAtD3['staging-d4']])
  })

  it('uses waste chute staging fixture when waste chute and D3 staging are both present', () => {
    const result = partitionWasteChuteDeckFixtures(stagingAtD3, wasteChute)

    expect(result.wasteChuteStagingAreaFixtures).toEqual([
      stagingAtD3['staging-d4'],
    ])
    expect(result.wasteChuteOnlyFixtures).toEqual([])
    expect(result.stagingAreaFixtures).toEqual([])
  })

  it('uses waste chute only fixture when waste chute is present without D3 staging', () => {
    const result = partitionWasteChuteDeckFixtures(stagingAtA3, wasteChute)

    expect(result.wasteChuteStagingAreaFixtures).toEqual([])
    expect(result.wasteChuteOnlyFixtures).toEqual([wasteChute['waste-1']])
    expect(result.stagingAreaFixtures).toEqual([stagingAtA3['staging-a4']])
  })

  it('returns empty partitions when neither waste chute nor staging exist', () => {
    const result = partitionWasteChuteDeckFixtures({}, {})

    expect(result).toEqual({
      stagingAreaFixtures: [],
      wasteChuteOnlyFixtures: [],
      wasteChuteStagingAreaFixtures: [],
    })
  })
})
