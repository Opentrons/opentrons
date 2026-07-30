import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getLocalRobot } from '/app/redux/discovery'
import * as RobotUpdate from '/app/redux/robot-update'

import { UpdateRobot } from '../UpdateRobot'

import type { RobotUpdateSession } from '/app/redux/robot-update/types'
import type { State } from '/app/redux/types'

const mockDispatchStartRobotUpdate = vi.hoisted(() => vi.fn())

vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update')
vi.mock('/app/redux/robot-update/hooks', () => ({
  useDispatchStartRobotUpdate: () => mockDispatchStartRobotUpdate,
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
      <UpdateRobot />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('UpdateRobot', () => {
  beforeEach(() => {
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.UPGRADE
    )
    when(vi.mocked(getLocalRobot)).calledWith(MOCK_STATE).thenReturn(mockRobot)
  })

  afterEach(() => {
    vi.resetAllMocks()
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

  it('should render NoUpdateFound when there is no upgrade - reinstall', () => {
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.REINSTALL
    )
    render()
    screen.getByText('Your software is already up to date!')
  })

  it('should render mock NoUpdate found when there is no upgrade - downgrade', () => {
    vi.mocked(RobotUpdate.getRobotUpdateAvailable).mockReturnValue(
      RobotUpdate.DOWNGRADE
    )
    render()
    screen.getByText('Your software is already up to date!')
  })

  it('should render mock ErrorUpdateSoftware when an error occurs', () => {
    const mockErrorSession = {
      ...mockSession,
      error: 'mock error',
    }
    vi.mocked(RobotUpdate.getRobotUpdateSession).mockReturnValue(
      mockErrorSession
    )
    render()
    screen.getByText('Software update error')
    screen.getByText('mock error')
    screen.getByText('Try again')
    screen.getByText('Cancel software update')
  })
})
