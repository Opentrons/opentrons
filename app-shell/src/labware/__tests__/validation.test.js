// @flow
import validLabwareB from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'
import validLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'

import { validateLabwareFiles, validateNewLabwareFile } from '../validation'

describe('validateLabwareFiles', () => {
  it('handles unparseable and invalid labware files', () => {
    const files = [
      { filename: 'a.json', data: null, created: Date.now() },
      { filename: 'b.json', data: { baz: 'qux' }, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'INVALID_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
      },
      {
        type: 'INVALID_LABWARE_FILE',
        filename: 'b.json',
        created: expect.any(Number),
      },
    ])
  })

  it('handles valid labware files', () => {
    const files = [
      { filename: 'a.json', data: validLabwareA, created: Date.now() },
      { filename: 'b.json', data: validLabwareB, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
        definition: validLabwareA,
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        created: expect.any(Number),
        definition: validLabwareB,
      },
    ])
  })

  it('handles non-unique labware files', () => {
    const files = [
      { filename: 'a.json', data: validLabwareA, created: 3 },
      { filename: 'b.json', data: validLabwareB, created: 2 },
      { filename: 'c.json', data: validLabwareA, created: 1 },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'DUPLICATE_LABWARE_FILE',
        filename: 'a.json',
        created: 3,
        definition: validLabwareA,
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        created: 2,
        definition: validLabwareB,
      },
      // oldest duplicate wins and is valid
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'c.json',
        created: 1,
        definition: validLabwareA,
      },
    ])
  })

  it('handles Opentrons-standard labware files', () => {
    const opentronsDef = { ...validLabwareA, namespace: 'opentrons' }
    const files = [
      { filename: 'a.json', data: opentronsDef, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'OPENTRONS_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
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
      created: 42,
    }

    expect(validateNewLabwareFile(existing, newFile)).toEqual({
      type: 'VALID_LABWARE_FILE',
      filename: 'a.json',
      created: 42,
      definition: validLabwareA,
    })
  })

  it('returns a duplicate if new file conflicts with existing', () => {
    const existing = [
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: 42,
        definition: validLabwareA,
      },
    ]
    const newFile = {
      filename: 'a.json',
      data: validLabwareA,
      created: 21,
    }

    expect(validateNewLabwareFile(existing, newFile)).toEqual({
      type: 'DUPLICATE_LABWARE_FILE',
      filename: 'a.json',
      created: 21,
      definition: validLabwareA,
    })
  })
})
