// @flow

import { getPipetteModelSpecs } from '@opentrons/shared-data'

import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'
import * as Selectors from '../selectors'

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getAttachedPipettes returns no attached pipettes by default',
    selector: Selectors.getAttachedPipettes,
    state: { pipettes: {} },
    args: ['robotName'],
    expected: { left: null, right: null },
  },
  {
    name: 'getAttachedPipettes returns attached pipettes by mount',
    selector: Selectors.getAttachedPipettes,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockUnattachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
          settingsById: null,
        },
      },
    },
    args: ['robotName'],
    expected: {
      left: null,
      right: {
        ...Fixtures.mockAttachedPipette,
        modelSpecs: getPipetteModelSpecs(Fixtures.mockAttachedPipette.model),
      },
    },
  },
  {
    name: 'getAttachedPipetteSettings returns pipette settings by mount',
    selector: Selectors.getAttachedPipetteSettings,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockUnattachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
          settingsById: {
            [Fixtures.mockAttachedPipette.id]: Fixtures.mockPipetteSettings,
          },
        },
      },
    },
    args: ['robotName'],
    expected: { left: null, right: Fixtures.mockPipetteSettings.fields },
  },
]

describe('robot api selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
