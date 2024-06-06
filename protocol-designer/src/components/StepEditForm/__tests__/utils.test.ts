import { describe, expect, it, beforeEach } from 'vitest'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import { getBlowoutLocationOptionsForForm } from '../utils'
import type { DropdownOption } from '@opentrons/components'

describe('getBlowoutLocationOptionsForForm', () => {
  let destOption: DropdownOption
  let sourceOption: DropdownOption
  let disabledSourceOption: DropdownOption
  let disabledDestOption: DropdownOption
  const sourceName = 'Source Well'
  const destName = 'Destination Well'

  beforeEach(() => {
    destOption = { name: destName, value: DEST_WELL_BLOWOUT_DESTINATION }
    disabledDestOption = {
      name: destName,
      value: DEST_WELL_BLOWOUT_DESTINATION,
      disabled: true,
    }
    sourceOption = { name: sourceName, value: SOURCE_WELL_BLOWOUT_DESTINATION }
    disabledSourceOption = {
      name: sourceName,
      value: SOURCE_WELL_BLOWOUT_DESTINATION,
      disabled: true,
    }
  })

  it('should just return destination option for Mix steps', () => {
    const result = getBlowoutLocationOptionsForForm({ stepType: 'mix' })
    expect(result).toEqual([destOption])
  })

  it('should return enabled source + enabled destination options for moveLiquid steps, "single" path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'single',
    })
    expect(result).toEqual([sourceOption, destOption])
  })

  it('should return disabled source + enabled destination options for moveLiquid steps, "multiAspirate" path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'multiAspirate',
    })
    expect(result).toEqual([disabledSourceOption, destOption])
  })

  it('should return enabled source + disabled destination options for moveLiquid steps, "multiDispense" path', () => {
    const result = getBlowoutLocationOptionsForForm({
      stepType: 'moveLiquid',
      path: 'multiDispense',
    })
    expect(result).toEqual([sourceOption, disabledDestOption])
  })

  it('should return empty array for other step types', () => {
    const result = getBlowoutLocationOptionsForForm({ stepType: 'magnet' })
    expect(result).toEqual([])
  })
})
