import { MemoryRouter } from 'react-router-dom'
import { act, cleanup, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getLocalRobot } from '/app/redux/discovery'
import * as RobotUpdate from '/app/redux/robot-update'

import { UpdateRobotDuringOnboarding } from '../UpdateRobotDuringOnboarding'

import type { RobotUpdateSession } from '/app/redux/robot-update/types'
import type { State } from '/app/redux/types'

const mockStartUpdate = vi.hoisted(() => vi.fn())

vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update')
vi.mock('/app/resources/robot-update/RobotUpdateContext', () => ({
  useRobotUpdateContext: () => ({ startUpdate: mockStartUpdate }),
}))

const MOCK_STATE: State = {
  discovery: {
    robot: { connection: { connectedTo: null } },
    robotsByName: {
      oddtie: {
        name: 'oddtie',
        health: null,
        serverHealth: null,
        addresses: [
          {
            ip: '127.0.0.1',
            port: 31950,
            seen: true,
            healthStatus: null,
            serverHealthStatus: null,
            healthError: null,
            serverHealthError: null,
            advertisedModel: null,
          },
        ],
      },
    },
  },
} as any

const mockRobot = {
  name: 'oddtie',
  status: null,
  health: null,
  ip: '127.0.0.1',
  port: 31950,
  healthStatus: null,
  serverHealthStatus: null,
} as any

const mockSession: RobotUpdateSession = {
  robotName: mockRobot.name,
  fileInfo: null,
  token: null,
  pathPrefix: null,
  step: 'restart',
  stage: null,
  progress: 10,
  error: null,
}

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UpdateRobotDuringOnboarding />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('UpdateRobotDuringOnboarding', () => {
  beforeEach(() => {
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.UPGRADE
    )
    vi.mocked(getLocalRobot).mockReturnValue(mockRobot)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('should render CheckUpdates if it does not already have an upgrade', () => {
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.REINSTALL
    )
    render()
    screen.getByText('Checking for updates')
  })

  it('should stop rendering CheckUpdates should after 10 sec', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.REINSTALL
    )
    render()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Checking for updates')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(11000)
    })
    expect(screen.queryByText('Checking for updates')).not.toBeInTheDocument()
  })

  it('should never render CheckUpdates if it already has an upgrade', () => {
    render()
    const checkUpdates = screen.queryByText('Checking for updates')
    expect(checkUpdates).not.toBeInTheDocument()
  })

  it('should render mock Update Software for downloading', () => {
    const mockDownloadSession = {
      ...mockSession,
      step: RobotUpdate.RESTART,
    }
    vi.mocked(RobotUpdate.getRobotUpdateSession).mockReturnValue(
      mockDownloadSession
    )
    render()
    screen.getByText('Downloading software...')
  })

  it('should render NoUpdate found when there is no upgrade - reinstall', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.REINSTALL
    )
    render()
    act(() => {
      vi.advanceTimersByTime(11000)
    })
    screen.getByText('Your software is already up to date!')
  })

  it('should render NoUpdate found when there is no upgrade - downgrade', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.DOWNGRADE
    )
    render()
    act(() => {
      vi.advanceTimersByTime(11000)
    })
    screen.getByText('Your software is already up to date!')
  })

  it('should render ErrorUpdateSoftware when an error occurs', () => {
    const mockErrorSession = {
      ...mockSession,
      error: 'oh no!',
    }
    vi.mocked(RobotUpdate.getRobotUpdateSession).mockReturnValue(
      mockErrorSession
    )
    render()

    screen.getByText('Software update error')
    screen.getByText('oh no!')
    screen.getByText('Try again')
    screen.getByText('Proceed without update')
  })

  it.todo('add test for targetPath in a following PR')
})
