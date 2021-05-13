// @flow
import * as Fixtures from '../__fixtures__'
import { pipettesReducer } from '../reducer'

import type { Action } from '../../types'
import type { PipettesState } from '../types'

type ReducerSpec = {|
  name: string,
  state: PipettesState,
  action: Action,
  expected: PipettesState,
|}

const SPECS: Array<ReducerSpec> = [
  {
    name: 'handles pipettes:FETCH_PIPETTES_SUCCESS',
    action: {
      type: 'pipettes:FETCH_PIPETTES_SUCCESS',
      payload: {
        robotName: 'robotName',
        pipettes: {
          left: Fixtures.mockUnattachedPipette,
          right: Fixtures.mockAttachedPipette,
        },
      },
      meta: {},
    },
    state: {
      robotName: {
        attachedByMount: null,
        settingsById: null,
      },
    },
    expected: {
      robotName: {
        attachedByMount: {
          left: Fixtures.mockUnattachedPipette,
          right: Fixtures.mockAttachedPipette,
        },
        settingsById: null,
      },
    },
  },
  {
    name: 'handles pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS',
    action: {
      type: 'pipettes:FETCH_PIPETTE_SETTINGS_SUCCESS',
      payload: {
        robotName: 'robotName',
        settings: { pipetteId: Fixtures.mockPipetteSettings },
      },
      meta: {},
    },
    state: {
      robotName: {
        attachedByMount: null,
        settingsById: null,
      },
    },
    expected: {
      robotName: {
        attachedByMount: null,
        settingsById: { pipetteId: Fixtures.mockPipetteSettings },
      },
    },
  },
  {
    name: 'handles pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS',
    action: {
      type: 'pipettes:UPDATE_PIPETTE_SETTINGS_SUCCESS',
      payload: {
        robotName: 'robotName',
        pipetteId: 'pipetteId',
        fields: { [('fieldId': string)]: { value: 42, default: 42 } },
      },
      meta: {},
    },
    state: {
      robotName: {
        attachedByMount: null,
        settingsById: {
          pipetteId: {
            info: { name: 'p300_single_gen2', model: 'p300_single_v2.0' },
            fields: { [('fieldId': string)]: { value: 0, default: 42 } },
          },
        },
      },
    },
    expected: {
      robotName: {
        attachedByMount: null,
        settingsById: {
          pipetteId: {
            info: { name: 'p300_single_gen2', model: 'p300_single_v2.0' },
            fields: { [('fieldId': string)]: { value: 42, default: 42 } },
          },
        },
      },
    },
  },
]

describe('pipettesReducer', () => {
  SPECS.forEach(spec => {
    const { name, state, action, expected } = spec
    it(name, () => expect(pipettesReducer(state, action)).toEqual(expected))
  })
})
