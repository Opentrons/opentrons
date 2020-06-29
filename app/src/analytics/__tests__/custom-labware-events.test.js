// @flow

import * as CustomLabware from '../../custom-labware'
import * as LabwareFixtures from '../../custom-labware/__fixtures__'
import type { Action, State } from '../../types'
import { makeEvent } from '../make-event'
import type { AnalyticsEvent } from '../types'

type EventSpec = {|
  name: string,
  action: Action,
  expected: AnalyticsEvent,
|}

const SPECS: Array<EventSpec> = [
  {
    name: 'addCustomLabware success',
    action: CustomLabware.customLabwareList([], CustomLabware.ADD_LABWARE),
    expected: {
      name: 'addCustomLabware',
      properties: { success: true, overwrite: false, error: '' },
      superProperties: { customLabwareCount: 0 },
    },
  },
  {
    name: 'addCustomLabware overwrite success',
    action: CustomLabware.customLabwareList(
      [],
      CustomLabware.OVERWRITE_LABWARE
    ),
    expected: {
      name: 'addCustomLabware',
      properties: { success: true, overwrite: true, error: '' },
      superProperties: { customLabwareCount: 0 },
    },
  },
  {
    name: 'addCustomLabware failure with bad labware',
    action: CustomLabware.addCustomLabwareFailure(
      LabwareFixtures.mockInvalidLabware
    ),
    expected: {
      name: 'addCustomLabware',
      properties: {
        success: false,
        overwrite: false,
        error: 'INVALID_LABWARE_FILE',
      },
    },
  },
  {
    name: 'addCustomLabware failure with system error',
    action: CustomLabware.addCustomLabwareFailure(null, 'AH'),
    expected: {
      name: 'addCustomLabware',
      properties: { success: false, overwrite: false, error: 'AH' },
    },
  },
  {
    name: 'changeLabwareSourceDirectory success',
    action: CustomLabware.customLabwareList([], CustomLabware.CHANGE_DIRECTORY),
    expected: {
      name: 'changeLabwareSourceDirectory',
      properties: { success: true, error: '' },
      superProperties: { customLabwareCount: 0 },
    },
  },
  {
    name: 'changeLabwareSourceDirectory failure',
    action: CustomLabware.customLabwareListFailure(
      'AH',
      CustomLabware.CHANGE_DIRECTORY
    ),
    expected: {
      name: 'changeLabwareSourceDirectory',
      properties: { success: false, error: 'AH' },
    },
  },
  {
    name: 'customLabwareListError on application boot',
    action: CustomLabware.customLabwareListFailure('AH', CustomLabware.INITIAL),
    expected: {
      name: 'customLabwareListError',
      properties: { error: 'AH' },
    },
  },
  {
    name: 'labware:CUSTOM_LABWARE_LIST sets labware count super property',
    action: CustomLabware.customLabwareList(
      [
        LabwareFixtures.mockValidLabware,
        LabwareFixtures.mockValidLabware,
        LabwareFixtures.mockInvalidLabware,
      ],
      CustomLabware.INITIAL
    ),
    expected: expect.objectContaining({
      superProperties: { customLabwareCount: 2 },
    }),
  },
]

const MOCK_STATE: State = ({ mockState: true }: any)

describe('custom labware analytics events', () => {
  SPECS.forEach(spec => {
    const { name, action, expected } = spec
    it(name, () => {
      return expect(makeEvent(action, MOCK_STATE)).resolves.toEqual(expected)
    })
  })
})
