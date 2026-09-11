import round from 'lodash/round'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  getPipetteWithTipMaxVol,
  makeContext,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import {
  FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED,
  FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED,
  OT2_PLUNGER_MAX_SPEED,
} from '/protocol-designer/constants'

import { getMaxUiFlowRate, getNumPickups } from '../PipetteFields/utils'
import {
  capitalizeFirstLetter,
  getBlowoutLabwareDetails,
  getBlowoutLocationOptionsForForm,
  getFormErrorsMappedToField,
} from '../utils'

import type * as SharedData from '@opentrons/shared-data'
import type { FormErrorLocationType } from '/protocol-designer/steplist/formLevel/errors'

const BASE_VISIBLE_FORM_ERROR = {
  title: 'form level error title',
  dependentFields: ['field1', 'field2'],
  location: ['form'] as FormErrorLocationType[],
}

const MOCK_INVARIANT_CONTEXT = makeContext()

vi.mock('@opentrons/step-generation', async importOriginal => {
  const actual = await importOriginal<typeof SharedData>()
  return {
    ...actual,
    getPipetteWithTipMaxVol: vi.fn(),
  }
})
describe('getBlowoutLocationOptionsForForm', () => {
  const destOption = {
    name: 'Destination well',
    value: DEST_WELL_BLOWOUT_DESTINATION,
  }
  const sourceOption = {
    name: 'Source well',
    value: SOURCE_WELL_BLOWOUT_DESTINATION,
  }

  it('should return destination option for mix stepType', () => {
    const result = getBlowoutLocationOptionsForForm({ stepType: 'mix' })
    expect(result).toEqual([destOption])
  })

  it('should return source and destination options for moveLiquid stepType with single path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'single',
    })
    expect(result).toEqual([sourceOption, destOption])
  })

  it('should return source option and disabled destination option for moveLiquid stepType with multiDispense path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'multiDispense',
    })
    expect(result).toEqual([sourceOption, { ...destOption, disabled: true }])
  })

  it('should return disabled source option and destination option for moveLiquid stepType with multiAspirate path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'multiAspirate',
    })
    expect(result).toEqual([{ ...sourceOption, disabled: true }, destOption])
  })

  it('should return disabled source and destination options for moveLiquid stepType with undefined path', () => {
    const result = getBlowoutLocationOptionsForForm({ stepType: 'moveLiquid' })
    expect(result).toEqual([
      { ...sourceOption, disabled: true },
      { ...destOption, disabled: true },
    ])
  })

  it('should return an empty array for unknown stepType', () => {
    const result = getBlowoutLocationOptionsForForm({ stepType: 'comment' })
    expect(result).toEqual([])
  })
})

describe('getBlowoutLabwareDetails', () => {
  const makePropsForFields = (blowoutLocation: string | null): any => ({
    blowout_location: { value: blowoutLocation },
    aspirate_labware: { value: 'mockAspirateLabwareId' },
    dispense_labware: { value: 'mockDispenseLabwareId' },
  })

  it('should return the aspirate labware id when blowout location is the source well', () => {
    expect(
      getBlowoutLabwareDetails(
        makePropsForFields(SOURCE_WELL_BLOWOUT_DESTINATION)
      )
    ).toEqual({
      isBlowoutLocationLabware: true,
      blowOutLabwareId: 'mockAspirateLabwareId',
    })
  })

  it('should return the dispense labware id when blowout location is the destination well', () => {
    expect(
      getBlowoutLabwareDetails(
        makePropsForFields(DEST_WELL_BLOWOUT_DESTINATION)
      )
    ).toEqual({
      isBlowoutLocationLabware: true,
      blowOutLabwareId: 'mockDispenseLabwareId',
    })
  })

  it('should report a non-labware location for a trash bin', () => {
    const result = getBlowoutLabwareDetails(makePropsForFields('trashBinId'))
    expect(result.isBlowoutLocationLabware).toBe(false)
  })

  it('should report a non-labware location when blowout location is unset', () => {
    const result = getBlowoutLabwareDetails(makePropsForFields(null))
    expect(result.isBlowoutLocationLabware).toBe(false)
  })
})

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter of a step name and leave the rest unchanged', () => {
    const stepName = 'move labware to D3 on top of Magnetic Block'
    expect(capitalizeFirstLetter(stepName)).toBe(
      'Move labware to D3 on top of Magnetic Block'
    )
  })

  it('should capitalize the first letter of a step name and leave the rest unchanged', () => {
    const moduleName = 'Heater-shaker'
    expect(capitalizeFirstLetter(moduleName)).toBe('Heater-Shaker')
  })
})

describe('getFormErrorsMappedToField', () => {
  it('should return no errors since they are form level', () => {
    const result = getFormErrorsMappedToField([BASE_VISIBLE_FORM_ERROR])
    expect(result).toEqual({ field1: [], field2: [] })
  })
  it('should render errors for field level', () => {
    const result = getFormErrorsMappedToField([
      { ...BASE_VISIBLE_FORM_ERROR, location: ['field'] },
    ])
    expect(result).toEqual({
      field1: [
        {
          ...BASE_VISIBLE_FORM_ERROR,
          location: ['field'],
        },
      ],
      field2: [
        {
          ...BASE_VISIBLE_FORM_ERROR,
          location: ['field'],
        },
      ],
    })
  })
})

describe('getMaxUiFlowRate', () => {
  const mockTipLiquidSpecs = {
    aspirate: {
      default: {
        '1': [
          [10, 0.1, 0.5],
          [100, 0.05, 1],
        ],
      },
    },
    dispense: {
      default: {
        '1': [
          [10, 0.12, 0.6],
          [100, 0.06, 1.2],
        ],
      },
    },
  }

  it('should calculate max flow rate for OT-2', () => {
    const args = {
      targetVolume: 50,
      channels: 1,
      robotType: OT2_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'aspirate',
      correctionVolume: 0,
      shaftULperMM: 0.785,
    } as any
    const expectedAccuracy = 0.05 * 50 + 1
    const expectedTravelMm = 50 / expectedAccuracy
    const expectedMaxFlowRate = round(
      50 / (expectedTravelMm / OT2_PLUNGER_MAX_SPEED)
    )
    expect(getMaxUiFlowRate(args)).toEqual(expectedMaxFlowRate)
  })

  it('should calculate max flow rate for Flex single channel', () => {
    const args = {
      targetVolume: 20,
      channels: 1,
      robotType: FLEX_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'dispense',
      correctionVolume: 0,
    } as any
    const expectedAccuracy = 0.06 * 20 + 1.2
    const expectedTravelMm = 20 / expectedAccuracy
    const expectedMaxFlowRate = round(
      20 / (expectedTravelMm / FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED)
    )
    expect(getMaxUiFlowRate(args)).toEqual(expectedMaxFlowRate)
  })

  it('should calculate max flow rate for Flex 8-channel', () => {
    const args = {
      targetVolume: 80,
      channels: 8,
      robotType: FLEX_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'blowout',
      correctionVolume: 0,
      shaftULperMM: 0.785,
    } as any
    const expectedMaxFlowRate = round(
      0.785 * FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED
    )
    expect(getMaxUiFlowRate(args)).toEqual(expectedMaxFlowRate)
  })

  it('should calculate max flow rate for Flex 96-channel', () => {
    const args = {
      targetVolume: 5,
      channels: 96,
      robotType: FLEX_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'aspirate',
      correctionVolume: 0,
      shaftULperMM: 0.785,
    } as any
    const expectedAccuracy = 0.1 * 5 + 0.5
    const expectedTravelMm = 5 / expectedAccuracy
    const expectedMaxFlowRate = round(
      5 / (expectedTravelMm / FLEX_HIGH_THROUGHPUT_PLUNGER_MAX_SPEED)
    )
    expect(getMaxUiFlowRate(args)).toEqual(expectedMaxFlowRate)
  })

  it('should apply correction volume to the calculation', () => {
    const args = {
      targetVolume: 50,
      channels: 1,
      robotType: OT2_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'dispense',
      correctionVolume: 10,
      shaftULperMM: 0.785,
    } as any
    const expectedAccuracy = 0.06 * 50 + 1.2
    const expectedTravelMm = 50 / expectedAccuracy
    const correctionMultiplier = 1 + 10 / 50
    const expectedTravelMmCorrected = expectedTravelMm * correctionMultiplier
    const expectedMaxFlowRate = round(
      50 / (expectedTravelMmCorrected / OT2_PLUNGER_MAX_SPEED)
    )
    expect(getMaxUiFlowRate(args)).toEqual(expectedMaxFlowRate)
  })

  it('should use the last entry in flowRateFunction if targetVolume is larger than all defined points', () => {
    const largeVolumeArgs = {
      targetVolume: 150,
      channels: 1,
      robotType: FLEX_ROBOT_TYPE,
      tipLiquidSpecs: mockTipLiquidSpecs,
      flowRateType: 'aspirate',
      correctionVolume: 0,
      shaftULperMM: 0.785,
    } as any
    const expectedAccuracy = 0.05 * 150 + 1 // Using the last entry [100, 0.05, 1]
    const expectedTravelMm = 150 / expectedAccuracy
    const expectedMaxFlowRate =
      150 / (expectedTravelMm / FLEX_LOW_THROUGHPUT_PLUNGER_MAX_SPEED)
    expect(getMaxUiFlowRate(largeVolumeArgs)).toEqual(expectedMaxFlowRate)
  })
})

describe('getNumPickups', () => {
  let args: any

  beforeEach(() => {
    args = {
      formData: {
        stepType: 'moveLiquid',
        changeTip: 'once',
      },
      invariantContext: MOCK_INVARIANT_CONTEXT,
    }
  })

  it('should return 1 for changeTip once', () => {
    const result = getNumPickups(args)
    expect(result).toEqual(1)
  })

  it('should return 0 for changeTip never', () => {
    const result = getNumPickups({ ...args, formData: { changeTip: 'never' } })
    expect(result).toEqual(0)
  })

  it('should return 0 for step type other than moveLiquid or mix', () => {
    const result = getNumPickups({ ...args, formData: { stepType: 'comment' } })
    expect(result).toEqual(0)
  })

  it('should return 1 for changeTip perSource', () => {
    const result = getNumPickups({
      ...args,
      formData: {
        ...args.formData,
        changeTip: 'perSource',
        aspirate_wells: ['A1', 'A2'],
      },
    })
    expect(result).toEqual(2)
  })

  it('should return the number of dispense wells for changeTip perDest', () => {
    const result = getNumPickups({
      ...args,
      formData: {
        ...args.formData,
        changeTip: 'perDest',
        dispense_wells: ['B1', 'B2', 'B3'],
      },
    })
    expect(result).toEqual(3)
  })

  it('should return the number of wells to consider for changeTip perSource with multiWellHandling', () => {
    vi.mocked(getPipetteWithTipMaxVol).mockReturnValue(100)
    const result = getNumPickups({
      ...args,
      formData: {
        ...args.formData,
        changeTip: 'always',
        path: 'multiDispense',
        dispense_wells: ['B1', 'B2', 'B3'],
        volume: 50,
      },
      multiWellHandling: {
        isSupported: true,
        numWellsToFitInTip: 2,
      },
    })
    expect(result).toEqual(2)
  })

  it('should return the number of wells to consider for changeTip always with multiWellHandling, multiDispense', () => {
    vi.mocked(getPipetteWithTipMaxVol).mockReturnValue(100)
    const result = getNumPickups({
      ...args,
      formData: {
        ...args.formData,
        changeTip: 'always',
        path: 'multiAspirate',
        aspirate_wells: ['A1', 'A2'],
        volume: 50,
      },
      multiWellHandling: {
        isSupported: true,
        numWellsToFitInTip: 2,
      },
    })
    expect(result).toEqual(1)
  })
})
