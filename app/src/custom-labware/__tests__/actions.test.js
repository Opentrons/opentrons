// @flow
import * as actions from '../actions'
import type { CustomLabwareAction } from '../types'

type ActionSpec = {|
  name: string,
  creator: (...Array<any>) => mixed,
  args?: Array<mixed>,
  expected: CustomLabwareAction,
|}

describe('custom labware actions', () => {
  const SPECS: Array<ActionSpec> = [
    {
      name: 'fetchCustomLabware',
      creator: actions.fetchCustomLabware,
      expected: { type: 'labware:FETCH_CUSTOM_LABWARE', meta: { shell: true } },
    },
    {
      name: 'customLabware',
      creator: actions.customLabware,
      args: [
        [
          { type: 'INVALID_LABWARE_FILE', filename: 'a.json', created: 0 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 1 },
        ],
      ],
      expected: {
        type: 'labware:CUSTOM_LABWARE',
        payload: [
          { type: 'INVALID_LABWARE_FILE', filename: 'a.json', created: 0 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 1 },
        ],
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, expected, args = [] } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
