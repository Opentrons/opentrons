// @flow
import { validateLabwareFiles, validateNewLabwareFile } from '../validation'

import validLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import validLabwareB from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'

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
      { filename: 'a.json', data: validLabwareA, modified: Date.now() },
      { filename: 'b.json', data: validLabwareB, modified: Date.now() },
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
    ])
  })

  it('handles non-unique labware files', () => {
    const files = [
      { filename: 'a.json', data: validLabwareA, modified: 3 },
      { filename: 'b.json', data: validLabwareB, modified: 2 },
      { filename: 'c.json', data: validLabwareA, modified: 1 },
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
    const existing = []
    const newFile = {
      filename: 'a.json',
      data: validLabwareA,
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
    const existing = [
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        modified: 42,
        definition: validLabwareA,
      },
    ]
    const newFile = {
      filename: 'a.json',
      data: validLabwareA,
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
