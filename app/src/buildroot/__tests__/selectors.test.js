import * as selectors from '../selectors'
import { mockReachableRobot } from '../../discovery/__fixtures__'
import {
  HEALTH_STATUS_NOT_OK,
  getViewableRobots,
  getRobotApiVersionByName,
  getRobotByName,
} from '../../discovery'

jest.mock('../../discovery/selectors')

describe('buildroot selectors', () => {
  beforeEach(() => {
    getViewableRobots.mockReturnValue([])
    getRobotApiVersionByName.mockReturnValue(null)
    getRobotByName.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const SPECS = [
    {
      name: 'getBuildrootUpdateInfo',
      selector: selectors.getBuildrootUpdateInfo,
      state: {
        buildroot: {
          info: {
            releaseNotes: 'some release notes',
          },
        },
      },
      expected: {
        releaseNotes: 'some release notes',
      },
    },
    {
      name: 'getBuildrootTargetVersion with auto-downloaded file',
      selector: selectors.getBuildrootTargetVersion,
      state: { buildroot: { version: '1.0.0' } },
      expected: '1.0.0',
    },
    {
      name: 'getBuildrootTargetVersion with user file',
      selector: selectors.getBuildrootTargetVersion,
      state: {
        buildroot: {
          version: '1.0.0',
          session: { userFileInfo: { version: '1.0.1' } },
        },
      },
      expected: '1.0.1',
    },
    {
      name: 'getBuildrootDownloadError',
      selector: selectors.getBuildrootDownloadError,
      state: {
        buildroot: {
          downloadError: 'error with download',
        },
      },
      expected: 'error with download',
    },
    {
      name: 'getBuildrootDownloadProgress',
      selector: selectors.getBuildrootDownloadProgress,
      state: {
        buildroot: {
          downloadProgress: 10,
        },
      },
      expected: 10,
    },
    {
      name: 'getBuildrootUpdateSeen',
      selector: selectors.getBuildrootUpdateSeen,
      state: {
        buildroot: {
          seen: false,
        },
      },
      expected: false,
    },
    {
      name: 'getBuildrootUpdateAvailable with lesser version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        buildroot: {
          version: '1.0.0',
        },
      },
      args: ['robot-name'],
      expected: 'upgrade',
      setup: () => {
        getRobotApiVersionByName.mockReturnValue('0.9.9')
      },
    },
    {
      name: 'getBuildrootUpdateAvailable with greater version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        buildroot: {
          version: '1.0.0',
        },
      },
      args: [{ name: 'robot-name' }],
      expected: 'downgrade',
      setup: () => {
        getRobotApiVersionByName.mockReturnValue('1.0.1')
      },
    },
    {
      name: 'getBuildrootUpdateAvailable with same version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        buildroot: {
          version: '1.0.0',
        },
      },
      args: [{ name: 'robot-name' }],
      expected: 'reinstall',
      setup: () => {
        getRobotApiVersionByName.mockReturnValue('1.0.0')
      },
    },
    {
      name: 'getBuildrootUpdateAvailable with no update available',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        buildroot: {
          version: null,
        },
      },
      args: [{ name: 'robot-name' }],
      expected: null,
      setup: () => {
        getRobotApiVersionByName.mockReturnValue('1.0.0')
      },
    },
    {
      name: 'getBuildrootUpdateSession',
      selector: selectors.getBuildrootSession,
      state: {
        buildroot: {
          session: { robotName: 'robot-name', token: null, pathPrefix: null },
        },
      },
      expected: { robotName: 'robot-name', token: null, pathPrefix: null },
    },
    {
      name: 'getBuildrootRobotName',
      selector: selectors.getBuildrootRobotName,
      state: {
        buildroot: {
          session: { robotName: 'robot-name', token: null, pathPrefix: null },
        },
      },
      expected: 'robot-name',
    },
    {
      name: 'getBuildrootRobot',
      selector: selectors.getBuildrootRobot,
      state: {
        buildroot: {
          session: { robotName: 'robot-name' },
        },
      },
      expected: { name: 'robot-name', host: '10.10.0.0', port: 31950 },
      setup: () =>
        getViewableRobots.mockReturnValue([
          { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
          { name: 'robot-name', host: '10.10.0.0', port: 31950 },
          { name: 'another-robot-name', host: '10.10.0.2', port: 31950 },
        ]),
    },
    {
      name: 'getBuildrootRobot after migration with opentrons-robot-name',
      selector: selectors.getBuildrootRobot,
      state: {
        buildroot: {
          session: { robotName: 'opentrons-robot-name' },
        },
      },
      expected: {
        name: 'robot-name',
        host: '10.10.0.0',
        port: 31950,
        serverHealth: { capabilities: { buildrootUpdate: '/' } },
      },
      setup: () =>
        getViewableRobots.mockReturnValue([
          { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
          {
            name: 'robot-name',
            host: '10.10.0.0',
            port: 31950,
            serverHealth: { capabilities: { buildrootUpdate: '/' } },
          },
          { name: 'another-robot-name', host: '10.10.0.2', port: 31950 },
        ]),
    },
    {
      name: 'getBuildrootUpdateDisplayInfo returns not responding if no robot',
      selector: selectors.getBuildrootUpdateDisplayInfo,
      state: { buildroot: {} },
      setup: () => {
        getRobotByName.mockReturnValue(null)
      },
      expected: expect.objectContaining({
        autoUpdateDisabledReason: expect.stringMatching(
          /update server is not responding/
        ),
        updateFromFileDisabledReason: expect.stringMatching(
          /update server is not responding/
        ),
      }),
    },
    {
      name:
        'getBuildrootUpdateDisplayInfo returns not responding if robot has unhealthy update server',
      selector: selectors.getBuildrootUpdateDisplayInfo,
      state: { buildroot: {} },
      setup: () => {
        getRobotByName.mockReturnValue({
          ...mockReachableRobot,
          serverHealthStatus: HEALTH_STATUS_NOT_OK,
        })
      },
      expected: expect.objectContaining({
        autoUpdateDisabledReason: expect.stringMatching(
          /update server is not responding/
        ),
        updateFromFileDisabledReason: expect.stringMatching(
          /update server is not responding/
        ),
      }),
    },
    {
      name:
        'getBuildrootUpdateDisplayInfo returns not allowed if another robot is updating',
      selector: selectors.getBuildrootUpdateDisplayInfo,
      state: { buildroot: { session: { robotName: 'other-robot-name' } } },
      setup: () => {
        getRobotByName.mockImplementation((state, name) => {
          return { ...mockReachableRobot, name }
        })
        getViewableRobots.mockReturnValue([
          { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
        ])
      },
      expected: expect.objectContaining({
        autoUpdateDisabledReason: expect.stringMatching(
          /updating a different robot/
        ),
        updateFromFileDisabledReason: expect.stringMatching(
          /updating a different robot/
        ),
      }),
    },
    {
      name:
        'getBuildrootUpdateDisplayInfo returns allowed only from file if no auto files',
      selector: selectors.getBuildrootUpdateDisplayInfo,
      state: { buildroot: {} },
      setup: () => {
        getRobotByName.mockReturnValue(mockReachableRobot)
      },
      expected: {
        autoUpdateAction: expect.stringMatching(/unavailable/i),
        autoUpdateDisabledReason: expect.stringMatching(
          /no update files found/i
        ),
        updateFromFileDisabledReason: null,
      },
    },
    {
      name:
        'getBuildrootUpdateDisplayInfo returns allowed with action if all good',
      selector: selectors.getBuildrootUpdateDisplayInfo,
      state: { buildroot: { version: '1.0.0' } },
      setup: () => {
        getRobotByName.mockReturnValue(mockReachableRobot)
        getRobotApiVersionByName.mockReturnValue('0.9.9')
      },
      expected: {
        autoUpdateAction: expect.stringMatching(/upgrade/i),
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      },
    },
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, expected, setup } = spec
    const args = spec.args || []

    it(name, () => {
      if (typeof setup === 'function') setup()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
