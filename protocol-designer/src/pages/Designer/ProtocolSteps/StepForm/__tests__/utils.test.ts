import { describe, it, expect } from 'vitest'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import {
  capitalizeFirstLetter,
  getBlowoutLocationOptionsForForm,
} from '../utils'

describe('getBlowoutLocationOptionsForForm', () => {
  const destOption = {
    name: 'Destination Well',
    value: DEST_WELL_BLOWOUT_DESTINATION,
  }
  const sourceOption = {
    name: 'Source Well',
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

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter of a step name and leave the rest unchanged', () => {
    const stepName = 'move labware to D3 on top of Magnetic Block'
    expect(capitalizeFirstLetter(stepName)).toBe(
      'Move labware to D3 on top of Magnetic Block'
    )
  })
})
