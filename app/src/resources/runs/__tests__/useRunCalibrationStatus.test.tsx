import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { mockTipRackDefinition } from '/app/redux/custom-labware/__fixtures__'

import {
  useNotifyRunQuery,
  useRunCalibrationStatus,
  useRunPipetteInfoByMount,
} from '..'

import type { FunctionComponent, ReactNode } from 'react'
import type { PipetteInfo } from '/app/resources/runs/types'

vi.mock('../useRunPipetteInfoByMount')
vi.mock('../useNotifyRunQuery')
vi.mock('/app/resources/calibration')
vi.mock('/app/resources/analysis')
vi.mock('/app/redux-resources/robots')

let wrapper: FunctionComponent<{ children: ReactNode }>

describe('useRunCalibrationStatus hook', () => {
  beforeEach(() => {
    when(vi.mocked(useRunPipetteInfoByMount)).calledWith('1').thenReturn({
      left: null,
      right: null,
    })
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)

    const store = legacy_createStore(vi.fn(), {})
    store.dispatch = vi.fn()
    store.getState = vi.fn(() => {})

    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    )
  })

  it('should ignore tip rack calibration ', () => {
    when(vi.mocked(useRunPipetteInfoByMount))
      .calledWith('1')
      .thenReturn({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: '2020-08-30T10:02',
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: null,
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      complete: true,
    })
  })
  it('should return complete if everything is calibrated', () => {
    when(vi.mocked(useRunPipetteInfoByMount))
      .calledWith('1')
      .thenReturn({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: '2020-08-30T10:02',
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '2020-08-30T10:02',
              tipRackDef: mockTipRackDefinition,
            },
          ],
        } as PipetteInfo,
        right: null,
      })
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      complete: true,
    })
  })
})
