import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { StepItem } from '../StepItem'
import { StepText } from '../StepText'
import { StepTimer } from '../StepTimer'

import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import type { RunCommandSummary } from '@opentrons/api-client'

jest.mock('../StepText')
jest.mock('../StepTimer')

const mockStepText = StepText as jest.MockedFunction<typeof StepText>
const mockStepTimer = StepTimer as jest.MockedFunction<typeof StepTimer>

const render = (props: React.ComponentProps<typeof StepItem>) => {
  return renderWithProviders(<StepItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const ROBOT_NAME = 'otie'
const RUN_ID = 'ab60e8ff-e281-4219-9f7c-61fc816482dd'

const MOCK_COMMAND_SUMMARY: RunCommandSummary = {
  id: 'some_id',
  key: 'some_key',
  commandType: 'custom',
  status: 'queued',
  createdAt: 'create timestamp',
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
}
const MOCK_ANALYSIS_COMMAND: RunTimeCommand = {
  id: 'some_id',
  key: 'some_key',
  commandType: 'custom',
  status: 'queued',
  params: {},
} as any

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

describe('Run Log StepItem', () => {
  beforeEach(() => {
    mockStepText.mockReturnValue(<div>Mock RunTimeCommand Text</div>)
    mockStepTimer.mockReturnValue(<div>Mock RunTimeCommand Timer</div>)
  })

  it('renders the correct failed status', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'failed' },
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runStatus: 'running',
      stepNumber: 1,
      isMostRecentCommand: true,
      runStartedAt: 'fake_timestamp',
      runPausedAt: null,
    })
    getByText('Failed step')
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })

  it('renders the correct success status', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'succeeded' },
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runStatus: 'succeeded',
      isMostRecentCommand: true,
      stepNumber: 1,
      runStartedAt: 'fake_timestamp',
      runPausedAt: null,
    } as React.ComponentProps<typeof StepItem>
    const { getByText } = render(props)
    getByText('Mock RunTimeCommand Timer')
    getByText('Mock RunTimeCommand Text')
  })

  it('renders the correct queued status', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'queued' },
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runStatus: 'running',
      isMostRecentCommand: false,
      stepNumber: 1,
      runStartedAt: 'fake_timestamp',
      runPausedAt: null,
    } as React.ComponentProps<typeof StepItem>
    const { getByText, queryByText } = render(props)
    getByText('Mock RunTimeCommand Text')
    queryByText('Mock RunTimeCommand Timer')
  })

  it('renders the correct running status with run paused', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'running' },
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runStatus: 'paused',
      isMostRecentCommand: true,
      stepNumber: 1,
      runStartedAt: 'fake_timestamp',
      runPausedAt: '2022-05-16T19:15:39.572996+00:00',
    } as React.ComponentProps<typeof StepItem>
    const { getByText, queryByText } = render(props)
    queryByText('User paused protocol for')
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })

  it('renders the correct running status with run paused by door open', () => {
    const props = {
      runCommandSummary: { ...MOCK_COMMAND_SUMMARY, status: 'running' },
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runStatus: 'blocked-by-open-door',
      isMostRecentCommand: true,
      stepNumber: 1,
      runStartedAt: 'fake_timestamp',
    } as React.ComponentProps<typeof StepItem>
    const { getByText, queryByText } = render(props)
    queryByText('User paused protocol for')
    getByText('Mock RunTimeCommand Text')
    getByText('Mock RunTimeCommand Timer')
  })

  it('renders the comment text when the command is a comment', () => {
    const props = {
      runCommandSummary: MOCK_COMMENT_COMMAND_SUMMARY,
      analysisCommand: MOCK_COMMENT_COMMAND,
      runStatus: 'running',
      stepNumber: 1,
      isMostRecentCommand: true,
      runStartedAt: 'fake_timestamp',
    } as React.ComponentProps<typeof StepItem>
    const { getByText, queryByText } = render(props)
    getByText('Comment')
    getByText('Mock RunTimeCommand Text')
    expect(queryByText('Mock RunTimeCommand Timer')).toBeFalsy()
  })
})
