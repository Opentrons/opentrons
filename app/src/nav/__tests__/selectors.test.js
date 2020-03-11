// @flow
import noop from 'lodash/noop'

import * as DiscoverySelectors from '../../discovery/selectors'
import * as PipetteSelectors from '../../pipettes/selectors'
import * as RobotSelectors from '../../robot/selectors'
import * as BuildrootSelectors from '../../buildroot/selectors'
import * as ShellSelectors from '../../shell'
import * as Selectors from '../selectors'

import type { State } from '../../types'
import type { Robot, ViewableRobot } from '../../discovery/types'

type SelectorSpec = {|
  name: string,
  selector: State => mixed,
  before?: () => mixed,
  after?: () => mixed,
  expected: mixed,
|}

jest.mock('../../discovery/selectors')
jest.mock('../../pipettes/selectors')
jest.mock('../../buildroot/selectors')
jest.mock('../../shell')
jest.mock('../../robot/selectors')

const mockGetConnectedRobot: JestMockFn<
  [State],
  $Call<typeof DiscoverySelectors.getConnectedRobot, State>
> = DiscoverySelectors.getConnectedRobot

const mockGetProtocolPipettesMatch: JestMockFn<
  [State, string],
  $Call<typeof PipetteSelectors.getProtocolPipettesMatch, State, string>
> = PipetteSelectors.getProtocolPipettesMatch

const mockGetAvailableShellUpdate: JestMockFn<
  [State],
  $Call<typeof ShellSelectors.getAvailableShellUpdate, State>
> = ShellSelectors.getAvailableShellUpdate

const mockGetBuildrootUpdateAvailable: JestMockFn<
  [State, ViewableRobot],
  $Call<
    typeof BuildrootSelectors.getBuildrootUpdateAvailable,
    State,
    ViewableRobot
  >
> = BuildrootSelectors.getBuildrootUpdateAvailable

const mockGetIsRunning: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsRunning, State>
> = RobotSelectors.getIsRunning

const mockGetIsDone: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsDone, State>
> = RobotSelectors.getIsDone

const mockGetSessionIsLoaded: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getSessionIsLoaded, State>
> = RobotSelectors.getSessionIsLoaded

const mockGetCommands: JestMockFn<
  [State],
  any
> = (RobotSelectors.getCommands: any)

const EXPECTED_ROBOTS = {
  id: 'robots',
  path: '/robots',
  title: 'Robot',
  iconName: 'ot-connect',
  notificationReason: null,
}

const EXPECTED_UPLOAD = {
  id: 'upload',
  path: '/upload',
  title: 'Protocol',
  iconName: 'ot-file',
  disabledReason: expect.any(String),
}

const EXPECTED_CALIBRATE = {
  id: 'calibrate',
  path: '/calibrate',
  title: 'Calibrate',
  iconName: 'ot-calibrate',
  disabledReason: expect.any(String),
}

const EXPECTED_RUN = {
  id: 'run',
  path: '/run',
  title: 'Run',
  iconName: 'ot-run',
  disabledReason: expect.any(String),
}

const EXPECTED_MORE = {
  id: 'more',
  path: '/menu',
  title: 'More',
  iconName: 'dots-horizontal',
  notificationReason: null,
}

describe('nav selectors', () => {
  const mockState: State = ({ mockState: true }: any)
  const mockRobot: Robot = ({ mockRobot: true, name: 'mock-robot' }: any)

  beforeEach(() => {
    mockGetConnectedRobot.mockReturnValue(null)
    mockGetProtocolPipettesMatch.mockReturnValue(false)
    mockGetAvailableShellUpdate.mockReturnValue(null)
    mockGetBuildrootUpdateAvailable.mockReturnValue(null)
    mockGetIsRunning.mockReturnValue(false)
    mockGetIsDone.mockReturnValue(false)
    mockGetSessionIsLoaded.mockReturnValue(false)
    mockGetCommands.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS: Array<SelectorSpec> = [
    {
      name: 'getNavbarLocations without any robot',
      selector: Selectors.getNavbarLocations,
      expected: [
        EXPECTED_ROBOTS,
        {
          ...EXPECTED_UPLOAD,
          disabledReason: expect.stringMatching(/connect to a robot/),
        },
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/connect to a robot/),
        },
        {
          ...EXPECTED_RUN,
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
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/load a protocol/),
        },
        {
          ...EXPECTED_RUN,
          disabledReason: expect.stringMatching(/load a protocol/),
        },
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
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/while a run is in progress/),
        },
        EXPECTED_RUN,
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
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/with runnable steps/),
        },
        {
          ...EXPECTED_RUN,
          disabledReason: expect.stringMatching(/with runnable steps/),
        },
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
        ])
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/pipettes do not match/),
        },
        {
          ...EXPECTED_RUN,
          disabledReason: expect.stringMatching(/pipettes do not match/),
        },
        EXPECTED_MORE,
      ],
    },
    {
      name: 'getNavbarLocations with runnable protocol and pipettes compatible',
      selector: Selectors.getNavbarLocations,
      before: () => {
        mockGetConnectedRobot.mockReturnValue(mockRobot)
        mockGetSessionIsLoaded.mockReturnValue(true)
        mockGetCommands.mockReturnValue([
          { id: 0, description: 'Foo', handledAt: null, children: [] },
        ])
        mockGetProtocolPipettesMatch.mockReturnValue(true)
      },
      after: () => {
        expect(mockGetProtocolPipettesMatch).toHaveBeenCalledWith(
          mockState,
          mockRobot.name
        )
      },
      expected: [
        EXPECTED_ROBOTS,
        { ...EXPECTED_UPLOAD, disabledReason: null },
        { ...EXPECTED_CALIBRATE, disabledReason: null },
        { ...EXPECTED_RUN, disabledReason: null },
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
        {
          ...EXPECTED_CALIBRATE,
          disabledReason: expect.stringMatching(/reset your protocol/),
        },
        EXPECTED_RUN,
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
        EXPECTED_CALIBRATE,
        EXPECTED_RUN,
        {
          ...EXPECTED_MORE,
          notificationReason: expect.stringMatching(/update is available/),
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
        EXPECTED_CALIBRATE,
        EXPECTED_RUN,
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
        EXPECTED_CALIBRATE,
        EXPECTED_RUN,
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
