import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { ConfirmCancelModal } from '../../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunTimestamps,
  useRunControls,
  useRunStatus,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  PROTOCOL_ID,
  mockFailedRun,
  mockIdleUnstartedRun,
  mockPausedRun,
  mockPauseRequestedRun,
  mockRunningRun,
  mockStoppedRun,
  mockStopRequestedRun,
  mockSucceededRun,
} from '../../../../organisms/RunTimeControl/__fixtures__'
import {
  useAttachedModuleMatchesForProtocol,
  useRunCalibrationStatus,
} from '../../hooks'
import { formatTimestamp, ProtocolRunHeader } from '../ProtocolRunHeader'

import type { UseQueryResult } from 'react-query'
import type { Protocol, Run } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    Tooltip: jest.fn(({ children }) => <div>{children}</div>),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/RunDetails/ConfirmCancelModal')
jest.mock('../../../../organisms/RunTimeControl/hooks')
jest.mock('../../hooks')

const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseAttachedModuleMatchesForProtocol = useAttachedModuleMatchesForProtocol as jest.MockedFunction<
  typeof useAttachedModuleMatchesForProtocol
>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockConfirmCancelModal = ConfirmCancelModal as jest.MockedFunction<
  typeof ConfirmCancelModal
>

const ROBOT_NAME = 'otie'
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'
const STARTED_AT = '2022-03-03T19:09:40.620530+00:00'
const COMPLETED_AT = '2022-03-03T19:39:53.620530+00:00'
const PROTOCOL_NAME = 'A Protocol for Otie'

const render = () => {
  return renderWithProviders(
    <BrowserRouter>
      <ProtocolRunHeader robotName={ROBOT_NAME} runId={RUN_ID} />
    </BrowserRouter>,
    { i18nInstance: i18n }
  )
}

describe('ProtocolRunHeader', () => {
  beforeEach(() => {
    mockConfirmCancelModal.mockReturnValue(<div>Mock ConfirmCancelModal</div>)
    when(mockUseRunControls)
      .calledWith(RUN_ID, expect.anything())
      .mockReturnValue({
        play: () => {},
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: null,
    })
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockIdleUnstartedRun },
      } as UseQueryResult<Run>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: {
            id: PROTOCOL_ID,
            metadata: { protocolName: PROTOCOL_NAME },
          },
        },
      } as UseQueryResult<Protocol>)
    when(mockUseAttachedModuleMatchesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: true })
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('renders a protocol name, run record id, status, and run time', () => {
    const [{ getByText }] = render()

    getByText('A Protocol for Otie')
    getByText('Run Record ID')
    getByText(formatTimestamp(mockIdleUnstartedRun.createdAt))
    getByText('Status')
    getByText('Not started')
    getByText('Run Time')
  })

  it('links to a protocol details page', () => {
    const [{ getByRole }] = render()

    const protocolNameLink = getByRole('link', { name: 'A Protocol for Otie' })
    expect(protocolNameLink.getAttribute('href')).toBe(
      `/protocols/${PROTOCOL_ID}`
    )
  })

  it('renders a start run button when run is ready to start and not protocol start/end', () => {
    const [{ getByRole, queryByText }] = render()

    getByRole('button', { name: 'Start Run' })
    expect(queryByText(formatTimestamp(STARTED_AT))).toBeFalsy()
    expect(queryByText('Protocol start')).toBeFalsy()
    expect(queryByText('Protocol end')).toBeFalsy()
  })

  it('disables the start run button when run is not ready to start', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: false })
    const [{ getByRole }] = render()

    const button = getByRole('button', { name: 'Start Run' })
    expect(button).toBeDisabled()
  })

  it('renders a pause run button, start time, and end time when run is running', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockRunningRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_RUNNING)
    const [{ getByRole, getByText }] = render()

    getByRole('button', { name: 'Pause Run' })
    getByText(formatTimestamp(STARTED_AT))
    getByText('Protocol start')
    getByText('Protocol end')
  })

  it('renders a cancel run button when running and shows a confirm cancel modal when clicked', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockRunningRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_RUNNING)
    const [{ getByText, queryByText }] = render()

    expect(queryByText('Mock ConfirmCancelModal')).toBeFalsy()
    const cancelButton = getByText('Cancel Run')
    cancelButton.click()
    getByText('Mock ConfirmCancelModal')
  })

  it('renders a Resume Run button and Cancel Run button when paused', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockPausedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_PAUSED)

    const [{ getByRole, getByText }] = render()

    getByRole('button', { name: 'Resume Run' })
    getByRole('button', { name: 'Cancel Run' })
    getByText('Paused')
  })

  it('renders a disabled Resume Run button and when pause requested', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockPauseRequestedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_PAUSE_REQUESTED)

    const [{ getByRole, getByText }] = render()

    const button = getByRole('button', { name: 'Resume Run' })
    expect(button).toBeDisabled()
    getByRole('button', { name: 'Cancel Run' })
    getByText('Pause requested')
  })

  it('renders a disabled Canceling Run button and when stop requested', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockStopRequestedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)

    const [{ getByRole, getByText }] = render()

    const button = getByRole('button', { name: 'Canceling Run' })
    expect(button).toBeDisabled()
    getByText('Stop requested')
  })

  it('renders a Run Again button and end time when run has stopped', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockStoppedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_STOPPED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    const [{ getByText }] = render()

    getByText('Run Again')
    getByText('Canceled')
    getByText(formatTimestamp(COMPLETED_AT))
  })

  it('renders a Run Again button and end time when run has failed', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockFailedRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_FAILED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    const [{ getByText }] = render()

    getByText('Run Again')
    getByText('Completed')
    getByText(formatTimestamp(COMPLETED_AT))
  })

  it('renders a Run Again button and end time when run has succeeded', () => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: mockSucceededRun },
      } as UseQueryResult<Run>)
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_SUCCEEDED)
    when(mockUseRunTimestamps).calledWith(RUN_ID).mockReturnValue({
      startedAt: STARTED_AT,
      pausedAt: null,
      stoppedAt: null,
      completedAt: COMPLETED_AT,
    })

    const [{ getByText }] = render()

    getByText('Run Again')
    getByText('Completed')
    getByText(formatTimestamp(COMPLETED_AT))
  })

  it('renders an alert when the robot door is open', () => {
    when(mockUseRunStatus)
      .calledWith(RUN_ID)
      .mockReturnValue(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    const [{ getByText }] = render()

    getByText('Close robot door to resume run')
  })

  it('renders an alert when run has failed', () => {
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_FAILED)
    const [{ getByText }] = render()

    getByText('Protocol run failed')
  })
})
