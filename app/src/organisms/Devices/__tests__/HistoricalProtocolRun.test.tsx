import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { useRunStatus, useRunTimestamps } from '../../RunTimeControl/hooks'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'
import { HistoricalProtocolRunOverflowMenu } from '../HistoricalProtocolRunOverflowMenu'
import type { RunStatus, RunData } from '@opentrons/api-client'

const mockPush = jest.fn()

jest.mock('../../../redux/protocol-storage')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../HistoricalProtocolRunOverflowMenu')
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockHistoricalProtocolRunOverflowMenu = HistoricalProtocolRunOverflowMenu as jest.MockedFunction<
  typeof HistoricalProtocolRunOverflowMenu
>
const mockGetStoredProtocols = getStoredProtocols as jest.MockedFunction<
  typeof getStoredProtocols
>

const run = {
  current: false,
  id: 'test_id',
  protocolId: 'test_protocol_id',
  status: 'succeeded' as RunStatus,
} as RunData

const render = (props: React.ComponentProps<typeof HistoricalProtocolRun>) => {
  return renderWithProviders(<HistoricalProtocolRun {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RecentProtocolRuns', () => {
  let props: React.ComponentProps<typeof HistoricalProtocolRun>

  beforeEach(() => {
    props = {
      robotName: 'otie',
      protocolName: 'my protocol',
      protocolKey: 'protocolKeyStub',
      robotIsBusy: false,
      run: run,
    }
    mockHistoricalProtocolRunOverflowMenu.mockReturnValue(
      <div>mock HistoricalProtocolRunOverflowMenu</div>
    )
    mockUseRunStatus.mockReturnValue('succeeded')
    mockUseRunTimestamps.mockReturnValue({
      startedAt: '2022-05-04T18:24:40.833862+00:00',
      pausedAt: '',
      stoppedAt: '',
      completedAt: '2022-05-04T18:24:41.833862+00:00',
    })
    mockGetStoredProtocols.mockReturnValue([storedProtocolDataFixture])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders the correct information derived from run and protocol', () => {
    const { getByText } = render(props)
    const protocolBtn = getByText('my protocol')
    getByText('Completed')
    getByText('mock HistoricalProtocolRunOverflowMenu')
    fireEvent.click(protocolBtn)
    expect(mockPush).toHaveBeenCalledWith('/protocols/protocolKeyStub')
  })
  it('renders buttons that are not clickable when the protocol was deleted from the app directory', () => {
    mockGetStoredProtocols.mockReturnValue([storedProtocolDataFixture])
    props = {
      robotName: 'otie',
      protocolName: 'my protocol',
      protocolKey: '12345',
      robotIsBusy: false,
      run: run,
    }
    const { getByText } = render(props)
    const protocolBtn = getByText('my protocol')
    getByText('Completed')
    getByText('mock HistoricalProtocolRunOverflowMenu')
    fireEvent.click(protocolBtn)
    expect(mockPush).not.toHaveBeenCalledWith('/protocols/12345')
  })
})
