import noop from 'lodash/noop'

import * as ConfigSelectors from '../../config/selectors'
import * as CalibrationSelectors from '../../calibration/selectors'
import * as DiscoverySelectors from '../../discovery/selectors'
import * as PipetteSelectors from '../../pipettes/selectors'
import * as ProtocolSelectors from '../../protocol/selectors'
import * as RobotSelectors from '../../robot/selectors'
import * as BuildrootSelectors from '../../buildroot/selectors'
import * as ShellSelectors from '../../shell'
import * as SystemInfoSelectors from '../../system-info/selectors'
import * as Selectors from '../selectors'

import { NOT_APPLICABLE, OUTDATED } from '../../system-info'

import { DECK_CAL_STATUS_OK, DECK_CAL_STATUS_IDENTITY } from '../../calibration'
import type { State } from '../../types'
import type { Robot } from '../../discovery/types'

interface SelectorSpec {
  name: string
  selector: (state: State) => unknown
  before?: () => unknown
  after?: () => unknown
  expected: unknown
}

jest.mock('../../config/selectors')
jest.mock('../../calibration/selectors')
jest.mock('../../discovery/selectors')
jest.mock('../../pipettes/selectors')
jest.mock('../../protocol/selectors')
jest.mock('../../buildroot/selectors')
jest.mock('../../system-info/selectors')
jest.mock('../../shell')
jest.mock('../../robot/selectors')

const mockGetFeatureFlags = ConfigSelectors.getFeatureFlags as jest.MockedFunction<
  typeof ConfigSelectors.getFeatureFlags
>
const mockGetConnectedRobot = DiscoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof DiscoverySelectors.getConnectedRobot
>
const mockGetProtocolData = ProtocolSelectors.getProtocolData as jest.MockedFunction<
  typeof ProtocolSelectors.getProtocolData
>
const mockGetProtocolPipettesMatching = PipetteSelectors.getProtocolPipettesMatching as jest.MockedFunction<
  typeof PipetteSelectors.getProtocolPipettesMatching
>
const mockGetProtocolPipettesCalibrated = PipetteSelectors.getProtocolPipettesCalibrated as jest.MockedFunction<
  typeof PipetteSelectors.getProtocolPipettesCalibrated
>
const mockGetAvailableShellUpdate = ShellSelectors.getAvailableShellUpdate as jest.MockedFunction<
  typeof ShellSelectors.getAvailableShellUpdate
>
const mockGetU2EWindowsDriverStatus = SystemInfoSelectors.getU2EWindowsDriverStatus as jest.MockedFunction<
  typeof SystemInfoSelectors.getU2EWindowsDriverStatus
>
const mockGetBuildrootUpdateAvailable = BuildrootSelectors.getBuildrootUpdateAvailable as jest.MockedFunction<
  typeof BuildrootSelectors.getBuildrootUpdateAvailable
>

const mockGetIsRunning = RobotSelectors.getIsRunning as jest.MockedFunction<
  typeof RobotSelectors.getIsRunning
>

const mockGetIsDone = RobotSelectors.getIsDone as jest.MockedFunction<
  typeof RobotSelectors.getIsDone
>

const mockGetSessionIsLoaded = RobotSelectors.getSessionIsLoaded as jest.MockedFunction<
  typeof RobotSelectors.getSessionIsLoaded
>

const mockGetCommands = RobotSelectors.getCommands as jest.MockedFunction<
  typeof RobotSelectors.getCommands
>

const mockGetDeckCalibrationStatus = CalibrationSelectors.getDeckCalibrationStatus as jest.MockedFunction<
  typeof CalibrationSelectors.getDeckCalibrationStatus
>

const EXPECTED_ROBOTS = {
  id: 'robots',
  path: '/robots',
  title: 'Robot',
  iconName: 'ot-connect',
  notificationReason: null,
  warningReason: null,
}

const EXPECTED_UPLOAD = {
  id: 'upload',
  path: '/upload',
  title: 'Protocol',
  iconName: 'ot-file',
  disabledReason: expect.any(String),
}

const EXPECTED_MORE = {
  id: 'more',
  path: '/more',
  title: 'More',
  iconName: 'dots-horizontal',
  notificationReason: null,
}

// TODO(sb, 2020-11-23) rip out unneccessary tests during PUR cleanup

describe('nav selectors', () => {
  const mockState: State = { mockState: true } as any
  const mockRobot: Robot = { mockRobot: true, name: 'mock-robot' } as any

  beforeEach(() => {
    mockGetFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
    })
    mockGetConnectedRobot.mockReturnValue(null)
    mockGetProtocolData.mockReturnValue(null)
    mockGetProtocolPipettesMatching.mockReturnValue(false)
    mockGetProtocolPipettesCalibrated.mockReturnValue(false)
    mockGetAvailableShellUpdate.mockReturnValue(null)
    mockGetBuildrootUpdateAvailable.mockReturnValue(null)
    mockGetIsRunning.mockReturnValue(false)
    mockGetIsDone.mockReturnValue(false)
    mockGetSessionIsLoaded.mockReturnValue(false)
    mockGetCommands.mockReturnValue([])
    mockGetU2EWindowsDriverStatus.mockReturnValue(NOT_APPLICABLE)
    mockGetDeckCalibrationStatus.mockReturnValue(DECK_CAL_STATUS_OK)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS: SelectorSpec[] = [
    {
      name: 'getNavbarLocations without any robot',
      selector: Selectors.getNavbarLocations,
      expected: [
        EXPECTED_ROBOTS,
        {
          ...EXPECTED_UPLOAD,
          disabledReason: expect.stringMatching(/connect to a robot/),
        },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with robot and no protocol',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with robot and protocol running',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetIsRunning.mockReturnValue(true)
      },
      expected: [
        EXPECTED_ROBOTS,
        {
          ...EXPECTED_UPLOAD,
          disabledReason: expect.stringMatching(/while a run is in progress/),
        },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with non-runnable protocol loaded',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetSessionIsLoaded.mockReturnValue(true)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name:
        'getNavbarLocations with runnable protocol but pipettes incompatible',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetSessionIsLoaded.mockReturnValue(true)
        mockGetCommands.mockReturnValue([
          { id: 0, description: 'Foo', handledAt: null, children: [] },
        ] as any)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name:
        'getNavbarLocations with runnable protocol and matching but uncalibrated pipettes',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetSessionIsLoaded.mockReturnValue(true)
        mockGetCommands.mockReturnValue([
          { id: 0, description: 'Foo', handledAt: null, children: [] },
        ] as any)
        mockGetProtocolPipettesMatching.mockReturnValue(true)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with bad deck calibration',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetDeckCalibrationStatus.mockReturnValue(DECK_CAL_STATUS_IDENTITY)
      },
      expected: [
        {
          ...EXPECTED_ROBOTS,
          warningReason: expect.stringMatching(/Robot calibration recommended/),
        },
        {
          ...EXPECTED_UPLOAD,
          disabledReason: expect.stringMatching(/calibrate your deck/i),
        },
        EXPECTED_MORE,
      ],
    },
    {
      name:
        'getNavbarLocations with runnable protocol and pipettes compatible and calibrated',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetSessionIsLoaded.mockReturnValue(true)
        mockGetCommands.mockReturnValue([
          { id: 0, description: 'Foo', handledAt: null, children: [] },
        ] as any)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with protocol run finished',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetIsDone.mockReturnValue(true)
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with notification for app update',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetAvailableShellUpdate.mockReturnValue('42.0.0')
      },
      expected: [
        EXPECTED_ROBOTS,
        EXPECTED_UPLOAD,
        {
          ...EXPECTED_MORE,
          notificationReason: expect.stringMatching(/app update is available/),
        },
      ],
    },
    {
      name: 'getNavbarLocations with notification for driver update',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetU2EWindowsDriverStatus.mockReturnValue(OUTDATED)
      },
      expected: [
        EXPECTED_ROBOTS,
        EXPECTED_UPLOAD,
        {
          ...EXPECTED_MORE,
          notificationReason: expect.stringMatching(
            /driver update is available/
          ),
        },
      ],
    },
    {
      name: 'getNavbarLocations with notification for connected robot upgrade',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetBuildrootUpdateAvailable.mockReturnValue('upgrade')
      },
      after: () => {
        expect(mockGetBuildrootUpdateAvailable).toHaveBeenCalledWith(
          mockState,
          mockRobot
        )
      },
      expected: [
        {
          ...EXPECTED_ROBOTS,
          notificationReason: expect.stringMatching(/update is available/),
        },
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
    {
      name:
        'getNavbarLocations with no notification for connected robot downgrade',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetBuildrootUpdateAvailable.mockReturnValue('downgrade')
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        EXPECTED_MORE,
      ],
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, expected, before = noop, after = noop } = spec
    const state = { ...mockState }

    it(name, () => {
      before()
      expect(selector(state)).toEqual(expected)
      after()
    })
  })
})
