import { describe, expect, it } from 'vitest'

import {
  fixture96Plate as uncheckedLabwareA,
  fixture12Trough as uncheckedLabwareB,
} from '@opentrons/shared-data'
import { fixture_corning_24_plate as uncheckedLabwareC } from '@opentrons/shared-data/labware/fixtures/3'

import { validateLabwareFiles, validateNewLabwareFile } from '../validation'

import type { CheckedLabwareFile } from '@opentrons/app/src/redux/custom-labware/types'
import type { LabwareDefinition } from '@opentrons/shared-data'

const validLabwareA = uncheckedLabwareA as LabwareDefinition
const validLabwareB = uncheckedLabwareB as LabwareDefinition
const validLabwareC = uncheckedLabwareC as LabwareDefinition

describe('validateLabwareFiles', () => {
  it('handles unparseable and invalid labware files', () => {
    const files = [
      { filename: 'a.json', data: null, modified: Date.now() },
      { filename: 'b.json', data: { baz: 'qux' }, modified: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'INVALID_LABWARE_FILE',
        filename: 'a.json',
        modified: expect.any(Number),
      },
      {
        type: 'INVALID_LABWARE_FILE',
        filename: 'b.json',
        modified: expect.any(Number),
      },
    ])
  })

  it('handles valid labware files', () => {
    const files = [
      { filename: 'a.json', data: uncheckedLabwareA, modified: Date.now() },
      { filename: 'b.json', data: uncheckedLabwareB, modified: Date.now() },
      { filename: 'c.json', data: uncheckedLabwareC, modified: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        modified: expect.any(Number),
        definition: validLabwareA,
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        modified: expect.any(Number),
        definition: validLabwareB,
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'c.json',
        modified: expect.any(Number),
        definition: validLabwareC,
      },
    ])
  })

  it('handles non-unique labware files', () => {
    const files = [
      { filename: 'a.json', data: uncheckedLabwareA, modified: 3 },
      { filename: 'b.json', data: uncheckedLabwareB, modified: 2 },
      { filename: 'c.json', data: uncheckedLabwareA, modified: 1 },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'DUPLICATE_LABWARE_FILE',
        filename: 'a.json',
        modified: 3,
        definition: validLabwareA,
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        modified: 2,
        definition: validLabwareB,
      },
      // oldest duplicate wins and is valid
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'c.json',
        modified: 1,
        definition: validLabwareA,
      },
    ])
  })

  it('handles Opentrons-standard labware files', () => {
    const opentronsDef = { ...validLabwareA, namespace: 'opentrons' }
    const files = [
      { filename: 'a.json', data: opentronsDef, modified: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'OPENTRONS_LABWARE_FILE',
        filename: 'a.json',
        modified: expect.any(Number),
        definition: opentronsDef,
      },
    ])
  })
})

describe('validateNewLabwareFile', () => {
  it('validates a new file', () => {
    const existing: CheckedLabwareFile[] = []
    const newFile = {
      filename: 'a.json',
      data: uncheckedLabwareA,
      modified: 42,
    }

    expect(validateNewLabwareFile(existing, newFile)).toEqual({
      type: 'VALID_LABWARE_FILE',
      filename: 'a.json',
      modified: 42,
      definition: validLabwareA,
    })
  })

  it('returns a duplicate if new file conflicts with existing', () => {
    const existing: CheckedLabwareFile[] = [
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        modified: 42,
        definition: validLabwareA,
      },
    ]
    const newFile = {
      filename: 'a.json',
      data: uncheckedLabwareA,
      modified: 21,
    }

    expect(validateNewLabwareFile(existing, newFile)).toEqual({
      type: 'DUPLICATE_LABWARE_FILE',
      filename: 'a.json',
      modified: 21,
      definition: validLabwareA,
    })
  })
})
