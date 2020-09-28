// @flow
import noop from 'lodash/noop'

import * as SharedData from '@opentrons/shared-data'
import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'
import * as RobotSelectors from '../../robot/selectors'
import * as POCSelectors from '../../calibration/pipette-offset/selectors'
import * as ConfigSelectors from '../../config/selectors'
import type { State } from '../../types'

jest.mock('@opentrons/shared-data')
jest.mock('../../robot/selectors')
jest.mock('../../calibration/pipette-offset/selectors')
jest.mock('../../config/selectors')

type SelectorSpec = {|
  name: string,
  state: $Shape<State>,
  expected: mixed,
  ready: boolean,
  matching: boolean,
  calibrated: boolean,
  before?: () => mixed,
  after?: () => mixed,
|}

const mockGetFeatureFlags: JestMockFn<
  [State],
  $Call<typeof ConfigSelectors.getFeatureFlags, State>
> = ConfigSelectors.getFeatureFlags

const mockGetPipetteOffsetCalibrations: JestMockFn<
  [State, string],
  $Call<typeof POCSelectors.getPipetteOffsetCalibrations, State, string>
> = POCSelectors.getPipetteOffsetCalibrations

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

const mockLeftPipetteCalibration: any = {
  pipette: 'abc',
  mount: 'left',
  offset: [0, 1, 2],
  tiprack: 'some-tiprack',
  lastModified: '2020-08-30T10:02',
}

const mockRightPipetteCalibration: any = {
  pipette: 'def',
  mount: 'right',
  offset: [1, 2, 3],
  tiprack: 'some-other-tiprack',
  lastModified: '2020-08-25T20:25',
}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'returns nulls by default',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: null,
          settingsById: null,
        },
      },
    },
    expected: {
      left: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        hasOffsetCalibration: true,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        hasOffsetCalibration: true,
      },
    },
    ready: true,
    matching: true,
    calibrated: true,
    before: () => {
      mockGetPipetteOffsetCalibrations.mockReturnValue([])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
    },
  },
  {
    name: 'gets model specs for attached pipettes',
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
        hasOffsetCalibration: true,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...mockRightPipette,
          modelSpecs: mockRightSpecs,
          displayName: 'Right Pipette',
        },
        hasOffsetCalibration: true,
      },
    },
    ready: true,
    matching: true,
    calibrated: true,
    before: () => {
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
    },
  },
  {
    name: 'marks as match if spec names match',
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
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
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
        hasOffsetCalibration: true,
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
        hasOffsetCalibration: true,
      },
    },
    ready: true,
    matching: true,
    calibrated: true,
  },
  {
    name: 'marks as inexact match if spec names match in backcompat',
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
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
    },
    ready: true,
    matching: true,
    calibrated: true,
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
        hasOffsetCalibration: true,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        hasOffsetCalibration: true,
      },
    },
  },
  {
    name: 'uses requestedAs from protocol pipette if available',
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
    ready: true,
    matching: true,
    calibrated: true,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
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
        hasOffsetCalibration: true,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        hasOffsetCalibration: true,
      },
    },
  },
  {
    name: 'ignores missing calibration if ff off',
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
    ready: true,
    matching: true,
    calibrated: true,
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
        hasOffsetCalibration: true,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        hasOffsetCalibration: true,
      },
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([mockLeftProtoPipette])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: false })
    },
  },
  {
    name: 'flags missing calibration if ff on',
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
        hasOffsetCalibration: true,
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
        hasOffsetCalibration: false,
      },
    },
    ready: false,
    matching: true,
    calibrated: false,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
        mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: true })
    },
  },
  {
    name: 'allows pass if ff on and all pipettes ready and calibrated',
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
        hasOffsetCalibration: true,
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
        hasOffsetCalibration: true,
      },
    },
    ready: true,
    matching: true,
    calibrated: true,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
        mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetFeatureFlags.mockReturnValue({ enableCalibrationOverhaul: true })
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
      state,
      expected,
      ready,
      matching,
      calibrated,
      before = noop,
      after = noop,
    } = spec

    it(name, () => {
      before()
      expect(Selectors.getProtocolPipettesInfo(state, 'robotName')).toEqual(
        expected
      )
      expect(Selectors.getProtocolPipettesMatching(state, 'robotName')).toEqual(
        matching
      )
      expect(
        Selectors.getProtocolPipettesCalibrated(state, 'robotName')
      ).toEqual(calibrated)
      expect(Selectors.getProtocolPipettesReady(state, 'robotName')).toEqual(
        ready
      )
      after()
    })
  })
})
