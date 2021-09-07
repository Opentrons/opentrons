import { validateLabwareFiles, validateNewLabwareFile } from '../validation'

import uncheckedLabwareA from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import uncheckedLabwareB from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough.json'

import type { CheckedLabwareFile } from '@opentrons/app/src/redux/custom-labware/types'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const validLabwareA = uncheckedLabwareA as LabwareDefinition2
const validLabwareB = uncheckedLabwareB as LabwareDefinition2

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
