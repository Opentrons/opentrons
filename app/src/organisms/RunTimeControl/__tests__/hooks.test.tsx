import { when, resetAllWhenMocks } from 'jest-when'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import {
  RUN_ACTION_TYPE_PLAY,
  RUN_ACTION_TYPE_PAUSE,
  Run,
  RunData,
} from '@opentrons/api-client'
import { useRunQuery, useRunActionMutations } from '@opentrons/react-api-client'

import { useCurrentRunId } from '../../ProtocolUpload/hooks/useCurrentRunId'

import {
  useRunControls,
  useRunPauseTime,
  useRunStatus,
  useRunStartTime,
} from '../hooks'
/*
jest.mock('@opentrons/react-api-client', () => {
  return {
    useCurrentProtocolRun: jest.fn(),
    usePauseProtocolRun: jest.fn(),
    usePlayProtocolRun: jest.fn(),
    useProtocolRun: jest.fn(),
  }
})
*/
jest.mock('@opentrons/react-api-client')
jest.mock('../../ProtocolUpload/hooks/useCurrentRunId')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseRunActionMutations = useRunActionMutations as jest.MockedFunction<
  typeof useRunActionMutations
>

const PROTOCOL_ID = '1'
const RUN_ID_1 = '1'
const RUN_ID_2 = '2'

const mockPausedRun: RunData = {
  id: RUN_ID_1,
  createdAt: '2021-10-07T18:44:49.366581+00:00',
  status: 'paused',
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
  status: 'running',
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

/*
describe('useRunControls hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('returns run controls hooks associated with the current run', () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue('1')
    when(mockUseRunActionMutations).calledWith('1').mockReturnValue()

    const { usePlay, usePause, useReset } = useRunControls()

    expect(usePlay).toBe(false)
    expect(usePause).toBe(false)
    expect(useReset).toBe(false)
  })
})
*/

describe('useRunStatus hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns the run status of the current run', async () => {
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID_2)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_2)
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
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID_2)
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
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID_1)
    when(mockUseRunQuery)
      .calledWith(RUN_ID_1)
      .mockReturnValue(({
        data: { data: mockPausedRun },
      } as unknown) as UseQueryResult<Run>)

    const { result } = renderHook(useRunPauseTime)
    expect(result.current).toBe('2021-10-25T13:23:31.366581+00:00')
  })
})
