import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { act, renderHook } from '@testing-library/react-hooks'
import {
  CommandDetail,
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  Run,
  RunData,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  useCommandQuery,
  useRunQuery,
  useRunActionMutations,
} from '@opentrons/react-api-client'

import { useCloneRun } from '../../ProtocolUpload/hooks/useCloneRun'
import {
  useCurrentProtocolRun,
  UseCurrentProtocolRun,
} from '../../ProtocolUpload/hooks/useCurrentProtocolRun'

import {
  useRunCompleteTime,
  useRunControls,
  useRunPauseTime,
  useRunStatus,
  useRunStartTime,
} from '../hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../../ProtocolUpload/hooks/useCloneRun')
jest.mock('../../ProtocolUpload/hooks/useCurrentProtocolRun')

const mockUseCloneRun = useCloneRun as jest.MockedFunction<typeof useCloneRun>
const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
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
  pipettes: [],
  labware: [],
}

const mockCompletedRun: RunData = {
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
  commands: [{ id: COMMAND_ID, commandType: 'custom', status: 'succeeded' }],
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

    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockPausedRun },
      } as UseCurrentProtocolRun)
    when(mockUseRunActionMutations).calledWith('1').mockReturnValue({
      playRun: mockPlayRun,
      pauseRun: mockPauseRun,
      stopRun: mockStopRun,
    })
    when(mockUseCloneRun).calledWith('1').mockReturnValue(mockCloneRun)

    const { result } = renderHook(useRunControls)

    act(() => result.current.play())
    expect(mockPlayRun).toHaveBeenCalledTimes(1)
    act(() => result.current.pause())
    expect(mockPauseRun).toHaveBeenCalledTimes(1)
    act(() => result.current.reset())
    expect(mockCloneRun).toHaveBeenCalledTimes(1)
  })
})

describe('useRunStatus hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the run status of the current run', async () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockRunningRun },
      } as UseCurrentProtocolRun)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2, { refetchInterval: 1000 })
      .mockReturnValue(({
        data: { data: mockRunningRun },
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
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockRunningRun },
      } as UseCurrentProtocolRun)
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

  it('returns the pause time of the current run', async () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockPausedRun },
      } as UseCurrentProtocolRun)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunPauseTime)
    expect(result.current).toBe('2021-10-25T13:23:31.366581+00:00')
  })

  // TODO: flesh this out
  it('only returns the pause time of the current run when pause is the last action', async () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockPausedRun },
      } as UseCurrentProtocolRun)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunPauseTime)
    expect(result.current).toBe('2021-10-25T13:23:31.366581+00:00')
  })
})

describe('useRunCompleteTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the complete time of the current run', async () => {
    when(mockUseCurrentProtocolRun)
      .calledWith()
      .mockReturnValue({
        runRecord: { data: mockCompletedRun },
      } as UseCurrentProtocolRun)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID_2, COMMAND_ID)
      .mockReturnValue({
        data: mockCommand,
      } as UseQueryResult<CommandDetail, Error>)

    const { result } = renderHook(useRunCompleteTime)
    expect(result.current).toBe('noon thirty')
  })
})
