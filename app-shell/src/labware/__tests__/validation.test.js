// @flow
import { validateLabwareFiles, validateNewLabwareFile } from '../validation'

import validLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import validLabwareB from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'

describe('validateLabwareFiles', () => {
  test('handles unparseable and invalid labware files', () => {
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

  test('handles valid labware files', () => {
    const files = [
      { filename: 'a.json', data: validLabwareA, created: Date.now() },
      { filename: 'b.json', data: validLabwareB, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        created: expect.any(Number),
        metadata: validLabwareB.metadata,
        identity: {
          name: 'fixture_12_trough',
          version: 1,
          namespace: 'fixture',
        },
      },
    ])
  })

  test('handles non-unique labware files', () => {
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
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
      },
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'b.json',
        created: 2,
        metadata: validLabwareB.metadata,
        identity: {
          name: 'fixture_12_trough',
          version: 1,
          namespace: 'fixture',
        },
      },
      // oldest duplicate wins and is valid
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'c.json',
        created: 1,
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
      },
    ])
  })

  test('handles Opentrons-standard labware files', () => {
    const opentronsDef = { ...validLabwareA, namespace: 'opentrons' }
    const files = [
      { filename: 'a.json', data: opentronsDef, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'OPENTRONS_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'opentrons',
        },
      },
    ])
  })
})

describe('validateNewLabwareFile', () => {
  test('validates a new file', () => {
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
      metadata: validLabwareA.metadata,
      identity: {
        name: 'fixture_96_plate',
        version: 1,
        namespace: 'fixture',
      },
    })
  })

  test('returns a duplicate if new file conflicts with existing', () => {
    const existing = [
      {
        type: 'VALID_LABWARE_FILE',
        filename: 'a.json',
        created: 42,
        metadata: validLabwareA.metadata,
        identity: {
          name: 'fixture_96_plate',
          version: 1,
          namespace: 'fixture',
        },
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
      metadata: validLabwareA.metadata,
      identity: {
        name: 'fixture_96_plate',
        version: 1,
        namespace: 'fixture',
      },
    })
  })
})
