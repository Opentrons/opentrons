import { describe, expect, it } from 'vitest'

import { getPipetteCapacity } from '../pipetteData'

import type { PipetteEntity } from '@opentrons/step-generation'

const makeTiprackDef = (loadName: string, tipVolume: number) =>
  ({
    namespace: 'opentrons',
    version: 1,
    parameters: {
      loadName,
      isTiprack: true,
    },
    metadata: {
      displayCategory: 'tipRack',
    },
    ordering: [['A1']],
    wells: {
      A1: {
        totalLiquidVolume: tipVolume,
      },
    },
  }) as any

describe('getPipetteCapacity', () => {
  it('uses available liquid specs when default is missing', () => {
    const pipetteEntity = {
      id: 'pipette-id',
      spec: {
        liquids: {
          custom: {
            maxVolume: 50,
            minVolume: 1,
            defaultTipracks: [],
            supportedTips: {
              t50: {},
            },
          },
        },
      },
      tiprackLabwareDef: [makeTiprackDef('opentrons_96_tiprack_50ul', 50)],
    } as PipetteEntity

    expect(
      getPipetteCapacity(pipetteEntity, 'opentrons/opentrons_96_tiprack_50ul/1')
    ).toBe(50)
  })

  it('falls back to any available liquid spec instead of throwing', () => {
    const pipetteEntity = {
      id: 'pipette-id',
      spec: {
        liquids: {
          custom: {
            maxVolume: 200,
            minVolume: 1,
            defaultTipracks: [],
            supportedTips: {},
          },
        },
      },
      tiprackLabwareDef: [makeTiprackDef('opentrons_96_tiprack_300ul', 300)],
    } as PipetteEntity

    expect(
      getPipetteCapacity(
        pipetteEntity,
        'opentrons/opentrons_96_tiprack_300ul/1'
      )
    ).toBe(200)
  })

  it('returns NaN when no liquid specs are available', () => {
    const pipetteEntity = {
      id: 'pipette-id',
      spec: {
        liquids: {},
      },
      tiprackLabwareDef: [makeTiprackDef('opentrons_96_tiprack_300ul', 300)],
    } as PipetteEntity

    expect(getPipetteCapacity(pipetteEntity)).toBeNaN()
  })
})
