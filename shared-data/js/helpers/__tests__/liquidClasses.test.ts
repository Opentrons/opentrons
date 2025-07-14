import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAllLiquidClassDefs } from '../../liquidClasses'
import { getFlexNameConversion } from '../../pipettes'
import { linearInterpolate } from '../linearInterpolate'
import { getByVolumeValue } from '../liquidClasses'

vi.mock('../../liquidClasses')
vi.mock('../../pipettes')
vi.mock('../linearInterpolate')

const MOCK_PIPETTE_ID = 'flex_1channel_1000ul'
const MOCK_UNKNOWN_PIPETTE_ID = 'flex_1channel_99ul'
const MOCK_TIPRACK_DEF_URI = 'opentrons/opentrons_flex_96_tiprack_50ul/1'
const MOCK_UNKNOWN_TIPRACK_DEF_URI =
  'opentrons/opentrons_flex_96_tiprack_50ul/99'
const MOCK_UNKNOWN_LIQUID_CLASS = 'none'

const MOCK_LIQUID_CLASS_DEFS = {
  waterV1: {
    byPipette: [
      {
        pipetteModel: MOCK_PIPETTE_ID,
        byTipType: [
          {
            tiprack: MOCK_TIPRACK_DEF_URI,
            aspirate: {
              correctionByVolume: [
                [1, 1],
                [50, 5],
              ],
            },
            singleDispense: {
              correctionByVolume: [
                [1, 2],
                [50, 6],
              ],
            },
            multiDispense: {
              correctionByVolume: [
                [1, 3],
                [50, 7],
              ],
            },
          },
        ],
      },
    ],
  },
  ethanol70: {
    byPipette: [
      {
        pipetteModel: MOCK_PIPETTE_ID,
        byTipType: [
          {
            tiprack: MOCK_TIPRACK_DEF_URI,
            aspirate: {
              correctionByVolume: [
                [1, 1.5],
                [50, 5.5],
              ],
            },
            singleDispense: {
              correctionByVolume: [
                [1, 2.5],
                [50, 6.5],
              ],
            },
          },
        ],
      },
    ],
  },
} as any

describe('getByVolumeValue', () => {
  let args: any
  beforeEach(() => {
    vi.mocked(getAllLiquidClassDefs).mockReturnValue(MOCK_LIQUID_CLASS_DEFS)
    vi.mocked(getFlexNameConversion).mockReturnValue(MOCK_PIPETTE_ID)
    args = {
      liquidClass: null,
      pipetteSpecs: expect.any(Object),
      tiprackDefUri: MOCK_TIPRACK_DEF_URI,
      targetVolume: 40,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }
  })
  describe('calling liquid class with defined multiDispense object', () => {
    beforeEach(() => {
      args = { ...args, liquidClass: 'waterV1' }
    })
    it('calls interpolation with correct values for water > aspirate', () => {
      getByVolumeValue({
        ...args,
        liquidHandlingAction: 'aspirate',
      })
      expect(linearInterpolate).toBeCalledWith(40, [
        [1, 1],
        [50, 5],
      ])
    })
    it('calls interpolation with water values for water > singleDispense', () => {
      getByVolumeValue({
        ...args,
        liquidHandlingAction: 'singleDispense',
      })
      expect(linearInterpolate).toBeCalledWith(40, [
        [1, 2],
        [50, 6],
      ])
    })
    it('calls interpolation with water values for water > multiDispense', () => {
      getByVolumeValue({
        ...args,
        liquidHandlingAction: 'multiDispense',
      })
      expect(linearInterpolate).toBeCalledWith(40, [
        [1, 3],
        [50, 7],
      ])
    })
  })
  describe('pipette or tiprack not found', () => {
    beforeEach(() => {
      args = { ...args, liquidClass: 'waterV1' }
    })
    it('returns 0 for water values for unknown pipette', () => {
      vi.mocked(getFlexNameConversion).mockReturnValue(MOCK_UNKNOWN_PIPETTE_ID)
      const result = getByVolumeValue(args)
      expect(result).toEqual(0)
    })
    it('returns 0 for water values for unknown tiprack', () => {
      vi.mocked(getFlexNameConversion).mockReturnValue(MOCK_PIPETTE_ID)
      const result = getByVolumeValue({
        ...args,
        tiprackDefUri: MOCK_UNKNOWN_TIPRACK_DEF_URI,
      })
      expect(result).toEqual(0)
    })
  })
  it('returns 0 if no liquid class passed', () => {
    const result = getByVolumeValue(args)
    expect(result).toEqual(0)
  })
  it('calls interpolation with water values for unknown liquid class', () => {
    getByVolumeValue({
      ...args,
      liquidClass: MOCK_UNKNOWN_LIQUID_CLASS,
      liquidHandlingAction: 'aspirate',
    })
    expect(linearInterpolate).toBeCalledWith(40, [
      [1, 1],
      [50, 5],
    ])
  })
  it('calls interpolation for singleDispense if multiDispense values not found', () => {
    getByVolumeValue({
      ...args,
      liquidClass: 'ethanol70',
      liquidHandlingAction: 'multiDispense',
    })
    expect(linearInterpolate).toBeCalledWith(40, [
      [1, 2.5],
      [50, 6.5],
    ])
  })
})
