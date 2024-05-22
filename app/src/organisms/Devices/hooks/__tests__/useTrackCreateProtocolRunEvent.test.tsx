import * as React from 'react'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { waitFor, renderHook } from '@testing-library/react'

import { STORED_PROTOCOL_ANALYSIS } from '../__fixtures__/storedProtocolAnalysis'
import { useTrackCreateProtocolRunEvent } from '../useTrackCreateProtocolRunEvent'
import { parseProtocolRunAnalyticsData } from '../useProtocolRunAnalyticsData'
import { parseProtocolAnalysisOutput } from '../useStoredProtocolAnalysis'
import { useTrackEvent } from '../../../../redux/analytics'
import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'

import type { Mock } from 'vitest'
import type { Store } from 'redux'
import type { ProtocolAnalyticsData } from '../../../../redux/analytics/types'

vi.mock('../../hooks')
vi.mock('../useProtocolRunAnalyticsData')
vi.mock('../useStoredProtocolAnalysis')
vi.mock('../../../../redux/discovery')
vi.mock('../../../../redux/pipettes')
vi.mock('../../../../redux/analytics')
vi.mock('../../../../redux/robot-settings')

const PROTOCOL_PROPERTIES = { protocolType: 'python' } as ProtocolAnalyticsData

let mockTrackEvent: Mock
let mockGetProtocolRunAnalyticsData: Mock
let wrapper: React.FunctionComponent<{ children: React.ReactNode }>
let store: Store<any> = createStore(vi.fn(), {})

describe('useTrackCreateProtocolRunEvent hook', () => {
  beforeEach(() => {
    store = createStore(vi.fn(), {})
    store.dispatch = vi.fn()
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockTrackEvent = vi.fn()
    mockGetProtocolRunAnalyticsData = vi.fn(
      () =>
        new Promise(resolve =>
          resolve({ protocolRunAnalyticsData: PROTOCOL_PROPERTIES })
        )
    )
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(parseProtocolAnalysisOutput).mockReturnValue(
      STORED_PROTOCOL_ANALYSIS
    )
    vi.mocked(parseProtocolRunAnalyticsData).mockReturnValue(
      mockGetProtocolRunAnalyticsData
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns trackCreateProtocolRunEvent function', () => {
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData, 'otie'),
      {
        wrapper,
      }
    )
    expect(typeof result.current.trackCreateProtocolRunEvent).toBe('function')
  })

  it('trackCreateProtocolRunEvent invokes trackEvent with correct props', async () => {
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData, 'otie'),
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
    vi.mocked(parseProtocolRunAnalyticsData).mockReturnValue(
      () =>
        new Promise(() => {
          throw new Error('error')
        })
    )
    const { result } = renderHook(
      () => useTrackCreateProtocolRunEvent(storedProtocolData, 'otie'),
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
