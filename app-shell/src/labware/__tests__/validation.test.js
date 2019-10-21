// @flow
import { validateLabwareFiles } from '../validation'

import validLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import validLabwareB from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'

describe('validateLabwareFiles', () => {
  test('handles unparseable labware files', () => {
    const files = [
      { filename: 'a.json', data: null, created: Date.now() },
      { filename: 'b.json', data: null, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'BAD_JSON_LABWARE_FILE',
        filename: 'a.json',
        created: expect.any(Number),
      },
      {
        type: 'BAD_JSON_LABWARE_FILE',
        filename: 'b.json',
        created: expect.any(Number),
      },
    ])
  })

  test('handles invalid labware files', () => {
    const files = [
      { filename: 'a.json', data: { foo: 'bar' }, created: Date.now() },
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
      { filename: 'a.json', data: validLabwareA, created: Date.now() },
      { filename: 'b.json', data: validLabwareB, created: Date.now() },
      { filename: 'c.json', data: validLabwareA, created: Date.now() },
    ]

    expect(validateLabwareFiles(files)).toEqual([
      {
        type: 'DUPLICATE_LABWARE_FILE',
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
      {
        type: 'DUPLICATE_LABWARE_FILE',
        filename: 'c.json',
        created: expect.any(Number),
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
