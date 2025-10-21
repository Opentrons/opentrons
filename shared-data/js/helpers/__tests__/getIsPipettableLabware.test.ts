import { describe, expect, it } from 'vitest'

import { fixture_96_plate as _fixture96Plate } from '../../../labware/fixtures/2'
import { getIsPipettableLabware } from '../../getLabware'

import type { LabwareDefinition } from '../../types'

const fixture96Plate = _fixture96Plate as LabwareDefinition

describe('getIsPipettableLabware', () => {
  let props: { labwareDef: LabwareDefinition }

  it('should return true if the labware does not specify allowedRoles property', () => {
    props = {
      labwareDef: fixture96Plate,
    }
    const result = getIsPipettableLabware(props.labwareDef)
    expect(result).toBe(true)
  })

  it('should return true if the labware specifies allowedRoles property with "labware" role only', () => {
    props = {
      labwareDef: { ...fixture96Plate, allowedRoles: ['labware'] },
    }
    const result = getIsPipettableLabware(props.labwareDef)
    expect(result).toBe(true)
  })

  it('should return false if the labware specifies allowedRoles property without "labware" role', () => {
    props = {
      labwareDef: {
        ...fixture96Plate,
        allowedRoles: ['lid', 'adapter', 'fixture'],
      },
    }
    const result = getIsPipettableLabware(props.labwareDef)
    expect(result).toBe(false)
  })

  it('should return false if the labware specifies allowedRoles property with "labware" role and "lid" role', () => {
    props = {
      labwareDef: {
        ...fixture96Plate,
        allowedRoles: ['labware', 'lid'],
      },
    }
    const result = getIsPipettableLabware(props.labwareDef)
    expect(result).toBe(false)
  })
})
