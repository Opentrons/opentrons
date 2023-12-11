import * as React from 'react'
import { createStore, Store } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { resetAllWhenMocks, when } from 'jest-when'
import { waitFor, renderHook } from '@testing-library/react'

import { STORED_PROTOCOL_ANALYSIS } from '../__fixtures__/storedProtocolAnalysis'
import { useTrackCreateProtocolRunEvent } from '../useTrackCreateProtocolRunEvent'
import { parseProtocolRunAnalyticsData } from '../useProtocolRunAnalyticsData'
import { parseProtocolAnalysisOutput } from '../useStoredProtocolAnalysis'
import { useTrackEvent } from '../../../../redux/analytics'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'

import type { ProtocolAnalyticsData } from '../../../../redux/analytics/types'

jest.mock('../../hooks')
jest.mock('../useProtocolRunAnalyticsData')
jest.mock('../useStoredProtocolAnalysis')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/pipettes')
jest.mock('../../../../redux/analytics')
jest.mock('../../../../redux/robot-settings')

const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>
const mockParseProtocolRunAnalyticsData = parseProtocolRunAnalyticsData as jest.MockedFunction<
  typeof parseProtocolRunAnalyticsData
>
const mockParseProtocolAnalysisOutput = parseProtocolAnalysisOutput as jest.MockedFunction<
  typeof parseProtocolAnalysisOutput
>

const PROTOCOL_PROPERTIES = { protocolType: 'python' } as ProtocolAnalyticsData

let mockTrackEvent: jest.Mock
let mockGetProtocolRunAnalyticsData: jest.Mock
let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(jest.fn(), {})

describe('useTrackCreateProtocolRunEvent hook', () => {
  beforeEach(() => {
    store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockTrackEvent = jest.fn()
    mockGetProtocolRunAnalyticsData = jest.fn(
      () =>
        new Promise(resolve =>
          resolve({ protocolRunAnalyticsData: PROTOCOL_PROPERTIES })
        )
    )
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockParseProtocolAnalysisOutput.mockReturnValue(STORED_PROTOCOL_ANALYSIS)
    mockParseProtocolRunAnalyticsData.mockReturnValue(
      mockGetProtocolRunAnalyticsData
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('returns trackCreateProtocolRunEvent function', () => {
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData),
      {
        wrapper,
      }
    )
    expect(typeof result.current.trackCreateProtocolRunEvent).toBe('function')
  })

  it('trackCreateProtocolRunEvent invokes trackEvent with correct props', async () => {
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackCreateProtocolRunEvent({
        name: 'createProtocolRecordRequest',
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'createProtocolRecordRequest',
      properties: PROTOCOL_PROPERTIES,
    })
  })

  it('trackCreateProtocolRunEvent calls trackEvent with error props when error is thrown in getProtocolRunAnalyticsData', async () => {
    when(mockParseProtocolRunAnalyticsData).mockReturnValue(
      () =>
        new Promise(() => {
          throw new Error('error')
        })
    )
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackCreateProtocolRunEvent({
        name: 'createProtocolRecordRequest',
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'createProtocolRecordRequest',
      properties: {
        error:
          'getProtocolRunAnalyticsData error during createProtocolRecordRequest: error',
      },
    })
  })
})
