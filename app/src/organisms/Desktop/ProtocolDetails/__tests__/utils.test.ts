import { describe, expect, it } from 'vitest'

import {
  FLEX_STANDARD_MODEL,
  OT2_STANDARD_MODEL,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
} from '@opentrons/shared-data'

import { getSlotsForThermocycler } from '../utils'

describe('getSlotsForThermocylcer', () => {
  it('returns the correct thermocylcer slots given an OT3', () => {
    const result = getSlotsForThermocycler(FLEX_STANDARD_MODEL)
    expect(result).toEqual(TC_MODULE_LOCATION_OT3)
  })

  it('returns the correct thermocylcer slots given an OT2', () => {
    const result = getSlotsForThermocycler(OT2_STANDARD_MODEL)
    expect(result).toEqual(TC_MODULE_LOCATION_OT2)
  })

  it('returns OT2 thermocycler location when robotType is not available', () => {
    const result = getSlotsForThermocycler(null)
    expect(result).toEqual(TC_MODULE_LOCATION_OT2)
  })
})
