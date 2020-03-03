import * as selectors from '../selectors'
import {
  getViewableRobots,
  getRobotApiVersion,
} from '../../discovery/selectors'

jest.mock('../../discovery/selectors')

describe('buildroot selectors', () => {
  afterEach(() => {
    jest.clearAllMocks()
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
      args: [{ name: 'robot-name' }],
      expected: 'upgrade',
      setup: () => {
        getRobotApiVersion.mockReturnValueOnce('0.9.9')
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
        getRobotApiVersion.mockReturnValueOnce('1.0.1')
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
        getRobotApiVersion.mockReturnValueOnce('1.0.0')
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
        getRobotApiVersion.mockReturnValueOnce('1.0.0')
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
        getViewableRobots.mockReturnValueOnce([
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
        getViewableRobots.mockReturnValueOnce([
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
  ]

  SPECS.forEach(spec => {
    const { name, selector, state, expected, setup } = spec
    const args = spec.args || []
    if (typeof setup === 'function') setup()
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
