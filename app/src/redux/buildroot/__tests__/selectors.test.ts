import * as selectors from '../selectors'
import * as Constants from '../constants'
import { mockReachableRobot } from '../../discovery/__fixtures__'
import { HEALTH_STATUS_NOT_OK } from '../../discovery'
import * as discoSelectors from '../../discovery/selectors'

import type { State } from '../../types'

jest.mock('../../discovery/selectors')

const getViewableRobots = discoSelectors.getViewableRobots as jest.MockedFunction<
  typeof discoSelectors.getViewableRobots
>
const getRobotApiVersion = discoSelectors.getRobotApiVersion as jest.MockedFunction<
  typeof discoSelectors.getRobotApiVersion
>
const getRobotByName = discoSelectors.getRobotByName as jest.MockedFunction<
  typeof discoSelectors.getRobotByName
>

describe('buildroot selectors', () => {
  beforeEach(() => {
    getViewableRobots.mockReturnValue([])
    getRobotApiVersion.mockReturnValue(null)
    getRobotByName.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should get buildroot update info', () => {
    const state: State = {
      buildroot: { info: { releaseNotes: 'some release notes' } },
    } as any
    const result = selectors.getBuildrootUpdateInfo(state)

    expect(result).toEqual({ releaseNotes: 'some release notes' })
  })

  it('should get the update version from the auto-downloaded file', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const result = selectors.getBuildrootTargetVersion(state)

    expect(result).toBe('1.0.0')
  })

  it('should get the update version from the user-provided file', () => {
    const state: State = {
      buildroot: {
        version: '1.0.0',
        session: { userFileInfo: { version: '1.0.1' } },
      },
    } as any
    const result = selectors.getBuildrootTargetVersion(state)

    expect(result).toBe('1.0.1')
  })

  it('should get the update download error', () => {
    const state: State = {
      buildroot: { downloadError: 'error with download' },
    } as any
    const result = selectors.getBuildrootDownloadError(state)

    expect(result).toBe('error with download')
  })

  it('should get the update download progress', () => {
    const state: State = { buildroot: { downloadProgress: 10 } } as any
    const result = selectors.getBuildrootDownloadProgress(state)

    expect(result).toBe(10)
  })

  it('should get the update seen flag', () => {
    const state: State = { buildroot: { seen: false } } as any
    const result = selectors.getBuildrootUpdateSeen(state)

    expect(result).toBe(false)
  })

  it('should return "upgrade" update type when robot is behind the update', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const robot = { name: 'robot-name' } as any

    getRobotApiVersion.mockImplementation(inputRobot => {
      expect(inputRobot).toBe(robot)
      return '0.9.9'
    })

    const result = selectors.getBuildrootUpdateAvailable(state, robot)

    expect(result).toBe('upgrade')
  })

  it('should return "downgrade" update type when robot is ahead of the update', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const robot = { name: 'robot-name' } as any

    getRobotApiVersion.mockReturnValue('1.0.1')

    const result = selectors.getBuildrootUpdateAvailable(state, robot)

    expect(result).toBe('downgrade')
  })

  it('should get "reinstall" update type when robot matches the update', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const robot = { name: 'robot-name' } as any

    getRobotApiVersion.mockReturnValue('1.0.0')

    const result = selectors.getBuildrootUpdateAvailable(state, robot)

    expect(result).toBe('reinstall')
  })

  it('should return null update type when no update available', () => {
    const state: State = { buildroot: { version: null } } as any
    const robot = { name: 'robot-name' } as any

    getRobotApiVersion.mockReturnValue('1.0.0')

    const result = selectors.getBuildrootUpdateAvailable(state, robot)

    expect(result).toBe(null)
  })

  it('should return null update type when no robot version available', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const robot = { name: 'robot-name' } as any

    getRobotApiVersion.mockReturnValue(null)

    const result = selectors.getBuildrootUpdateAvailable(state, robot)

    expect(result).toBe(null)
  })

  it('should get the buildroot update session', () => {
    const state: State = {
      buildroot: {
        session: { robotName: 'robot-name', token: null, pathPrefix: null },
      },
    } as any
    const result = selectors.getBuildrootSession(state)

    expect(result).toEqual({
      robotName: 'robot-name',
      token: null,
      pathPrefix: null,
    })
  })

  it('should get the robot name from the update session', () => {
    const state: State = {
      buildroot: {
        session: { robotName: 'robot-name', token: null, pathPrefix: null },
      },
    } as any
    const result = selectors.getBuildrootRobotName(state)

    expect(result).toBe('robot-name')
  })

  it('should get the full robot from the update session', () => {
    const state: State = {
      buildroot: {
        session: { robotName: 'robot-name' },
      },
    } as any

    getViewableRobots.mockImplementation(inputState => {
      expect(inputState).toBe(state)
      return [
        { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
        { name: 'robot-name', host: '10.10.0.0', port: 31950 },
        { name: 'another-robot-name', host: '10.10.0.2', port: 31950 },
      ] as any
    })

    const result = selectors.getBuildrootRobot(state)
    expect(result).toEqual({
      name: 'robot-name',
      host: '10.10.0.0',
      port: 31950,
    })
  })

  it('should get the robot from session after migration with opentrons- name prefix', () => {
    const state: State = {
      buildroot: {
        session: { robotName: 'opentrons-robot-name' },
      },
    } as any

    getViewableRobots.mockReturnValue([
      { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
      {
        name: 'robot-name',
        host: '10.10.0.0',
        port: 31950,
        serverHealth: { capabilities: { buildrootUpdate: '/' } },
      },
      { name: 'another-robot-name', host: '10.10.0.2', port: 31950 },
    ] as any[])

    const result = selectors.getBuildrootRobot(state)
    expect(result).toEqual({
      name: 'robot-name',
      host: '10.10.0.0',
      port: 31950,
      serverHealth: { capabilities: { buildrootUpdate: '/' } },
    })
  })

  it('should be able to say if an update is in progress for a robot', () => {
    const robot = {
      name: 'robot-name',
      host: '10.10.0.0',
      port: 31950,
      serverHealth: { capabilities: { buildrootUpdate: '/' } },
    } as any

    getViewableRobots.mockReturnValue([
      { name: 'other-robot-name', host: '10.10.0.1', port: 31950 },
      robot,
      { name: 'another-robot-name', host: '10.10.0.2', port: 31950 },
    ] as any[])

    expect(
      selectors.getBuildrootUpdateInProgress(
        {
          buildroot: {
            session: {
              robotName: 'opentrons-robot-name',
              step: Constants.RESTART,
              error: null,
            },
          },
        } as any,
        robot
      )
    ).toBe(true)

    expect(
      selectors.getBuildrootUpdateInProgress(
        {
          buildroot: {
            session: {
              robotName: 'opentrons-robot-name',
              step: Constants.RESTART,
              error: { message: 'oh no!' },
            },
          },
        } as any,
        robot
      )
    ).toBe(false)

    expect(
      selectors.getBuildrootUpdateInProgress(
        {
          buildroot: {
            session: {
              robotName: 'opentrons-robot-name',
              step: Constants.FINISHED,
              error: null,
            },
          },
        } as any,
        robot
      )
    ).toBe(false)

    expect(
      selectors.getBuildrootUpdateInProgress(
        { buildroot: { session: null } } as any,
        robot
      )
    ).toBe(false)
  })

  it('should return update disabled because not responding if no robot', () => {
    const state: State = { buildroot: {} } as any
    const robotName = 'robot-name'

    getRobotByName.mockImplementation((inputState, inputName) => {
      expect(inputState).toBe(state)
      expect(inputName).toBe(robotName)
      return null
    })

    const result = selectors.getBuildrootUpdateDisplayInfo(state, robotName)

    expect(result).toMatchObject({
      autoUpdateDisabledReason: expect.stringMatching(
        /update server is not responding/
      ),
      updateFromFileDisabledReason: expect.stringMatching(
        /update server is not responding/
      ),
    })
  })

  it('should return update disabled if robot has unhealthy update sever', () => {
    const state: State = { buildroot: {} } as any
    const robotName = 'robot-name'

    getRobotByName.mockReturnValue({
      ...mockReachableRobot,
      serverHealthStatus: HEALTH_STATUS_NOT_OK,
    })

    const result = selectors.getBuildrootUpdateDisplayInfo(state, robotName)

    expect(result).toMatchObject({
      autoUpdateDisabledReason: expect.stringMatching(
        /update server is not responding/
      ),
      updateFromFileDisabledReason: expect.stringMatching(
        /update server is not responding/
      ),
    })
  })

  it('should return update disabled because other robot updating', () => {
    const state: State = {
      buildroot: { session: { robotName: 'other-name' } },
    } as any
    const robotName = 'robot-name'
    const robot = { ...mockReachableRobot, name: robotName }
    const otherRobot = { ...mockReachableRobot, name: 'other-name' }

    getRobotByName.mockReturnValue(robot)
    getViewableRobots.mockReturnValue([robot, otherRobot])
    getRobotApiVersion.mockImplementation(inputRobot => {
      expect(inputRobot).toBe(robot)
      return '1.0.0'
    })

    const result = selectors.getBuildrootUpdateDisplayInfo(state, robotName)

    expect(result).toMatchObject({
      autoUpdateDisabledReason: expect.stringMatching(
        /updating a different robot/
      ),
      updateFromFileDisabledReason: expect.stringMatching(
        /updating a different robot/
      ),
    })
  })

  it('should return auto-update disabled but from-file enabled if no downloaded files', () => {
    const state: State = { buildroot: {} } as any
    const robotName = 'robot-name'
    const robot = { ...mockReachableRobot, name: robotName }

    getRobotByName.mockReturnValue(robot)
    getRobotApiVersion.mockReturnValue('1.0.0')

    const result = selectors.getBuildrootUpdateDisplayInfo(state, robotName)

    expect(result).toEqual({
      autoUpdateAction: expect.stringMatching(/unavailable/i),
      autoUpdateDisabledReason: expect.stringMatching(
        /unable to retrieve update/i
      ),
      updateFromFileDisabledReason: null,
    })
  })

  it('should return all updates allowed if update files exist and robot is healthy', () => {
    const state: State = { buildroot: { version: '1.0.0' } } as any
    const robotName = 'robot-name'
    const robot = { ...mockReachableRobot, name: robotName }

    getRobotByName.mockReturnValue(robot)
    getRobotApiVersion.mockReturnValue('0.9.9')

    const result = selectors.getBuildrootUpdateDisplayInfo(state, robotName)

    expect(result).toEqual({
      autoUpdateAction: expect.stringMatching(/upgrade/i),
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
  })
})
