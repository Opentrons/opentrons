import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fixture24Tuberack,
  fixture96Plate,
  getAllLiquidClassDefs,
} from '@opentrons/shared-data'

import {
  belowPipetteMinimumVolume,
  incompatibleLiquidClass,
  maxDispenseWellVolume,
  minDisposalVolume,
  mixTipPositionInTube,
  tipPositionInTube,
} from '../warnings'

import type { LabwareDefinition2, LiquidClass } from '@opentrons/shared-data'
import type { LabwareEntity } from '@opentrons/step-generation'

vi.mock('@opentrons/shared-data', async () => {
  const actual = await vi.importActual('@opentrons/shared-data')
  return {
    ...actual,
    getAllLiquidClassDefs: vi.fn(),
  }
})

describe('Below pipette minimum volume', () => {
  let fieldsWithPipette: {
    pipette: { spec: { liquids: { default: { minVolume: number } } } }
  }
  beforeEach(() => {
    fieldsWithPipette = {
      pipette: {
        spec: {
          liquids: {
            default: {
              minVolume: 100,
            },
          },
        },
      },
    }
  })
  it('should NOT return a warning when the volume equals the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 100,
    } as any
    expect(belowPipetteMinimumVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is greater than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 101,
    } as any
    expect(belowPipetteMinimumVolume(fields)).toBe(null)
  })
  it('should return a warning when the volume is less than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      volume: 99,
    }
    // @ts-expect-error(sa, 2021-6-15): belowPipetteMinimumVolume might return null, need to null check before property access
    expect(belowPipetteMinimumVolume(fields).type).toBe(
      'BELOW_PIPETTE_MINIMUM_VOLUME'
    )
  })
})
describe('Below min disposal volume', () => {
  let fieldsWithPipette: {
    pipette: { spec: { liquids: { default: { minVolume: number } } } }
    disposalVolume_checkbox: boolean
    disposalVolume_volume: number
    path: string
  }
  beforeEach(() => {
    fieldsWithPipette = {
      pipette: {
        spec: {
          liquids: {
            default: {
              minVolume: 100,
            },
          },
        },
      },
      disposalVolume_checkbox: true,
      disposalVolume_volume: 100,
      path: 'multiDispense',
    }
  })
  it('should NOT return a warning when there is no pipette', () => {
    const fields = {
      ...fieldsWithPipette,
      pipette: undefined,
    } as any
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when there is no pipette spec', () => {
    const fields = {
      ...fieldsWithPipette,
      pipette: { spec: undefined },
    } as any
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the path is NOT multi dispense', () => {
    const fields = {
      ...fieldsWithPipette,
      path: 'another_path',
    } as any
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is equal to the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 100,
    } as any
    expect(minDisposalVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is greater than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 100,
    } as any
    expect(minDisposalVolume(fields)).toBe(null)
  })

  it('should return a warning when the volume is less than the min pipette volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: 99,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
  it('should return a warning when the path is multi dispense and the checkbox is unchecked', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_checkbox: false,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
  it('should return a warning when the path is multi dispense and there is no disposal volume', () => {
    const fields = {
      ...fieldsWithPipette,
      disposalVolume_volume: undefined,
    }
    // @ts-expect-error(sa, 2021-6-15): minDisposalVolume might return null, need to null check before property access
    expect(minDisposalVolume(fields).type).toBe('BELOW_MIN_DISPOSAL_VOLUME')
  })
})
describe('Max dispense well volume', () => {
  let fieldsWithDispenseLabware: any
  beforeEach(() => {
    fieldsWithDispenseLabware = {
      dispense_labware: { def: fixture24Tuberack },
      dispense_wells: ['A1', 'A2'],
      aspirate_wells: ['A1', 'A2'],
    }
  })
  it('should NOT return a warning when there is no dispense labware', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      dispense_labware: undefined,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when there are no dispense wells', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      dispense_wells: undefined,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume is less than the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is 2000 (see fixture)
      volume: 1999,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should NOT return a warning when the volume equals the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is also 2000 (see fixture)
      volume: 2000,
    }
    expect(maxDispenseWellVolume(fields)).toBe(null)
  })
  it('should return a warning when the volume is greater than the well depth', () => {
    const fields = {
      ...fieldsWithDispenseLabware,
      // well total liquid volume is 2000 (see fixture)
      volume: 2001,
    }
    // @ts-expect-error(sa, 2021-6-15): maxDispenseWellVolume might return null, need to null check before property access
    expect(maxDispenseWellVolume(fields).type).toBe('OVER_MAX_WELL_VOLUME')
  })
  describe('tip position in tube warnings', () => {
    let fields: {
      aspirate_labware: LabwareEntity
      aspirate_mmFromBottom: number | null
      labware: LabwareEntity
      mix_mmFromBottom: number
      dispense_labware: LabwareEntity
      dispense_mmFromBottom: number | null
    }
    beforeEach(() => {
      fields = {
        aspirate_labware: {
          def: fixture24Tuberack as LabwareDefinition2,
          id: 'mockId',
          labwareDefURI: 'mockURI',
          pythonName: 'mockPythonName',
        },
        aspirate_mmFromBottom: null,
        labware: {
          def: fixture24Tuberack as LabwareDefinition2,
          id: 'mockId',
          labwareDefURI: 'mockURI',
          pythonName: 'mockPythonName',
        },
        mix_mmFromBottom: 0.5,
        dispense_labware: {
          def: fixture24Tuberack as LabwareDefinition2,
          id: 'mockId',
          labwareDefURI: 'mockURI',
          pythonName: 'mockPythonName',
        },
        dispense_mmFromBottom: null,
      }
    })
    it('renders the errors for all 2', () => {
      expect(tipPositionInTube(fields as any)?.type).toBe(
        'TIP_POSITIONED_LOW_IN_TUBE'
      )
      expect(mixTipPositionInTube(fields as any)?.type).toBe(
        'MIX_TIP_POSITIONED_LOW_IN_TUBE'
      )
    })
    it('renders null for both when the number has been adjusted', () => {
      fields.aspirate_mmFromBottom = 3
      fields.dispense_mmFromBottom = 3
      fields.mix_mmFromBottom = 3
      expect(tipPositionInTube(fields as any)).toBe(null)
      expect(mixTipPositionInTube(fields as any)).toBe(null)
    })
    it('renders null for both when the labware is not a tube rack', () => {
      fields.aspirate_labware = {
        def: fixture96Plate as LabwareDefinition2,
        id: 'mockId',
        labwareDefURI: 'mockURI',
        pythonName: 'mockPythonName',
      }
      fields.labware = {
        def: fixture96Plate as LabwareDefinition2,
        id: 'mockId',
        labwareDefURI: 'mockURI',
        pythonName: 'mockPythonName',
      }
      fields.dispense_labware = {
        def: fixture96Plate as LabwareDefinition2,
        id: 'mockId',
        labwareDefURI: 'mockURI',
        pythonName: 'mockPythonName',
      }
      expect(tipPositionInTube(fields as any)).toBe(null)
      expect(mixTipPositionInTube(fields as any)).toBe(null)
    })
  })
})

const MOCK_GLYCEROL = {
  liquidClassName: 'glycerol50V1',
  byPipette: [
    {
      pipetteModel: 'flex_1channel_1000',
      byTipType: [
        {
          tiprack: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
          aspirate: {},
          singleDispense: {},
          multiDispense: {},
        },
      ],
    },
  ],
} as LiquidClass
const MOCK_WATER = {
  liquidClassName: 'waterV1',
  byPipette: [
    {
      pipetteModel: 'flex_1channel_1000',
      byTipType: [
        {
          tiprack: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
          aspirate: {},
          singleDispense: {},
          multiDispense: {},
        },
      ],
    },
  ],
} as LiquidClass
describe('class compatibility', () => {
  let fields: any
  beforeEach(() => {
    fields = {
      pipette: {
        spec: { channels: 1, liquids: { default: { maxVolume: 1000 } } },
      },
      tipRack: 'opentrons/opentrons_flex_96_tiprack_1000ul/1',
      liquidClass: 'glycerol_50',
      path: 'singleDispense',
    }
    vi.mocked(getAllLiquidClassDefs).mockReturnValue({
      glycerol_50: MOCK_GLYCEROL,
      water: MOCK_WATER,
    })
  })

  it('should return null if the liquid class is compatible with the pipette, tips, volume, and path', () => {
    expect(incompatibleLiquidClass(fields)).toBe(null)
  })
  it('should return liquid classes incompatible with the pipette warning if pipette incompatible with all liquid classes', () => {
    fields = {
      ...fields,
      pipette: {
        spec: { channels: 2, liquids: { default: { maxVolume: 1000 } } },
      },
    }
    expect(incompatibleLiquidClass(fields)?.type).toBe(
      'INCOMPATIBLE_ALL_PIPETTE'
    )
  })
  it('should return liquid classes incompatible with the pipette warning if pipette incompatible with some liquid classes', () => {
    vi.mocked(getAllLiquidClassDefs).mockReturnValue({
      water: MOCK_WATER,
      glycerol_50: { ...MOCK_GLYCEROL, byPipette: [] },
    })
    expect(incompatibleLiquidClass(fields)?.type).toBe(
      'INCOMPATIBLE_SOME_PIPETTE'
    )
  })
  it('should return liquid classes incompatible with the pipette warning if tiprack incompatible with all liquid classes', () => {
    fields = {
      ...fields,
      tipRack: 'badTiprack',
    }
    expect(incompatibleLiquidClass(fields)?.type).toBe(
      'INCOMPATIBLE_TIP_RACK_ALL'
    )
  })
  it('should return liquid classes incompatible with the pipette warning if tiprack incompatible with some liquid classes', () => {
    vi.mocked(getAllLiquidClassDefs).mockReturnValue({
      water: MOCK_WATER,
      glycerol_50: {
        ...MOCK_GLYCEROL,
        byPipette: [{ pipetteModel: 'flex_1channel_1000', byTipType: [] }],
      },
    })
    expect(incompatibleLiquidClass(fields)?.type).toBe(
      'INCOMPATIBLE_TIP_RACK_SOME'
    )
  })
  it('should return liquid classes incompatible with the pipette warning if pipette incompatible with all liquid classes', () => {
    fields = {
      ...fields,
      volume: 0.01,
    }
    expect(incompatibleLiquidClass(fields)?.type).toBe('LOW_VOLUME_TRANSFER')
  })
})
