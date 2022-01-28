import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  RUN_ACTION_TYPE_STOP,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_FAILED,
  RUN_STATUS_STOPPED,
} from '@opentrons/api-client'
import {
  useCommandQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { useCloneRun } from '../../ProtocolUpload/hooks/useCloneRun'
import { useCurrentRun } from '../../ProtocolUpload/hooks/useCurrentRun'

import {
  useRunCompleteTime,
  useRunControls,
  useRunPauseTime,
  useRunStopTime,
  useRunStatus,
  useRunStartTime,
} from '../hooks'

import type { Run, RunData, CommandDetail } from '@opentrons/api-client'
jest.mock('@opentrons/react-api-client')
jest.mock('../../ProtocolUpload/hooks/useCloneRun')
jest.mock('../../ProtocolUpload/hooks/useCurrentRun')

const mockUseCloneRun = useCloneRun as jest.MockedFunction<typeof useCloneRun>
const mockUseCurrentRun = useCurrentRun as jest.MockedFunction<
  typeof useCurrentRun
>
const mockUseCommandQuery = useCommandQuery as jest.MockedFunction<
  typeof useCommandQuery
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseRunActionMutations = useRunActionMutations as jest.MockedFunction<
  typeof useRunActionMutations
>

const PROTOCOL_ID = '1'
const RUN_ID_1 = '1'
const RUN_ID_2 = '2'
const COMMAND_ID = '4'

const mockPausedRun: RunData = {
  id: RUN_ID_1,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_PAUSED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
  ],
  commands: [],
  errors: [],
  pipettes: [],
  labware: [],
}

const mockRunningRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_RUNNING,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [],
  errors: [],
  pipettes: [],
  labware: [],
}

const mockFailedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_FAILED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [
    { id: COMMAND_ID, commandType: 'custom', status: 'succeeded' },
  ] as any,
  errors: [
    {
      id: '5',
      errorType: 'RuntimeError',
      createdAt: 'noon forty-five',
      detail: 'this run failed',
    },
  ],
  pipettes: [],
  labware: [],
}

const mockStoppedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_STOPPED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '4',
      createdAt: '2021-10-25T13:58:22.366581+00:00',
      actionType: RUN_ACTION_TYPE_STOP,
    },
  ],
  commands: [
    { id: COMMAND_ID, commandType: 'custom', status: 'succeeded' },
  ] as any,
  errors: [],
  pipettes: [],
  labware: [],
}

const mockSucceededRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_SUCCEEDED,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [
    { id: COMMAND_ID, commandType: 'custom', status: 'succeeded' },
  ] as any,
  errors: [],
  pipettes: [],
  labware: [],
}

const mockIdleUnstartedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_IDLE,
  protocolId: PROTOCOL_ID,
  actions: [],
  commands: [],
  errors: [],
  pipettes: [],
  labware: [],
}

const mockIdleStartedRun: RunData = {
  id: RUN_ID_2,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: RUN_STATUS_IDLE,
  protocolId: PROTOCOL_ID,
  actions: [
    {
      id: '1',
      createdAt: '2021-10-25T12:54:53.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
    {
      id: '2',
      createdAt: '2021-10-25T13:23:31.366581+00:00',
      actionType: RUN_ACTION_TYPE_PAUSE,
    },
    {
      id: '3',
      createdAt: '2021-10-25T13:26:42.366581+00:00',
      actionType: RUN_ACTION_TYPE_PLAY,
    },
  ],
  commands: [
    { id: COMMAND_ID, commandType: 'custom', status: 'succeeded' },
  ] as any,
  errors: [],
  pipettes: [],
  labware: [],
}

const mockCommand = {
  data: {
    id: COMMAND_ID,
    createdAt: 'noon thirty',
  },
  links: null,
} as CommandDetail

describe('useRunControls hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('returns run controls hooks', () => {
    const mockPlayRun = jest.fn()
    const mockPauseRun = jest.fn()
    const mockStopRun = jest.fn()
    const mockCloneRun = jest.fn()

    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockPausedRun,
      } as Run)
    when(mockUseRunActionMutations).calledWith('1').mockReturnValue({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
      isPlayRunActionLoading: false,
      isPauseRunActionLoading: false,
      isStopRunActionLoading: false,
    })
    when(mockUseCloneRun)
      .calledWith('1')
      .mockReturnValue({ cloneRun: mockCloneRun, isLoading: false })

    const { result } = renderHook(useRunControls)

    act(() => result.current.play())
    expect(mockPlayRun).toHaveBeenCalledTimes(1)
    act(() => result.current.pause())
    expect(mockPauseRun).toHaveBeenCalledTimes(1)
    act(() => result.current.stop())
    expect(mockStopRun).toHaveBeenCalledTimes(1)
    act(() => result.current.reset())
    expect(mockCloneRun).toHaveBeenCalledTimes(1)
  })
})

describe('useRunStatus hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the run status of the current run', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockRunningRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { refetchInterval: 1000 })
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStatus)
    expect(result.current).toBe('running')
  })

  it('returns a "idle" run status if idle and run unstarted', () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockIdleUnstartedRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { refetchInterval: 1000 })
      .mockReturnValue(({
        data: { data: mockIdleUnstartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStatus)
    expect(result.current).toBe('idle')
  })

  it('returns a "running" run status if idle and run started', () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockIdleStartedRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { refetchInterval: 1000 })
      .mockReturnValue(({
        data: { data: mockIdleStartedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStatus)
    expect(result.current).toBe('running')
  })
})

describe('useRunStartTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the start time of the current run', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockRunningRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStartTime)
    expect(result.current).toBe('2021-10-25T12:54:53.366581+00:00')
  })
})

describe('useRunPauseTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when pause is not the last action', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockRunningRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunPauseTime)
    expect(result.current).toBe(null)
  })

  it('returns the pause time of the current run when pause is the last action', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockPausedRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunPauseTime)
    expect(result.current).toBe('2021-10-25T13:23:31.366581+00:00')
  })
})

describe('useRunStopTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns null when stop is not the last action', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockRunningRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
      .mockReturnValue(({
        data: { data: mockRunningRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStopTime)
    expect(result.current).toBe(null)
  })

  it('returns the stop time of the current run when stop is the last action', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockStoppedRun,
      } as Run)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
      .mockReturnValue(({
        data: { data: mockStoppedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunStopTime)
    expect(result.current).toBe('2021-10-25T13:58:22.366581+00:00')
  })
})

describe('useRunCompleteTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the complete time of a successful current run', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockSucceededRun,
      } as Run)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID_2, COMMAND_ID)
      .mockReturnValue({
        data: mockCommand,
      } as UseQueryResult<CommandDetail, Error>)

    const { result } = renderHook(useRunCompleteTime)
    expect(result.current).toBe('noon thirty')
  })

  it('returns the complete time of a failed current run', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockFailedRun,
      } as Run)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID_2, COMMAND_ID)
      .mockReturnValue({
        data: mockCommand,
      } as UseQueryResult<CommandDetail, Error>)

    const { result } = renderHook(useRunCompleteTime)
    expect(result.current).toBe('noon forty-five')
  })

  it('returns the complete time of a stopped current run', async () => {
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: mockStoppedRun,
      } as Run)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID_2, COMMAND_ID)
      .mockReturnValue({
        data: mockCommand,
      } as UseQueryResult<CommandDetail, Error>)

    const { result } = renderHook(useRunCompleteTime)
    expect(result.current).toBe('2021-10-25T13:58:22.366581+00:00')
  })
})
