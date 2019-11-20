// @flow

import * as selectors from '../selectors'

import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: State => mixed,
  state: $Shape<State>,
  expected: mixed,
|}

describe('custom labware selectors', () => {
  const SPECS: Array<SelectorSpec> = [
    {
      name: 'getCustomLabware',
      selector: selectors.getCustomLabware,
      state: {
        labware: {
          addFileFailure: null,
          filenames: ['a.json', 'b.json'],
          filesByName: {
            'a.json': {
              type: 'BAD_JSON_LABWARE_FILE',
              filename: 'a.json',
              created: 3,
            },
            'b.json': {
              type: 'INVALID_LABWARE_FILE',
              filename: 'b.json',
              created: 2,
            },
          },
        },
      },
      expected: [
        { type: 'BAD_JSON_LABWARE_FILE', filename: 'a.json', created: 3 },
        { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 2 },
      ],
    },
    {
      name: 'getValidCustomLabware',
      selector: selectors.getValidCustomLabware,
      state: {
        labware: {
          addFileFailure: null,
          filenames: ['a.json', 'b.json', 'c.json', 'd.json', 'e.json'],
          filesByName: {
            'a.json': {
              type: 'VALID_LABWARE_FILE',
              filename: 'a.json',
              created: 1,
              identity: { name: 'a', namespace: 'custom', version: 1 },
              metadata: {
                displayName: 'A',
                displayCategory: 'wellPlate',
                displayVolumeUnits: 'mL',
              },
            },
            'b.json': {
              type: 'BAD_JSON_LABWARE_FILE',
              filename: 'b.json',
              created: 2,
            },
            'c.json': {
              type: 'INVALID_LABWARE_FILE',
              filename: 'c.json',
              created: 3,
            },
            'd.json': {
              type: 'DUPLICATE_LABWARE_FILE',
              filename: 'd.json',
              created: 4,
              identity: { name: 'd', namespace: 'custom', version: 1 },
              metadata: {
                displayName: 'D',
                displayCategory: 'wellPlate',
                displayVolumeUnits: 'mL',
              },
            },
            'e.json': {
              type: 'VALID_LABWARE_FILE',
              filename: 'e.json',
              created: 5,
              identity: { name: 'e', namespace: 'custom', version: 1 },
              metadata: {
                displayName: 'E',
                displayCategory: 'reservoir',
                displayVolumeUnits: 'mL',
              },
            },
          },
        },
      },
      expected: [
        {
          type: 'VALID_LABWARE_FILE',
          filename: 'a.json',
          created: 1,
          identity: { name: 'a', namespace: 'custom', version: 1 },
          metadata: {
            displayName: 'A',
            displayCategory: 'wellPlate',
            displayVolumeUnits: 'mL',
          },
        },
        {
          type: 'VALID_LABWARE_FILE',
          filename: 'e.json',
          created: 5,
          identity: { name: 'e', namespace: 'custom', version: 1 },
          metadata: {
            displayName: 'E',
            displayCategory: 'reservoir',
            displayVolumeUnits: 'mL',
          },
        },
      ],
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, expected } = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
