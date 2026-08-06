import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useRobot } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROTOCOL_RUN_ACTION,
  useTrackEvent,
} from '/app/redux/analytics'
import { getAppLanguage } from '/app/redux/config'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'

import { useProtocolRunAnalyticsData } from '../useProtocolRunAnalyticsData'
import { useTrackProtocolRunEvent } from '../useTrackProtocolRunEvent'

import type { Store } from 'redux'
import type { Mock } from 'vitest'
import type { FunctionComponent, ReactNode } from 'react'

vi.mock('/app/redux-resources/robots')
vi.mock('../useProtocolRunAnalyticsData')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/analytics')
vi.mock('/app/redux/config')

const RUN_ID = 'runId'
const ROBOT_NAME = 'otie'
const PROTOCOL_PROPERTIES = { protocolType: 'python' }

let mockTrackEvent: Mock
let mockGetProtocolRunAnalyticsData: Mock
let wrapper: FunctionComponent<{ children: ReactNode }>
let store: Store<any> = legacy_createStore(vi.fn(), {})

describe('useTrackProtocolRunEvent hook', () => {
  beforeEach(() => {
    store = legacy_createStore(vi.fn(), {})
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
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot)
    vi.mocked(useTrackEvent).mockReturnValue(mockTrackEvent)
    vi.mocked(getAppLanguage).mockReturnValue('en-US')

    when(vi.mocked(useProtocolRunAnalyticsData))
      .calledWith(RUN_ID, mockConnectableRobot)
      .thenReturn({
        getProtocolRunAnalyticsData: mockGetProtocolRunAnalyticsData,
      })
  })

  it('returns trackProtocolRunEvent function', () => {
    const { result } = renderHook(
      () => useTrackProtocolRunEvent(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    expect(typeof result.current.trackProtocolRunEvent).toBe('function')
  })

  it('trackProtocolRunEvent invokes trackEvent with correct props', async () => {
    const { result } = renderHook(
      () => useTrackProtocolRunEvent(RUN_ID, ROBOT_NAME),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {
        ...PROTOCOL_PROPERTIES,
        transactionId: RUN_ID,
        appLanguage: 'en-US',
      },
    })
  })

  it('trackProtocolRunEvent calls trackEvent without props when error is thrown in getProtocolRunAnalyticsData', async () => {
    when(vi.mocked(useProtocolRunAnalyticsData))
      .calledWith('errorId', mockConnectableRobot)
      .thenReturn({
        getProtocolRunAnalyticsData: () =>
          new Promise(() => {
            throw new Error('error')
          }),
      })
    const { result } = renderHook(
      () => useTrackProtocolRunEvent('errorId', ROBOT_NAME),
      {
        wrapper,
      }
    )
    await waitFor(() =>
      result.current.trackProtocolRunEvent({
        name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
        properties: {},
      })
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_PROTOCOL_RUN_ACTION.START,
      properties: {},
    })
  })
})
