// @flow
import * as SharedData from '@opentrons/shared-data'
import noop from 'lodash/noop'

import * as Fixtures from '../__fixtures__'
import * as RobotSelectors from '../../robot/selectors'
import type { State } from '../../types'
import * as Selectors from '../selectors'

jest.mock('@opentrons/shared-data')
jest.mock('../../robot/selectors')

type SelectorSpec = {|
  name: string,
  selector: (State, string) => mixed,
  state: $Shape<State>,
  expected: mixed,
  before?: () => mixed,
  after?: () => mixed,
|}

const mockGetPipetteModelSpecs: JestMockFn<
  [string],
  $Call<typeof SharedData.getPipetteModelSpecs, string>
> = SharedData.getPipetteModelSpecs

const mockGetPipetteNameSpecs: JestMockFn<
  [string],
  $Call<typeof SharedData.getPipetteNameSpecs, string>
> = SharedData.getPipetteNameSpecs

const mockGetProtocolPipettes: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getPipettes, State>
> = RobotSelectors.getPipettes

const mockLeftPipette: any = {
  id: 'abc',
  model: 'mock_left_model',
}

const mockRightPipette: any = {
  id: 'def',
  model: 'mock_right_model',
}

const mockLeftSpecs: any = {
  displayName: 'Left Pipette',
  name: 'mock_left',
  backCompatNames: ['mock_left_legacy'],
}

const mockLeftLegacySpecs: any = {
  displayName: 'Left Pipette Legacy',
  name: 'mock_left_legacy',
}

const mockRightSpecs: any = {
  displayName: 'Right Pipette',
  name: 'mock_right',
}

// NOTE: protocol pipettes use "name" for the exact "model" because reasons
const mockLeftProtoPipette: any = {
  mount: 'left',
  name: 'mock_left_model',
  modelSpecs: mockLeftSpecs,
}

const mockRightProtoPipette: any = {
  mount: 'right',
  name: 'mock_right_model',
  modelSpecs: mockRightSpecs,
}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'returns nulls by default',
    selector: Selectors.getProtocolPipettesInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: null,
          settingsById: null,
        },
      },
    },
    expected: {
      left: { compatibility: 'match', protocol: null, actual: null },
      right: { compatibility: 'match', protocol: null, actual: null },
    },
  },
  {
    name: 'gets model specs for attached pipettes',
    selector: Selectors.getProtocolPipettesInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: mockLeftPipette,
            right: mockRightPipette,
          },
          settingsById: null,
        },
      },
    },
    expected: {
      left: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...mockLeftPipette,
          modelSpecs: mockLeftSpecs,
          displayName: 'Left Pipette',
        },
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...mockRightPipette,
          modelSpecs: mockRightSpecs,
          displayName: 'Right Pipette',
        },
      },
    },
  },
  {
    name: 'marks as match if spec names match',
    selector: Selectors.getProtocolPipettesInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: mockLeftPipette,
            right: mockRightPipette,
          },
          settingsById: null,
        },
      },
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        mockLeftProtoPipette,
        mockRightProtoPipette,
      ])
    },
    expected: {
      left: {
        compatibility: 'match',
        protocol: {
          ...mockLeftProtoPipette,
          displayName: 'Left Pipette',
        },
        actual: {
          ...mockLeftPipette,
          modelSpecs: mockLeftSpecs,
          displayName: 'Left Pipette',
        },
      },
      right: {
        compatibility: 'match',
        protocol: {
          ...mockRightProtoPipette,
          displayName: 'Right Pipette',
        },
        actual: {
          ...mockRightPipette,
          modelSpecs: mockRightSpecs,
          displayName: 'Right Pipette',
        },
      },
    },
  },
  {
    name: 'marks as inexact match if spec names match in backcompat',
    selector: Selectors.getProtocolPipettesInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: mockLeftPipette,
            right: Fixtures.mockUnattachedPipette,
          },
          settingsById: null,
        },
      },
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, modelSpecs: mockLeftLegacySpecs },
      ])
    },
    expected: {
      left: {
        compatibility: 'inexact_match',
        protocol: {
          ...mockLeftProtoPipette,
          modelSpecs: mockLeftLegacySpecs,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...mockLeftPipette,
          modelSpecs: mockLeftSpecs,
          displayName: 'Left Pipette',
        },
      },
      right: { compatibility: 'match', protocol: null, actual: null },
    },
  },
  {
    name: 'uses requestedAs from protocol pipette if available',
    selector: Selectors.getProtocolPipettesInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: mockLeftPipette,
            right: Fixtures.mockUnattachedPipette,
          },
          settingsById: null,
        },
      },
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
      ])
    },
    expected: {
      left: {
        compatibility: 'inexact_match',
        protocol: {
          ...mockLeftProtoPipette,
          requestedAs: mockLeftLegacySpecs.name,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...mockLeftPipette,
          modelSpecs: mockLeftSpecs,
          displayName: 'Left Pipette',
        },
      },
      right: { compatibility: 'match', protocol: null, actual: null },
    },
  },
]

describe('protocol pipettes comparison selectors', () => {
  beforeEach(() => {
    mockGetProtocolPipettes.mockReturnValue([])

    mockGetPipetteModelSpecs.mockImplementation(model => {
      if (model === mockLeftPipette.model) return mockLeftSpecs
      if (model === mockRightPipette.model) return mockRightSpecs
      return null
    })

    mockGetPipetteNameSpecs.mockImplementation(name => {
      if (name === mockLeftLegacySpecs.name) return mockLeftLegacySpecs
      return null
    })
  })

  SPECS.forEach(spec => {
    const {
      name,
      selector,
      state,
      expected,
      before = noop,
      after = noop,
    } = spec

    it(name, () => {
      before()
      expect(selector(state, 'robotName')).toEqual(expected)
      after()
    })
  })
})
