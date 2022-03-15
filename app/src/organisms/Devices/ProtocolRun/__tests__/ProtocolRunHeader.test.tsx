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
import { AlertItem } from '@opentrons/components/src/alerts'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import {
  useRunTimestamps,
  useRunControls,
  useRunStatus,
} from '../../../../organisms/RunTimeControl/hooks'
import {
  PROTOCOL_ID,
  mockRunningRun,
  mockIdleUnstartedRun,
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

  it('renders a start run button when run is ready to start', () => {
    const [{ getByRole, queryByText }] = render()

    getByRole('button', { name: 'Start Run' })
    expect(queryByText(formatTimestamp(STARTED_AT))).toBeFalsy()
  })

  it('disables the start run button when run is not ready to start', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: false })
    const [{ getByRole, queryByText }] = render()

    const button = getByRole('button', { name: 'Start Run' })
    expect(button).toHaveAttribute('disabled')
    expect(queryByText(formatTimestamp(STARTED_AT))).toBeFalsy()
  })

  it('renders a pause run button and protocol start time when run is running', () => {
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
  })
})
