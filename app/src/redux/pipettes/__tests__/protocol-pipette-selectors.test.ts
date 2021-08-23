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
        left: { pipetteSpecs: Fixtures.mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'gets model specs for attached pipettes',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockRightPipette,
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
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
          displayName: 'Left Pipette',
        },
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...Fixtures.mockRightPipette,
          modelSpecs: Fixtures.mockRightSpecs,
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
        Fixtures.mockLeftPipetteCalibration,
        Fixtures.mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockLeftSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'marks as match if spec names match',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockRightPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        Fixtures.mockLeftProtoPipette,
        Fixtures.mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
        Fixtures.mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
    expected: {
      left: {
        compatibility: 'match',
        protocol: {
          ...Fixtures.mockLeftProtoPipette,
          displayName: 'Left Pipette',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
          displayName: 'Left Pipette',
        },
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: {
          ...Fixtures.mockRightProtoPipette,
          displayName: 'Right Pipette',
        },
        actual: {
          ...Fixtures.mockRightPipette,
          modelSpecs: Fixtures.mockRightSpecs,
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
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockUnattachedPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    before: () => {
      mockGetProtocolPipettes.mockReturnValue([
        {
          ...Fixtures.mockLeftProtoPipette,
          modelSpecs: Fixtures.mockLeftLegacySpecs,
        },
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
        Fixtures.mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
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
          ...Fixtures.mockLeftProtoPipette,
          modelSpecs: Fixtures.mockLeftLegacySpecs,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
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
            left: Fixtures.mockLeftPipette,
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
        {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
        },
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
        Fixtures.mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
    expected: {
      left: {
        compatibility: 'inexact_match',
        protocol: {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
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
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockRightPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    expected: {
      left: {
        compatibility: 'inexact_match',
        protocol: {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
          displayName: 'Left Pipette',
        },
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: {
          ...Fixtures.mockRightProtoPipette,
          displayName: 'Right Pipette',
        },
        actual: {
          ...Fixtures.mockRightPipette,
          modelSpecs: Fixtures.mockRightSpecs,
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
        {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
        },
        Fixtures.mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'allows pass if all pipettes matching and calibrated',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockRightPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    expected: {
      left: {
        compatibility: 'inexact_match',
        protocol: {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
          displayName: 'Left Pipette Legacy',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
          displayName: 'Left Pipette',
        },
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: {
          ...Fixtures.mockRightProtoPipette,
          displayName: 'Right Pipette',
        },
        actual: {
          ...Fixtures.mockRightPipette,
          modelSpecs: Fixtures.mockRightSpecs,
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
        {
          ...Fixtures.mockLeftProtoPipette,
          requestedAs: Fixtures.mockLeftLegacySpecs.name,
        },
        Fixtures.mockRightProtoPipette,
      ])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
        Fixtures.mockRightPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftLegacySpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
  {
    name: 'allows pass if an unused but attached pipette is not calibrated',
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockLeftPipette,
            right: Fixtures.mockRightPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    expected: {
      left: {
        compatibility: 'match',
        protocol: {
          ...Fixtures.mockLeftProtoPipette,
          displayName: 'Left Pipette',
        },
        actual: {
          ...Fixtures.mockLeftPipette,
          modelSpecs: Fixtures.mockLeftSpecs,
          displayName: 'Left Pipette',
        },
        needsOffsetCalibration: false,
      },
      right: {
        compatibility: 'match',
        protocol: null,
        actual: {
          ...Fixtures.mockRightPipette,
          modelSpecs: Fixtures.mockRightSpecs,
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
      mockGetProtocolPipettes.mockReturnValue([Fixtures.mockLeftProtoPipette])
      mockGetPipetteOffsetCalibrations.mockReturnValue([
        Fixtures.mockLeftPipetteCalibration,
      ])
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: { pipetteSpecs: Fixtures.mockLeftSpecs, tipRackDefs: [] },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
  },
]

describe('protocol pipettes comparison selectors', () => {
  beforeEach(() => {
    mockGetProtocolPipettes.mockReturnValue([])

    mockGetPipetteModelSpecs.mockImplementation(model => {
      if (model === Fixtures.mockLeftPipette.model)
        return Fixtures.mockLeftSpecs
      if (model === Fixtures.mockRightPipette.model)
        return Fixtures.mockRightSpecs
      return null
    })

    mockGetPipetteNameSpecs.mockImplementation(name => {
      if (name === Fixtures.mockLeftLegacySpecs.name)
        return Fixtures.mockLeftLegacySpecs
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
