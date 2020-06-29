// @flow

import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'
import * as selectors from '../selectors'
import type { ValidLabwareFile } from '../types'

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
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          filenames: [
            Fixtures.mockValidLabware.filename,
            Fixtures.mockInvalidLabware.filename,
          ],
          filesByName: {
            [Fixtures.mockValidLabware.filename]: Fixtures.mockValidLabware,
            [Fixtures.mockInvalidLabware.filename]: Fixtures.mockInvalidLabware,
          },
        },
      },
      expected: [Fixtures.mockValidLabware, Fixtures.mockInvalidLabware],
    },
    {
      name: 'getCustomLabware sorts by displayCategory then displayName',
      selector: selectors.getCustomLabware,
      state: {
        labware: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          filenames: ['4.json', '2.json', '1.json', '3.json'],
          filesByName: {
            '4.json': ({}: any),
            '2.json': ({
              definition: {
                metadata: { displayCategory: 'A', displayName: 'B' },
              },
            }: any),
            '1.json': ({
              definition: {
                metadata: { displayCategory: 'A', displayName: 'A' },
              },
            }: any),
            '3.json': ({
              definition: {
                metadata: { displayCategory: 'B', displayName: 'A' },
              },
            }: any),
          },
        },
      },
      expected: [
        ({
          definition: { metadata: { displayCategory: 'A', displayName: 'A' } },
        }: any),
        ({
          definition: { metadata: { displayCategory: 'A', displayName: 'B' } },
        }: any),
        ({
          definition: { metadata: { displayCategory: 'B', displayName: 'A' } },
        }: any),
        ({}: any),
      ],
    },

    {
      name: 'getValidCustomLabware',
      selector: selectors.getValidCustomLabware,
      state: {
        labware: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          filenames: [
            Fixtures.mockValidLabware.filename,
            Fixtures.mockInvalidLabware.filename,
            'foo.json',
          ],
          filesByName: {
            [Fixtures.mockValidLabware.filename]: Fixtures.mockValidLabware,
            [Fixtures.mockInvalidLabware.filename]: Fixtures.mockInvalidLabware,
            'foo.json': ({
              ...Fixtures.mockValidLabware,
              filename: 'foo.json',
            }: ValidLabwareFile),
          },
        },
      },
      expected: [
        Fixtures.mockValidLabware,
        { ...Fixtures.mockValidLabware, filename: 'foo.json' },
      ],
    },
    {
      name: 'getAddLabwareFailure',
      selector: selectors.getAddLabwareFailure,
      state: {
        labware: {
          addFailureFile: Fixtures.mockInvalidLabware,
          addFailureMessage: 'AH',
          listFailureMessage: null,
          filenames: [],
          filesByName: {},
        },
      },
      expected: { file: Fixtures.mockInvalidLabware, errorMessage: 'AH' },
    },
    {
      name: 'getListLabwareErrorMessage',
      selector: selectors.getListLabwareErrorMessage,
      state: {
        labware: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: 'AH',
          filenames: [],
          filesByName: {},
        },
      },
      expected: 'AH',
    },
    {
      name: 'getCustomLabwareDirectory',
      selector: selectors.getCustomLabwareDirectory,
      state: {
        config: ({
          labware: {
            directory: '/path/to/labware',
          },
        }: any),
      },
      expected: '/path/to/labware',
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, expected } = spec
    it(name, () => expect(selector(state)).toEqual(expected))
  })
})
