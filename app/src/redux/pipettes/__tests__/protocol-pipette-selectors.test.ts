import noop from 'lodash/noop'

import * as SharedData from '@opentrons/shared-data'
import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'
import * as RobotSelectors from '../../robot/selectors'
import * as POCSelectors from '../../calibration/pipette-offset/selectors'
import * as ProtocolSelectors from '../../protocol/selectors'
import type { State } from '../../types'

jest.mock('@opentrons/shared-data')
jest.mock('../../robot/selectors')
jest.mock('../../calibration/pipette-offset/selectors')
jest.mock('../../protocol/selectors')

interface SelectorSpec {
  name: string
  state: State
  expected: unknown
  matching: boolean
  calibrated: boolean
  matchingByMount: {
    left: string | null
    right: string | null
  }
  before?: () => unknown
  after?: () => unknown
}

const mockGetPipetteOffsetCalibrations = POCSelectors.getPipetteOffsetCalibrations as jest.MockedFunction<
  typeof POCSelectors.getPipetteOffsetCalibrations
>

const mockGetPipetteModelSpecs = SharedData.getPipetteModelSpecs as jest.MockedFunction<
  typeof SharedData.getPipetteModelSpecs
>

const mockGetPipetteNameSpecs = SharedData.getPipetteNameSpecs as jest.MockedFunction<
  typeof SharedData.getPipetteNameSpecs
>

const mockGetProtocolPipettes = RobotSelectors.getPipettes as jest.MockedFunction<
  typeof RobotSelectors.getPipettes
>

const mockGetProtocolPipetteTipRacks = ProtocolSelectors.getProtocolPipetteTipRacks as jest.MockedFunction<
  typeof ProtocolSelectors.getProtocolPipetteTipRacks
>

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

const SPECS: SelectorSpec[] = [
  {
    name: 'returns nulls by default',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: null,
          settingsById: null,
        },
      },
    } as any,
    expected: {
      left: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        needsOffsetCalibration: false,
      },
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: null,
      right: null,
    },
    before: () => {
      mockGetPipetteOffsetCalibrations.mockReturnValue([])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
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
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...mockRightPipette,
          modelSpecs: mockRightSpecs,
          displayName: 'Right Pipette',
        },
        needsOffsetCalibration: false,
      },
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'match',
      right: 'incompatible',
    },
    before: () => {
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockLeftSpecs, tipRackDefs: [] },
      })
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
    } as any,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        mockLeftProtoPipette,
        mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
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
        needsOffsetCalibration: false,
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
        needsOffsetCalibration: false,
      },
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'match',
      right: 'match',
    },
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
    } as any,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, modelSpecs: mockLeftLegacySpecs },
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'inexact_match',
      right: null,
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
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        needsOffsetCalibration: false,
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
    } as any,
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'inexact_match',
      right: null,
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
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
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: null,
        needsOffsetCalibration: false,
      },
    },
  },
  {
    name: 'flags missing calibration',
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
    } as any,
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
        needsOffsetCalibration: false,
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
        needsOffsetCalibration: true,
      },
    },
    matching: true,
    calibrated: false,
    matchingByMount: {
      left: 'inexact_match',
      right: 'match',
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
        mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'allows pass if all pipettes matching and calibrated',
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
    } as any,
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
        needsOffsetCalibration: false,
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
        needsOffsetCalibration: false,
      },
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'inexact_match',
      right: 'match',
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        { ...mockLeftProtoPipette, requestedAs: mockLeftLegacySpecs.name },
        mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
        mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'allows pass if an unused but attached pipette is not calibrated',
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
    } as any,
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
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...mockRightPipette,
          modelSpecs: mockRightSpecs,
          displayName: 'Right Pipette',
        },
        needsOffsetCalibration: false,
      },
    },
    matching: true,
    calibrated: true,
    matchingByMount: {
      left: 'match',
      right: 'match',
    },
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([mockLeftProtoPipette])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        mockLeftPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: mockRightSpecs, tipRackDefs: [] },
      })
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
      matching,
      calibrated,
      matchingByMount,
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
      expect(Selectors.getProtocolPipettesMatch(state, 'robotName')).toEqual(
        matchingByMount
      )
      after()
    })
  })
})
