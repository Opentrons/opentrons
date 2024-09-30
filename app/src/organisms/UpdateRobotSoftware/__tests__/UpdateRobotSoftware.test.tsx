import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import * as RobotUpdate from '/app/redux/robot-update'
import * as UpdateRobotSoftware from '../'
import {
  CompleteUpdateSoftware,
  UpdateSoftware,
} from '/app/organisms/UpdateRobotSoftware'

import type { State } from '/app/redux/types'

vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update')
vi.mock('/app/organisms/UpdateRobotSoftware/CheckUpdates')
vi.mock('/app/organisms/UpdateRobotSoftware/CompleteUpdateSoftware')
vi.mock('/app/organisms/UpdateRobotSoftware/ErrorUpdateSoftware')
vi.mock('/app/organisms/UpdateRobotSoftware/NoUpdateFound')
vi.mock('/app/organisms/UpdateRobotSoftware/UpdateSoftware')

const getRobotUpdateSession = RobotUpdate.getRobotUpdateSession

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

const mockSession = {
  robotName: mockRobot.name,
  fileInfo: null,
  token: null,
  pathPrefix: null,
  step: null,
  stage: null,
  progress: null,
  error: null,
}

const mockAfterError = vi.fn()
const mockBeforeCommitting = vi.fn()

const render = () => {
  return renderWithProviders(
    <UpdateRobotSoftware.UpdateRobotSoftware
      localRobot={mockRobot}
      afterError={mockAfterError}
      beforeCommittingSuccessfulUpdate={mockBeforeCommitting}
    />,
    {
      i18nInstance: i18n,
      initialState: MOCK_STATE,
    }
  )
}

describe('UpdateRobotSoftware', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(CompleteUpdateSoftware).mockReturnValue(
      <div>mock CompleteUpdateSoftware</div>
    )
    vi.mocked(UpdateSoftware).mockReturnValue(<div>mock UpdateSoftware</div>)
  })

  it('should render complete screen when finished', () => {
    const mockCompleteSession = { ...mockSession, step: RobotUpdate.FINISHED }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockCompleteSession)
    render()
    screen.getByText('mock CompleteUpdateSoftware')
  })

  it('should call beforeCommittingSuccessFulUpdate before installing', () => {
    const mockAboutToCommitSession = {
      ...mockSession,
      step: RobotUpdate.COMMIT_UPDATE,
      stage: RobotUpdate.READY_FOR_RESTART,
    }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockAboutToCommitSession)
    render()
    expect(mockBeforeCommitting).toBeCalled()
    expect(UpdateSoftware).toBeCalledWith(
      { updateType: 'installing' },
      expect.anything()
    )
    screen.getByText('mock UpdateSoftware')
  })
  it('should call afterError if there is an error', () => {
    const mockErrorSession = { ...mockSession, error: 'oh no!' }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockErrorSession)
    render()
    expect(mockAfterError).toBeCalled()
    screen.getByText('mock UpdateSoftware')
  })

  it('should render mock Update Robot Software for downloading', () => {
    const mockDownloadSession = {
      ...mockSession,
      step: RobotUpdate.RESTART,
    }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockDownloadSession)
    render()
    vi.advanceTimersByTime(11000)
    screen.getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for sending file', () => {
    const mockSendingFileSession = {
      ...mockSession,
      step: RobotUpdate.GET_TOKEN,
      stage: RobotUpdate.VALIDATING,
    }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockSendingFileSession)
    render()
    vi.advanceTimersByTime(11000)
    screen.getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for validating', () => {
    const mockValidatingSession = {
      ...mockSession,
      step: RobotUpdate.PROCESS_FILE,
    }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockValidatingSession)
    render()
    vi.advanceTimersByTime(11000)
    screen.getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for installing', () => {
    const mockInstallingSession = {
      ...mockSession,
      step: RobotUpdate.COMMIT_UPDATE,
    }
    vi.mocked(getRobotUpdateSession).mockReturnValue(mockInstallingSession)
    render()
    vi.advanceTimersByTime(11000)
    screen.getByText('mock UpdateSoftware')
  })
})
