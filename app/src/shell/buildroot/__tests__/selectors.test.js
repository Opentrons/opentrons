import * as selectors from '../selectors'
import { getViewableRobots } from '../../../discovery/selectors'

jest.mock('../../../discovery/selectors')

describe('app/shell/buildroot selectors', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const SPECS = [
    {
      name: 'getBuildrootUpdateInfo',
      selector: selectors.getBuildrootUpdateInfo,
      state: {
        shell: {
          buildroot: {
            info: {
              releaseNotes: 'some release notes',
              version: '1.0.0',
            },
          },
        },
      },
      expected: {
        releaseNotes: 'some release notes',
        version: '1.0.0',
      },
    },
    {
      name: 'getBuildrootTargetVersion with auto-downloaded file',
      selector: selectors.getBuildrootTargetVersion,
      state: { shell: { buildroot: { info: { version: '1.0.0' } } } },
      expected: '1.0.0',
    },
    {
      name: 'getBuildrootTargetVersion with user file',
      selector: selectors.getBuildrootTargetVersion,
      state: {
        shell: {
          buildroot: {
            info: { version: '1.0.0' },
            session: { userFileInfo: { version: '1.0.1' } },
          },
        },
      },
      expected: '1.0.1',
    },
    {
      name: 'getBuildrootDownloadError',
      selector: selectors.getBuildrootDownloadError,
      state: {
        shell: {
          buildroot: {
            downloadError: 'error with download',
          },
        },
      },
      expected: 'error with download',
    },
    {
      name: 'getBuildrootDownloadProgress',
      selector: selectors.getBuildrootDownloadProgress,
      state: {
        shell: {
          buildroot: {
            downloadProgress: 10,
          },
        },
      },
      expected: 10,
    },
    {
      name: 'getBuildrootUpdateSeen',
      selector: selectors.getBuildrootUpdateSeen,
      state: {
        shell: {
          buildroot: {
            seen: false,
          },
        },
      },
      expected: false,
    },
    {
      name: 'getBuildrootUpdateAvailable with lesser version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        shell: {
          buildroot: {
            info: { version: '1.0.0' },
          },
        },
      },
      args: ['0.9.9'],
      expected: true,
    },
    {
      name: 'getBuildrootUpdateAvailable with greater version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        shell: {
          buildroot: {
            info: { version: '1.0.0' },
          },
        },
      },
      args: ['1.0.1'],
      expected: false,
    },
    {
      name: 'getBuildrootUpdateAvailable with same version',
      selector: selectors.getBuildrootUpdateAvailable,
      state: {
        shell: {
          buildroot: {
            info: { version: '1.0.0' },
          },
        },
      },
      args: ['1.0.0'],
      expected: false,
    },
    {
      name: 'getBuildrootUpdateSession',
      selector: selectors.getBuildrootSession,
      state: {
        shell: {
          buildroot: {
            session: { robotName: 'robot-name', token: null, pathPrefix: null },
          },
        },
      },
      expected: { robotName: 'robot-name', token: null, pathPrefix: null },
    },
    {
      name: 'getBuildrootRobotName',
      selector: selectors.getBuildrootRobotName,
      state: {
        shell: {
          buildroot: {
            session: { robotName: 'robot-name', token: null, pathPrefix: null },
          },
        },
      },
      expected: 'robot-name',
    },
    {
      name: 'getBuildrootRobot',
      selector: selectors.getBuildrootRobot,
      state: {
        shell: {
          buildroot: {
            session: { robotName: 'robot-name' },
          },
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
        shell: {
          buildroot: {
            session: { robotName: 'opentrons-robot-name' },
          },
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
    test(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})
