// @flow

import * as Fixtures from '../__fixtures__'
import * as selectors from '../selectors'

import type { State } from '../../types'
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
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, expected } = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
