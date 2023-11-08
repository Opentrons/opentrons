import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import * as RobotUpdate from '../../../redux/robot-update'
import type { RobotUpdateSession } from '../../../redux/robot-update/types'
import { getLocalRobot } from '../../../redux/discovery'

import { UpdateRobot } from '../UpdateRobot'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-update')

const mockGetRobotUpdateUpdateAvailable = RobotUpdate.getRobotUpdateAvailable as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateAvailable
>
const mockGetRobotUpdateSession = RobotUpdate.getRobotUpdateSession as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateSession
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>

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
  step: 'restarting',
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
    mockGetRobotUpdateUpdateAvailable.mockReturnValue(RobotUpdate.UPGRADE)
    when(mockGetLocalRobot).calledWith(MOCK_STATE).mockReturnValue(mockRobot)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render mock Update Software for downloading', () => {
    const mockDownloadSession = {
      ...mockSession,
      step: RobotUpdate.RESTART,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockDownloadSession)
    const [{ getByText }] = render()
    getByText('Downloading software...')
  })

  it('should render NoUpdateFound when there is no upgrade - reinstall', () => {
    mockGetRobotUpdateUpdateAvailable.mockReturnValue(RobotUpdate.REINSTALL)
    const [{ getByText }] = render()
    getByText('Your software is already up to date!')
  })

  it('should render mock NoUpdate found when there is no upgrade - downgrade', () => {
    mockGetRobotUpdateUpdateAvailable.mockReturnValue(RobotUpdate.DOWNGRADE)
    const [{ getByText }] = render()
    getByText('Your software is already up to date!')
  })

  it('should render mock ErrorUpdateSoftware when an error occurs', () => {
    const mockErrorSession = {
      ...mockSession,
      error: 'mock error',
    }
    mockGetRobotUpdateSession.mockReturnValue(mockErrorSession)
    const [{ getByText }] = render()
    getByText('Software update error')
    getByText('mock error')
    getByText('Try again')
    getByText('Cancel software update')
  })
})
