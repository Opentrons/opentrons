import { describe, expect, it } from 'vitest'

import { fixture_96_plate as _fixture96Plate } from '../../../labware/fixtures/2'
import { getIsLid } from '../../getLabware'

import type { LabwareDefinition } from '../../types'

const fixture96Plate = _fixture96Plate as LabwareDefinition

describe('getIsLid', () => {
  let props: { labwareDef: LabwareDefinition }

  it('should return false if the labware does not specify allowedRoles property', () => {
    props = {
      labwareDef: fixture96Plate,
    }
    const result = getIsLid(props.labwareDef)
    expect(result).toBe(false)
  })

  it('should return true if the labware specifies allowedRoles property with "lid" role', () => {
    props = {
      labwareDef: { ...fixture96Plate, allowedRoles: ['lid'] },
    }
    const result = getIsLid(props.labwareDef)
    expect(result).toBe(true)
  })

  it('should return false if the labware specifies allowedRoles property without "lid" role', () => {
    props = {
      labwareDef: { ...fixture96Plate, allowedRoles: ['labware'] },
    }
    const result = getIsLid(props.labwareDef)
    expect(result).toBe(false)
  })
})
