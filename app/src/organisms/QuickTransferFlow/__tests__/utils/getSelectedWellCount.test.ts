import { describe, it, expect } from 'vitest'
import { getSelectedWellCount } from '../../utils'

describe('getSelectedWellCount', () => {
  it('calculates the selected well count for a single channel pipette', () => {
    const props = {
      pipette: {
        channels: 1,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'well_plate',
        },
        groups: [
          {
            wells: ['A1'],
          },
        ] as any,
      } as any,
      wells: ['A1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(1)
  })
  it('calculates the selected well count for a single well reservoir', () => {
    const props = {
      pipette: {
        channels: 8,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'reservoir',
        },
        groups: [
          {
            wells: ['A1'],
          },
        ] as any,
      } as any,
      wells: ['A1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(1)
  })
  it('calculates the selected well count for a 12 well reservoir and 8 channel pipette', () => {
    const props = {
      pipette: {
        channels: 8,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'reservoir',
        },
        groups: [
          {
            wells: [
              'A1',
              'B1',
              'C1',
              'D1',
              'E1',
              'F1',
              'G1',
              'H1',
              'I1',
              'J1',
              'K1',
              'L1',
            ],
          },
        ] as any,
      } as any,
      wells: ['A1', 'B1', 'C1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(3)
  })
  it('calculates the selected well count for a 12 well reservoir and 96 channel pipette', () => {
    const props = {
      pipette: {
        channels: 96,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'reservoir',
        },
        groups: [
          {
            wells: [
              'A1',
              'B1',
              'C1',
              'D1',
              'E1',
              'F1',
              'G1',
              'H1',
              'I1',
              'J1',
              'K1',
              'L1',
            ],
          },
        ] as any,
      } as any,
      wells: ['A1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(12)
  })
  it('calculates the selected well count for a well plate and 96-channel pipette', () => {
    const props = {
      pipette: {
        channels: 96,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'well_plate',
        },
      } as any,
      wells: ['A1', 'B1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(192)
  })
  it('calculates the selected well count for a well plate and multi channel pipette', () => {
    const props = {
      pipette: {
        channels: 8,
      } as any,
      labware: {
        metadata: {
          displayCategory: 'well_plate',
        },
      } as any,
      wells: ['A1', 'B1'],
    }
    const result = getSelectedWellCount(
      props.pipette,
      props.labware,
      props.wells
    )
    expect(result).toEqual(16)
  })
})
