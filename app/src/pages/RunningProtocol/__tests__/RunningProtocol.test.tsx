import * as React from 'react'
import { Route, MemoryRouter } from 'react-router-dom'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'

import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import {
  useAllCommandsQuery,
  useProtocolAnalysesQuery,
  useProtocolQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { mockRobotSideAnalysis } from '../../../organisms/CommandText/__fixtures__'
import {
  CurrentRunningProtocolCommand,
  RunningProtocolSkeleton,
} from '../../../organisms/OnDeviceDisplay/RunningProtocol'
import { mockUseAllCommandsResponseNonDeterministic } from '../../../organisms/RunProgressMeter/__fixtures__'
import {
  useRunStatus,
  useRunTimestamps,
} from '../../../organisms/RunTimeControl/hooks'
import { getLocalRobot } from '../../../redux/discovery'
import { CancelingRunModal } from '../../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { OpenDoorAlertModal } from '../../../organisms/OpenDoorAlertModal'
import { RunningProtocol } from '..'
import {
  useNotifyLastRunCommandKey,
  useNotifyRunQuery,
} from '../../../resources/runs'

import type { UseQueryResult } from 'react-query'
import type { ProtocolAnalyses } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../organisms/Devices/hooks')
vi.mock('../../../organisms/Devices/hooks/useLastRunCommandKey')
vi.mock('../../../organisms/RunTimeControl/hooks')
vi.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
vi.mock('../../../organisms/RunTimeControl/hooks')
vi.mock('../../../organisms/OnDeviceDisplay/RunningProtocol')
vi.mock('../../../redux/discovery')
vi.mock('../../../organisms/OnDeviceDisplay/RunningProtocol/CancelingRunModal')
vi.mock('../../../organisms/OpenDoorAlertModal')
vi.mock('../../../resources/runs')
const RUN_ID = 'run_id'
const ROBOT_NAME = 'otie'
const PROTOCOL_ID = 'protocol_id'
const PROTOCOL_KEY = 'protocol_key'
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any
const mockPlayRun = vi.fn()
const mockPauseRun = vi.fn()
const mockStopRun = vi.fn()

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
    when(vi.mocked(useNotifyRunQuery))
      .calledWith(RUN_ID, { staleTime: Infinity })
      .thenReturn({
        data: {
          data: {
            id: RUN_ID,
            protocolId: PROTOCOL_ID,
          },
        },
      } as any)
    vi.mocked(getLocalRobot).mockReturnValue({ name: ROBOT_NAME } as any)
    when(vi.mocked(useTrackProtocolRunEvent))
      .calledWith(RUN_ID, ROBOT_NAME)
      .thenReturn({
        trackProtocolRunEvent: vi.fn(),
      })
    when(vi.mocked(useRunStatus)).calledWith(RUN_ID).thenReturn(RUN_STATUS_IDLE)
    when(vi.mocked(useProtocolAnalysesQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity }, expect.any(Boolean))
      .thenReturn({
        data: { data: [PROTOCOL_ANALYSIS] },
      } as UseQueryResult<ProtocolAnalyses>)
    when(vi.mocked(useProtocolQuery))
      .calledWith(PROTOCOL_ID, { staleTime: Infinity })
      .thenReturn({
        data: {
          data: {
            key: PROTOCOL_KEY,
            metadata: { protocolName: 'mock protocol name' },
          },
        },
      } as any)
    vi.mocked(useRunTimestamps).mockReturnValue({
      startedAt: '2022-05-04T18:24:40.833862+00:00',
      pausedAt: '',
      stoppedAt: '',
      completedAt: '2022-05-04T18:24:41.833862+00:00',
    })
    when(vi.mocked(useRunActionMutations)).calledWith(RUN_ID).thenReturn({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
    })
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(mockRobotSideAnalysis)
    when(vi.mocked(useAllCommandsQuery))
      .calledWith(RUN_ID, { cursor: null, pageLength: 1 })
      .thenReturn(mockUseAllCommandsResponseNonDeterministic)
    vi.mocked(useNotifyLastRunCommandKey).mockReturnValue({
      data: {},
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render Skeleton when robotSideAnalysis does not have data', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    render(`/runs/${RUN_ID}/run`)
    expect(vi.mocked(RunningProtocolSkeleton)).toHaveBeenCalled()
  })
  it('should render the canceling run modal when run status is stop requested', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID, { refetchInterval: 5000 })
      .thenReturn(RUN_STATUS_STOP_REQUESTED)
    render(`/runs/${RUN_ID}/run`)
    expect(vi.mocked(CancelingRunModal)).toHaveBeenCalled()
  })
  it('should render CurrentRunningProtocolCommand when loaded the data', () => {
    render(`/runs/${RUN_ID}/run`)
    expect(vi.mocked(CurrentRunningProtocolCommand)).toHaveBeenCalled()
  })

  it('should render open door alert modal, when run staus is blocked by open door', () => {
    when(vi.mocked(useRunStatus))
      .calledWith(RUN_ID, { refetchInterval: 5000 })
      .thenReturn(RUN_STATUS_BLOCKED_BY_OPEN_DOOR)
    render(`/runs/${RUN_ID}/run`)
    expect(vi.mocked(OpenDoorAlertModal)).toHaveBeenCalled()
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
