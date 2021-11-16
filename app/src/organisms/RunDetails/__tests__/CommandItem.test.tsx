import * as React from 'react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandItem } from '../CommandItem'
import { CommandText } from '../CommandText'
import { CommandTimer } from '../CommandTimer'
import { useCommandQuery } from '@opentrons/react-api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks/useCurrentRunId'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'

jest.mock('../CommandText')
jest.mock('../CommandTimer')
jest.mock('../../ProtocolUpload/hooks/useCurrentRunId')
jest.mock('@opentrons/react-api-client')

const mockCommandText = CommandText as jest.MockedFunction<typeof CommandText>
const mockCommandTimer = CommandTimer as jest.MockedFunction<
  typeof CommandTimer
>
const mockUseCurrentRunId =  useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseCommandQuery =  useCommandQuery as jest.MockedFunction<
  typeof useCommandQuery
>
const render = (props: React.ComponentProps<typeof CommandItem>) => {
  return renderWithProviders(<CommandItem {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const RUN_ID = 'run_id'

const MOCK_COMMAND = {
  id: '123',
  commandType: 'custom',
  params:  {},
  status: 'running',
  result: {},
} as Command
const MOCK_COMMAND_DETAILS = {
  id: '123',
  commandType: 'custom',
  params:  {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as Command
describe('Run Details Command item', () => {
  beforeEach(() => {
    mockCommandText.mockReturnValue(<div>Mock Command Text</div>)
    mockCommandTimer.mockReturnValue(<div>Mock Command Timer</div>)
    when(mockUseCurrentRunId)
      .calledWith()
      .mockReturnValue(RUN_ID)
    when(mockUseCommandQuery)
      .calledWith(RUN_ID, MOCK_COMMAND.id)
      .mockReturnValue({
        data: {data: MOCK_COMMAND_DETAILS},
        refetch: jest.fn()
      } as any)
  })

  it('renders the correct failed status', () => {
    const { getByText } = render({
      commandOrSummary: {...MOCK_COMMAND, status: 'failed' },
      runStatus: 'stopped'
    })
    expect(getByText('Step failed')).toHaveStyle(
      'backgroundColor: C_ERROR_LIGHT'
    )
    getByText('Mock Command Text')
    getByText('Mock Command Timer')
  })
  it('renders the correct success status', () => {
    const props = {
      commandOrSummary: { ...MOCK_COMMAND, status: 'succeeded'},
      runStatus: 'succeeded'
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Mock Command Timer')).toHaveStyle(
      'backgroundColor: C_AQUAMARINE'
    )
    getByText('Mock Command Text')
  })
  it('renders the correct running status', () => {
    const props = {
      commandOrSummary: { ...MOCK_COMMAND, status: 'running' },
      runStatus: 'running'
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock Command Timer')
    getByText('Mock Command Text')
  })

  it('renders the correct queued status', () => {
    const props = {
      commandOrSummary: { ...MOCK_COMMAND, status: 'queued' },
      runStatus: 'running',
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Mock Command Text')).toHaveStyle(
      'backgroundColor: C_NEAR_WHITE'
    )
  })

  it('renders the correct running status', () => {
    const props = {
      commandOrSummary: { ...MOCK_COMMAND, status: 'running' },
      runStatus: 'running',
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock Command Text')
    getByText('Mock Command Timer')
  })
  it('renders the correct running status with run paused', () => {
    const props = {
      commandOrSummary: { ...MOCK_COMMAND, status: 'running' },
      runStatus: 'paused',
    } as React.ComponentProps<typeof CommandItem>
    const { getByText } = render(props)
    expect(getByText('Current Step - Paused by User')).toHaveStyle(
      'backgroundColor: C_POWDER_BLUE'
    )
    getByText('Mock Command Text')
    getByText('Mock Command Timer')
  })
})
