import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  useInstrumentsQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
  useTrackEvent,
} from '/app/redux/analytics'

import { useDownloadCalibrationData } from '../useDownloadCalibrationData'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'

// file-saver has circular dep, need to mock with factory to prevent error
vi.mock('file-saver', async importOriginal => {
  const actual = await importOriginal<any>()
  return { ...actual, saveAs: vi.fn() }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/analytics')

const ROBOT_NAME = 'otie'

describe('useDownloadCalibrationData', () => {
  let mockTrackEvent: any
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    const store: Store<any> = legacy_createStore(vi.fn(), {})
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    )
    mockTrackEvent = vi.fn()
    when(useTrackEvent).calledWith().thenReturn(mockTrackEvent)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    vi.mocked(useModulesQuery).mockReturnValue({
      data: { data: [] },
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fires analytics event with Flex robot type on download', () => {
    const { result } = renderHook(
      () => useDownloadCalibrationData(ROBOT_NAME),
      { wrapper }
    )
    result.current.downloadCalibration()
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_CALIBRATION_DATA_DOWNLOADED,
      properties: { robotType: FLEX_ROBOT_TYPE },
    })
  })
})
