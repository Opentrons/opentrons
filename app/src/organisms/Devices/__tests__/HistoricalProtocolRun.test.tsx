import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'
import { HistoricalProtocolRunOverflowMenu } from '../HistoricalProtocolRunOverflowMenu'
import type { RunStatus, RunData } from '@opentrons/api-client'

jest.mock('../../RunTimeControl/hooks')
jest.mock('../HistoricalProtocolRunOverflowMenu')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockHistoricalProtocolRunOverflowMenu = HistoricalProtocolRunOverflowMenu as jest.MockedFunction<
  typeof HistoricalProtocolRunOverflowMenu
>
const run = {
  createdAt: '2022-05-04T18:24:40.833862+00:00',
  current: false,
  id: 'test_id',
  protocolId: 'test_protocol_id',
  status: 'succeeded' as RunStatus,
} as RunData
const render = () => {
  return renderWithProviders(
    <HistoricalProtocolRun
      robotName="otie"
      protocolName="my protocol"
      robotIsBusy={false}
      run={run}
      key={1}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RecentProtocolRuns', () => {
  beforeEach(() => {
    mockHistoricalProtocolRunOverflowMenu.mockReturnValue(
      <div>mock HistoricalProtocolRunOverflowMenu</div>
    )
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders the correct information derived from run and protocol', () => {
    mockUseRunStatus.mockReturnValue('succeeded')
    const [{ getByText }] = render()

    getByText('my protocol')
    getByText('Completed')
    getByText('mock HistoricalProtocolRunOverflowMenu')
  })
})
