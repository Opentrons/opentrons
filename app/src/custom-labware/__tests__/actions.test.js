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
      name: 'customLabwareList',
      creator: actions.customLabwareList,
      args: [
        [
          { type: 'INVALID_LABWARE_FILE', filename: 'a.json', created: 0 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 1 },
        ],
      ],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST',
        payload: [
          { type: 'INVALID_LABWARE_FILE', filename: 'a.json', created: 0 },
          { type: 'INVALID_LABWARE_FILE', filename: 'b.json', created: 1 },
        ],
      },
    },
    {
      name: 'customLabwareListFailure',
      creator: actions.customLabwareListFailure,
      args: ['AH!'],
      expected: {
        type: 'labware:CUSTOM_LABWARE_LIST_FAILURE',
        payload: { message: 'AH!' },
      },
    },
    {
      name: 'changeLabwareDirectory',
      creator: actions.changeCustomLabwareDirectory,
      args: [],
      expected: {
        type: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY',
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabware without overwrite',
      creator: actions.addCustomLabware,
      args: [],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE',
        payload: { overwrite: null },
        meta: { shell: true },
      },
    },
    {
      name: 'addCustomLabwareFailure with failed labware',
      creator: actions.addCustomLabwareFailure,
      args: [{ type: 'INVALID_LABWARE_FILE', filename: 'a.json', created: 0 }],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: {
          message: null,
          labware: {
            type: 'INVALID_LABWARE_FILE',
            filename: 'a.json',
            created: 0,
          },
        },
      },
    },
    {
      name: 'addCustomLabwareFailure with error message',
      creator: actions.addCustomLabwareFailure,
      args: [null, 'AH'],
      expected: {
        type: 'labware:ADD_CUSTOM_LABWARE_FAILURE',
        payload: { labware: null, message: 'AH' },
      },
    },
    {
      name: 'clearAddCustomLabwareFailure',
      creator: actions.clearAddCustomLabwareFailure,
      args: [],
      expected: { type: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE' },
    },
  ]

  SPECS.forEach(spec => {
    const { name, creator, expected, args = [] } = spec
    test(name, () => expect(creator(...args)).toEqual(expected))
  })
})
