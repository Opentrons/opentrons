import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook, waitFor } from '@testing-library/react'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'

import { useProtocolRunAnalyticsData } from '../useProtocolRunAnalyticsData'
import { hash } from '../../../../redux/analytics/hash'
import { getStoredProtocol } from '../../../../redux/protocol-storage'
import { useStoredProtocolAnalysis, useProtocolDetailsForRun } from '../'
import { useProtocolMetadata } from '../useProtocolMetadata'
import { useRunTimestamps } from '../../../RunTimeControl/hooks'
import { formatInterval } from '../../../RunTimeControl/utils'

jest.mock('../../../../redux/analytics/hash')
jest.mock('../../../../redux/protocol-storage')
jest.mock('../../hooks')
jest.mock('../useProtocolMetadata')
jest.mock('../../../RunTimeControl/hooks')
jest.mock('../../../RunTimeControl/utils')

const mockHash = hash as jest.MockedFunction<typeof hash>
const mockGetStoredProtocol = getStoredProtocol as jest.MockedFunction<
  typeof getStoredProtocol
>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseProtocolMetadata = useProtocolMetadata as jest.MockedFunction<
  typeof useProtocolMetadata
>
const mockUseRunTimestamps = useRunTimestamps as jest.MockedFunction<
  typeof useRunTimestamps
>
const mockFormatInterval = formatInterval as jest.MockedFunction<
  typeof formatInterval
>

let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(jest.fn(), {})

const RUN_ID = '1'
const RUN_ID_2 = '2'
const ROBOT_NAME = 'otie'

const PIPETTES = [
  { id: '1', pipetteName: 'testModelLeft' },
  { id: '2', pipetteName: 'testModelRight' },
]
const FORMATTED_PIPETTES = 'testModelLeft,testModelRight'
const MODULES = {
  module1: { model: 'module1' },
  module2: { model: 'module2' },
}
const FORMATTED_MODULES = 'module1,module2'
const STORED_PROTOCOL_ANALYSIS = {
  config: { protocolType: 'json', schemaVersion: 1.11 },
  metadata: {
    author: 'testAuthor',
    apiLevel: 2.2,
    protocolName: 'stored protocol',
    source: 'stored protocol source',
  },
  robotType: 'OT-2 Standard',
  pipettes: PIPETTES,
  modules: MODULES,
}
const ROBOT_PROTOCOL_ANALYSIS = {
  robotType: 'OT-2 Standard',
  pipettes: PIPETTES,
  modules: MODULES,
}

describe('useProtocolAnalysisErrors hook', () => {
  beforeEach(() => {
    store = createStore(jest.fn(), {})
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockHash.mockReturnValue(new Promise(resolve => resolve('hashedString')))
    mockGetStoredProtocol.mockReturnValue({
      srcFiles: Buffer.from('protocol content'),
    } as any)
    when(mockUseStoredProtocolAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(STORED_PROTOCOL_ANALYSIS as any)
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({ protocolData: null } as any)
    mockUseProtocolMetadata.mockReturnValue({
      author: 'testAuthor',
      apiLevel: 2.3,
      protocolName: 'robot protocol',
      source: 'robot protocol source',
    })
    mockUseRunTimestamps.mockReturnValue({ startedAt: '100000' } as any)
    mockFormatInterval.mockReturnValue('1:00:00')
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns getProtocolRunAnalyticsData function', () => {
    const { result } = renderHook(
      () => useProtocolRunAnalyticsData(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    expect(typeof result.current.getProtocolRunAnalyticsData).toEqual(
      'function'
    )
  })

  it('getProtocolRunAnalyticsData returns robot data when available', async () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID_2)
      .mockReturnValue({ protocolData: ROBOT_PROTOCOL_ANALYSIS } as any)
    const { result } = renderHook(
      () => useProtocolRunAnalyticsData(RUN_ID_2, ROBOT_NAME),
      {
        wrapper,
      }
    )
    const protocolRunAnalyticsData = await waitFor(() =>
      result.current.getProtocolRunAnalyticsData()
    )
    expect(protocolRunAnalyticsData).toStrictEqual({
      protocolRunAnalyticsData: {
        pipettes: FORMATTED_PIPETTES,
        modules: FORMATTED_MODULES,
        protocolApiVersion: 2.3,
        protocolAppName: 'Python API',
        protocolAppVersion: 2.3,
        protocolAuthor: 'hashedString',
        protocolName: 'robot protocol',
        protocolSource: 'robot protocol source',
        protocolText: 'hashedString',
        protocolType: '',
        robotType: 'OT-2 Standard',
        robotSerialNumber: '',
      },
      runTime: '1:00:00',
    })
  })

  it('getProtocolRunAnalyticsData returns fallback stored data when robot data unavailable', async () => {
    const { result } = renderHook(
      () => useProtocolRunAnalyticsData(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    const protocolRunAnalyticsData = await waitFor(() =>
      result.current.getProtocolRunAnalyticsData()
    )
    expect(protocolRunAnalyticsData).toStrictEqual({
      protocolRunAnalyticsData: {
        pipettes: FORMATTED_PIPETTES,
        modules: FORMATTED_MODULES,
        protocolApiVersion: 2.2,
        protocolAppName: 'Protocol Designer',
        protocolAppVersion: '1.1',
        protocolAuthor: 'hashedString',
        protocolName: 'stored protocol',
        protocolSource: 'stored protocol source',
        protocolText: 'hashedString',
        protocolType: 'json',
        robotType: 'OT-2 Standard',
        robotSerialNumber: '',
      },
      runTime: '1:00:00',
    })
  })
})
