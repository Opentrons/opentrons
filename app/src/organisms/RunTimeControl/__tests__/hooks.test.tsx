import { when, resetAllWhenMocks } from 'jest-when'
import {
  useCurrentProtocolRun,
  usePauseProtocolRun,
  usePlayProtocolRun,
  useProtocolRun,
} from '@opentrons/react-api-client'

import { useRunControls, useRunStatus, useRunStartTime } from '../hooks'

jest.mock('@opentrons/react-api-client', () => {
  return {
    useCurrentProtocolRun: jest.fn(),
    usePauseProtocolRun: jest.fn(),
    usePlayProtocolRun: jest.fn(),
    useProtocolRun: jest.fn(),
  }
})

const mockUseCurrentProtocolRun = useCurrentProtocolRun as jest.MockedFunction<
  typeof useCurrentProtocolRun
>
const mockUsePauseProtocolRun = usePauseProtocolRun as jest.MockedFunction<
  typeof usePauseProtocolRun
>
const mockUsePlayProtocolRun = usePlayProtocolRun as jest.MockedFunction<
  typeof usePlayProtocolRun
>
const mockUseProtocolRun = useProtocolRun as jest.MockedFunction<
  typeof useProtocolRun
>

describe('useRunControls hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  when(mockUseCurrentProtocolRun).calledWith().mockReturnValue({ runId: '1' })
  when(mockUsePauseProtocolRun).calledWith('1').mockReturnValue()
  when(mockUsePlayProtocolRun).calledWith('1').mockReturnValue()
  when(mockUseProtocolRun)
    .calledWith('1')
    .mockReturnValue({
      createdAt: '2021-10-07T18:44:49.366581+00:00',
      details: {
        currentState: 'running',
        events: [{ timestamp: '2021-10-07T18:44:49.366581+00:00' }],
      },
    })

  const { usePlay, usePause, useReset } = useRunControls()

  expect(usePlay).toBe(false)
  expect(usePause).toBe(false)
  expect(useReset).toBe(false)
})

describe('useRunStatus hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })

  when(mockUseCurrentProtocolRun).calledWith().mockReturnValue({ runId: '1' })
  when(mockUseProtocolRun)
    .calledWith('1')
    .mockReturnValue({
      createdAt: '2021-10-07T18:44:49.366581+00:00',
      details: {
        currentState: 'running',
        events: [{ timestamp: '2021-10-07T18:44:49.366581+00:00' }],
      },
    })

  const status = useRunStatus()

  expect(status).toBe('running')
})

describe('useRunStartTime hook', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  when(mockUseCurrentProtocolRun).calledWith().mockReturnValue({ runId: '1' })
  when(mockUseProtocolRun)
    .calledWith('1')
    .mockReturnValue({
      createdAt: '2021-10-07T18:44:49.366581+00:00',
      details: {
        currentState: 'running',
        events: [
          {
            timestamp: '2021-10-07T18:44:49.366581+00:00',
          },
        ],
      },
    })

  const runStart = useRunStartTime()

  expect(runStart).toBe('2021-10-07T18:44:49.366581+00:00')
})
