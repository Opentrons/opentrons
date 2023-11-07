import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import * as RobotUpdate from '../../../redux/robot-update'
import * as UpdateRobotSoftware from '../'
import {
  CompleteUpdateSoftware,
  UpdateSoftware,
} from '../../../organisms/UpdateRobotSoftware'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-update')
jest.mock('../../../organisms/UpdateRobotSoftware/CheckUpdates')
jest.mock('../../../organisms/UpdateRobotSoftware/CompleteUpdateSoftware')
jest.mock('../../../organisms/UpdateRobotSoftware/ErrorUpdateSoftware')
jest.mock('../../../organisms/UpdateRobotSoftware/NoUpdateFound')
jest.mock('../../../organisms/UpdateRobotSoftware/UpdateSoftware')

const mockCompleteUpdateSoftware = CompleteUpdateSoftware as jest.MockedFunction<
  typeof CompleteUpdateSoftware
>
const mockUpdateSoftware = UpdateSoftware as jest.MockedFunction<
  typeof UpdateSoftware
>

const mockGetRobotUpdateSession = RobotUpdate.getRobotUpdateSession as jest.MockedFunction<
  typeof RobotUpdate.getRobotUpdateSession
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

const mockAfterError = jest.fn()
const mockBeforeCommitting = jest.fn()

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
    jest.useFakeTimers()
    mockCompleteUpdateSoftware.mockReturnValue(
      <div>mock CompleteUpdateSoftware</div>
    )
    mockUpdateSoftware.mockReturnValue(<div>mock UpdateSoftware</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render complete screen when finished', () => {
    const mockCompleteSession = { ...mockSession, step: RobotUpdate.FINISHED }
    mockGetRobotUpdateSession.mockReturnValue(mockCompleteSession)
    const [{ getByText }] = render()
    getByText('mock CompleteUpdateSoftware')
  })

  it('should call beforeCommittingSuccessFulUpdate before installing', () => {
    const mockAboutToCommitSession = {
      ...mockSession,
      step: RobotUpdate.COMMIT_UPDATE,
      stage: RobotUpdate.READY_FOR_RESTART,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockAboutToCommitSession)
    const [{ getByText }] = render()
    expect(mockBeforeCommitting).toBeCalled()
    expect(mockUpdateSoftware).toBeCalledWith(
      { updateType: 'installing', processProgress: 0 },
      expect.anything()
    )
    getByText('mock UpdateSoftware')
  })
  it('should call afterError if there is an error', () => {
    const mockErrorSession = { ...mockSession, error: 'oh no!' }
    mockGetRobotUpdateSession.mockReturnValue(mockErrorSession)
    const [{ getByText }] = render()
    expect(mockAfterError).toBeCalled()
    getByText('mock UpdateSoftware')
  })

  it('should render mock Update Robot Software for downloading', () => {
    const mockDownloadSession = {
      ...mockSession,
      step: RobotUpdate.RESTART,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockDownloadSession)
    const [{ getByText }] = render()
    jest.advanceTimersByTime(11000)
    getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for sending file', () => {
    const mockSendingFileSession = {
      ...mockSession,
      step: RobotUpdate.GET_TOKEN,
      stage: RobotUpdate.VALIDATING,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockSendingFileSession)
    const [{ getByText }] = render()
    jest.advanceTimersByTime(11000)
    getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for validating', () => {
    const mockValidatingSession = {
      ...mockSession,
      step: RobotUpdate.PROCESS_FILE,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockValidatingSession)
    const [{ getByText }] = render()
    jest.advanceTimersByTime(11000)
    getByText('mock UpdateSoftware')
  })

  it('should render mock Update Software for installing', () => {
    const mockInstallingSession = {
      ...mockSession,
      step: RobotUpdate.COMMIT_UPDATE,
    }
    mockGetRobotUpdateSession.mockReturnValue(mockInstallingSession)
    const [{ getByText }] = render()
    jest.advanceTimersByTime(11000)
    getByText('mock UpdateSoftware')
  })
})
