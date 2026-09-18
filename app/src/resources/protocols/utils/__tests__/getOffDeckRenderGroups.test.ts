import { describe, expect, it } from 'vitest'

import { getOffDeckRenderGroups } from '../getOffDeckRenderGroups'

import type {
  CompletedProtocolAnalysis,
  LabwareByLiquidId,
  LabwareInStack,
} from '@opentrons/shared-data'

const makeOffDeckItem = (
  labwareId: string,
  displayName: string
): LabwareInStack => ({
  labwareId,
  displayName,
  definitionUri: 'opentrons/nest_12_reservoir_15ml/3',
})

describe('getOffDeckRenderGroups', () => {
  it('keeps off-deck labware separate when liquid layouts differ', () => {
    const protocolAnalysis = {
      liquids: [
        { id: 'water', displayName: 'water', displayColor: '#0000ff' },
        {
          id: 'misteryLiquid',
          displayName: 'mistery liquid',
          displayColor: '#a52a2a',
        },
      ],
      commands: [],
    } as unknown as CompletedProtocolAnalysis

    const labwareByLiquidId = {
      water: [{ labwareId: 'b36d9b14', volumeByWell: { A1: 300, A2: 300 } }],
      misteryLiquid: [
        { labwareId: '1f0fd9b8', volumeByWell: { A1: 300, A2: 300 } },
      ],
    } as unknown as LabwareByLiquidId

    const offDeckGroups = getOffDeckRenderGroups(
      {
        offDeck: [
          [
            makeOffDeckItem('b36d9b14', 'Reservoir 1'),
            makeOffDeckItem('1f0fd9b8', 'Reservoir 2'),
          ],
        ],
      },
      protocolAnalysis,
      labwareByLiquidId
    )

    expect(offDeckGroups).toHaveLength(2)
    expect(
      offDeckGroups.map(group => group.representativeItem.displayName)
    ).toEqual(['Reservoir 1', 'Reservoir 2'])
  })

  it('keeps off-deck labware separate when liquid layouts match and are not empty', () => {
    const protocolAnalysis = {
      liquids: [{ id: 'water', displayName: 'water', displayColor: '#0000ff' }],
      commands: [],
    } as unknown as CompletedProtocolAnalysis

    const labwareByLiquidId = {
      water: [
        { labwareId: 'labwareA', volumeByWell: { A1: 300, A2: 300 } },
        { labwareId: 'labwareB', volumeByWell: { A1: 300, A2: 300 } },
      ],
    } as unknown as LabwareByLiquidId

    const offDeckGroups = getOffDeckRenderGroups(
      {
        offDeck: [
          [
            makeOffDeckItem('labwareA', 'Reservoir'),
            makeOffDeckItem('labwareB', 'Reservoir'),
          ],
        ],
      },
      protocolAnalysis,
      labwareByLiquidId
    )

    expect(offDeckGroups).toHaveLength(2)
    expect(offDeckGroups[0].quantity).toBe(1)
    expect(offDeckGroups[1].quantity).toBe(1)
  })

  it('groups off-deck labware when display name and liquid layouts are empty', () => {
    const protocolAnalysis = {
      liquids: [],
      commands: [],
    } as unknown as CompletedProtocolAnalysis

    const labwareByLiquidId = {} as LabwareByLiquidId

    const offDeckGroups = getOffDeckRenderGroups(
      {
        offDeck: [
          [
            makeOffDeckItem('labwareA', 'Reservoir'),
            makeOffDeckItem('labwareB', 'Reservoir'),
          ],
        ],
      },
      protocolAnalysis,
      labwareByLiquidId
    )

    expect(offDeckGroups).toHaveLength(1)
    expect(offDeckGroups[0].quantity).toBe(2)
    expect(offDeckGroups[0].stackedItems).toHaveLength(2)
  })
})
