import * as React from 'react'
import { when } from 'jest-when'
import { useInView } from 'react-intersection-observer'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItem, OBSERVER_DELAY } from '../CommandItem'
import { CommandText } from '../CommandText'
import { CommandTimer } from '../CommandTimer'
import {
  useAllCommandsQuery,
  useCommandQuery,
} from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks/useCurrentRunId'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import type { RunCommandSummary } from '@opentrons/api-client'

jest.mock('react-intersection-observer')
jest.mock('../CommandText')
jest.mock('../CommandTimer')
jest.mock('../../ProtocolUpload/hooks/useCurrentRunId')
jest.mock('@opentrons/react-api-client')

const mockCommandText = CommandText as jest.MockedFunction<typeof CommandText>
const mockCommandTimer = CommandTimer as jest.MockedFunction<
  typeof CommandTimer
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCommandQuery = useCommandQuery as jest.MockedFunction<
  typeof useCommandQuery
>
const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockUseInView = useInView as jest.MockedFunction<typeof useInView>
const render = (props: React.ComponentProps<typeof CommandItem>) => {
  return renderWithProviders(<CommandItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const RUN_ID = 'run_id'

const MOCK_COMMAND_SUMMARY: RunCommandSummary = {
  id: 'some_id',
  key: 'some_key',
  commandType: 'custom',
  status: 'queued',
}
const MOCK_ANALYSIS_COMMAND: RunTimeCommand = {
  id: 'some_id',
  key: 'some_key',
  commandType: 'custom',
  status: 'queued',
  params: {},
} as any
const MOCK_COMMAND_DETAILS: RunTimeCommand = {
  id: '123',
  key: '123',
  commandType: 'custom',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any
const MOCK_COMMAND_DETAILS_COMMENT: RunTimeCommand = {
  id: 'COMMENT',
  key: 'COMMENT',
  commandType: 'custom',
  params: { legacyCommandType: 'command.COMMENT' },
  status: 'queued',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any
describe('Run Details RunTimeCommand item', () => {
  beforeEach(() => {
    mockCommandText.mockReturnValue(<div>Mock RunTimeCommand Text</div>)
    mockCommandTimer.mockReturnValue(<div>Mock RunTimeCommand Timer</div>)
    when(mockUseCurrentRunId).calledWith().mockReturnValue(RUN_ID)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID, MOCK_COMMAND_SUMMARY.id, expect.anything())
      .mockReturnValue({
        data: { data: MOCK_COMMAND_DETAILS },
        refetch: jest.fn(),
      } as any)
    when(mockUseAllCommandsQuery)
      .calledWith(RUN_ID)
      .mockReturnValue({
        data: { data: [] },
      } as any)
    when(mockUseInView)
      .calledWith({ delay: OBSERVER_DELAY })
      .mockReturnValue([() => null, true] as any)
  })

  it('renders the correct failed status', () => {
    const { getByText } = render({
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'failed' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'running',
      currentRunId: RUN_ID,
      stepNumber: 1,
    })
    expect(getByText('Step failed')).toHaveStyle(
      'backgroundColor: C_ERROR_LIGHT'
    )
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })
  it('renders the correct success status', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'succeeded' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'succeeded',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Mock RunTimeCommand Timer')).toHaveStyle(
      'backgroundColor: C_AQUAMARINE'
    )
    getByText('Mock RunTimeCommand Text')
  })
  it('renders the correct running status', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'running' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'running',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock RunTimeCommand Timer')
    getByText('Mock RunTimeCommand Text')
  })

  it('renders the correct queued status', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'queued' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'running',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Mock RunTimeCommand Text')).toHaveStyle(
      'backgroundColor: C_NEAR_WHITE'
    )
  })

  it('renders the correct running status with run paused', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'running' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'paused',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step - Paused by User')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })

  it('renders the correct running status with run paused by door open', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'running' },
      analysisCommand: { ...MOCK_ANALYSIS_COMMAND },
      runStatus: 'blocked-by-open-door',
      currentRunId: RUN_ID,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step - Paused - Door Open')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })

  it('renders the comment text when the command is a comment', () => {
    const MOCK_COMMENT_COMMAND: RunTimeCommand = {
      id: 'COMMENT',
      commandType: 'custom',
      params: { legacyCommandType: 'command.COMMENT' },
      status: 'queued',
      result: {},
    } as any
    const MOCK_COMMENT_COMMAND_SUMMARY: RunCommandSummary = {
      id: 'COMMENT',
      commandType: 'custom',
      status: 'queued',
    } as any
    when(mockUseCommandQuery)
      .calledWith(RUN_ID, MOCK_COMMENT_COMMAND_SUMMARY.id, expect.anything())
      .mockReturnValue({
        data: { data: MOCK_COMMAND_DETAILS_COMMENT },
        refetch: jest.fn(),
      } as any)
    const props = {
      runCommandSummary: MOCK_COMMENT_COMMAND_SUMMARY,
      analysisCommand: MOCK_COMMENT_COMMAND,
      runStatus: 'running',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Comment')).toHaveStyle('backgroundColor: C_NEAR_WHITE')
    getByText('Mock RunTimeCommand Text')
  })
  it('renders the pause text when the command is a pause', () => {
    const MOCK_PAUSE_COMMAND: RunTimeCommand = {
      id: 'PAUSE',
      commandType: 'pause',
      params: {},
      status: 'queued',
      result: {},
    } as any
    const MOCK_PAUSE_COMMAND_SUMMARY: RunCommandSummary = {
      id: 'PAUSE',
      commandType: 'pause',
      status: 'queued',
    } as any
    const MOCK_COMMAND_DETAILS_PAUSE: RunTimeCommand = {
      id: 'PAUSE',
      commandType: 'pause',
      params: {},
      status: 'running',
      result: {},
      startedAt: 'start timestamp',
      completedAt: 'end timestamp',
    } as any
    when(mockUseCommandQuery)
      .calledWith(RUN_ID, MOCK_PAUSE_COMMAND.id, expect.anything())
      .mockReturnValue({
        data: { data: MOCK_COMMAND_DETAILS_PAUSE },
        refetch: jest.fn(),
      } as any)
    const props = {
      runCommandSummary: MOCK_PAUSE_COMMAND_SUMMARY,
      analysisCommand: MOCK_PAUSE_COMMAND,
      runStatus: 'paused',
      currentRunId: RUN_ID,
      stepNumber: 1,
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Pause protocol')).toHaveStyle(
      'backgroundColor: C_NEAR_WHITE'
    )
  })
})
