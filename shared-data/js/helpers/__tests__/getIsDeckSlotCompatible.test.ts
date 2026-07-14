import { describe, expect, it } from 'vitest'

import { fixture_96_plate as _fixture96Plate } from '../../../labware/fixtures/2'
import { getIsDeckSlotCompatible } from '../../getLabware'

import type { LabwareDefinition } from '../../types'

const fixture96Plate = _fixture96Plate as LabwareDefinition

describe('getIsDeckSlotCompatible', () => {
  it('returns true when isDeckSlotCompatible is not set', () => {
    expect(getIsDeckSlotCompatible(fixture96Plate)).toBe(true)
  })

  it('returns true when isDeckSlotCompatible is true', () => {
    const labwareDef = {
      ...fixture96Plate,
      parameters: {
        ...fixture96Plate.parameters,
        isDeckSlotCompatible: true,
      },
    }
    expect(getIsDeckSlotCompatible(labwareDef)).toBe(true)
  })

  it('returns false when isDeckSlotCompatible is false', () => {
    const labwareDef = {
      ...fixture96Plate,
      parameters: {
        ...fixture96Plate.parameters,
        isDeckSlotCompatible: false,
      },
    }
    expect(getIsDeckSlotCompatible(labwareDef)).toBe(false)
  })
})