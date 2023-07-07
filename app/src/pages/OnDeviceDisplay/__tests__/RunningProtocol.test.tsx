import * as React from 'react'
import { Route } from 'react-router'
import { UseQueryResult } from 'react-query'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  RUN_STATUS_IDLE,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import {
  useProtocolAnalysesQuery,
  useProtocolQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { mockRobotSideAnalysis } from '../../../organisms/CommandText/__fixtures__'
import {
  CurrentRunningProtocolCommand,
  RunningProtocolCommandList,
  RunningProtocolSkeleton,
} from '../../../organisms/OnDeviceDisplay/RunningProtocol'
import {
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { CancelingRunModal } from '../../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { RunningProtocol } from '../RunningProtocol'

import type { ProtocolAnalyses } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/Devices/hooks/useLastRunCommandKey')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../organisms/OnDeviceDisplay/RunningProtocol')
jest.mock('../../../redux/discovery')
jest.mock(
  '../../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal'
)

const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockUseRunActionMutations = useRunActionMutations as jest.MockedFunction<
  typeof useRunActionMutations
>
const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockCurrentRunningProtocolCommand = CurrentRunningProtocolCommand as jest.MockedFunction<
  typeof CurrentRunningProtocolCommand
>
const mockRunningProtocolCommandList = RunningProtocolCommandList as jest.MockedFunction<
  typeof RunningProtocolCommandList
>
const mockRunningProtocolSkeleton = RunningProtocolSkeleton as jest.MockedFunction<
  typeof RunningProtocolSkeleton
>
const mockCancelingRunModal = CancelingRunModal as jest.MockedFunction<
  typeof CancelingRunModal
>

const RUN_ID = 'run_id'
const PROTOCOL_ID = 'protocol_id'
const PROTOCOL_KEY = 'protocol_key'
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any
const mockPlayRun = jest.fn()
const mockPauseRun = jest.fn()
const mockStopRun = jest.fn()
const mockTrackProtocolRunEvent = jest.fn(
  () => new Promise(resolve => resolve({}))
)

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/runs/:runId/run">
        <RunningProtocol />
      </Route>
    </MemoryRouter>
  )
}

describe('RunningProtocol', () => {
  beforeEach(() => {
    when(mockUseRunQuery)
      .calledWith(RUN_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: {
            id: RUN_ID,
            protocolId: PROTOCOL_ID,
          },
        },
      } as any)
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseProtocolAnalysesQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity }, expect.any(Boolean))
      .mockReturnValue({
        data: { data: [PROTOCOL_ANALYSIS] },
      } as UseQueryResult<ProtocolAnalyses>)
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .mockReturnValue({
        data: {
          data: {
            key: PROTOCOL_KEY,
            metadata: { protocolName: 'mock protocol name' },
          },
        },
      } as any)
    mockUseRunTimestamps.mockReturnValue({
      startedAt: '2022-05-04T18:24:40.833862+00:00',
      pausedAt: '',
      stoppedAt: '',
      completedAt: '2022-05-04T18:24:41.833862+00:00',
    })
    when(mockUseRunActionMutations).calledWith(RUN_ID).mockReturnValue({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
    })
    when(mockUseTrackProtocolRunEvent).calledWith(RUN_ID).mockReturnValue({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRobotSideAnalysis)
    mockCurrentRunningProtocolCommand.mockReturnValue(
      <div>mock CurrentRunningProtocolCommand</div>
    )
    mockRunningProtocolCommandList.mockReturnValue(
      <div>mock RunningProtocolCommandList</div>
    )
    mockRunningProtocolSkeleton.mockReturnValue(
      <div>mock RunningProtocolSkeleton</div>
    )
    mockCancelingRunModal.mockReturnValue(<div>mock CancelingRunModal</div>)
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  it('should render Skeleton when robotSideAnalysis does not have data', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(null)
    const [{ getByText }] = render(`/runs/${RUN_ID}/run`)
    getByText('mock RunningProtocolSkeleton')
  })
  it('should render the canceling run modal when run status is stop requested', () => {
    when(mockUseRunStatus)
      .calledWith(RUN_ID, { refetchInterval: 5000 })
      .mockReturnValue(RUN_STATUS_STOP_REQUESTED)
    const [{ getByText }] = render(`/runs/${RUN_ID}/run`)
    getByText('mock CancelingRunModal')
  })
  it('should render CurrentRunningProtocolCommand when loaded the data', () => {
    const [{ getByText }] = render(`/runs/${RUN_ID}/run`)
    getByText('mock CurrentRunningProtocolCommand')
  })

  // ToDo (kj:04/04/2023) need to figure out the way to simulate swipe
  it.todo('should render RunningProtocolCommandList when swiping left')
  // const [{ getByText }] = render(`/runs/${RUN_ID}/run`)
  // const targetScreen = getByText('mock CurrentRunningProtocolCommand')
  // fireEvent.dragStart(targetScreen)
  // fireEvent.dragEnd(targetScreen)
  // getByText('mock RunningProtocolCommandList')

  it.todo('should render CurrentRunningProtocolCommand when swiping right')
})
