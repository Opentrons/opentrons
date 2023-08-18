import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import { mockTipRackDefinition } from '../../../../redux/custom-labware/__fixtures__'

import {
  useRunCalibrationStatus,
  useDeckCalibrationStatus,
  useIsOT3,
  useRunPipetteInfoByMount,
} from '..'

import type { PipetteInfo } from '..'
import { Provider } from 'react-redux'
import { createStore } from 'redux'

jest.mock('../useDeckCalibrationStatus')
jest.mock('../useIsOT3')
jest.mock('../useRunPipetteInfoByMount')

const mockUseDeckCalibrationStatus = useDeckCalibrationStatus as jest.MockedFunction<
  typeof useDeckCalibrationStatus
>
const mockUseIsOT3 = useIsOT3 as jest.MockedFunction<typeof useIsOT3>
const mockUseRunPipetteInfoByMount = useRunPipetteInfoByMount as jest.MockedFunction<
  typeof useRunPipetteInfoByMount
>
let wrapper: React.FunctionComponent<{}>

describe('useRunCalibrationStatus hook', () => {
  beforeEach(() => {
    when(mockUseDeckCalibrationStatus).calledWith('otie').mockReturnValue('OK')

    when(mockUseRunPipetteInfoByMount).calledWith('1').mockReturnValue({
      left: null,
      right: null,
    })
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(false)

    const store = createStore(jest.fn(), {})
    store.dispatch = jest.fn()
    store.getState = jest.fn(() => {})

    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>
    )
  })

  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return deck cal failure if not calibrated', () => {
    when(mockUseDeckCalibrationStatus)
      .calledWith('otie')
      .mockReturnValue('BAD_CALIBRATION')
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    })
  })
  it('should ignore deck calibration status of an OT-3', () => {
    when(mockUseDeckCalibrationStatus)
      .calledWith('otie')
      .mockReturnValue('BAD_CALIBRATION')
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      complete: true,
    })
  })
  it('should return attach pipette if missing', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'incompatible',
          pipetteCalDate: null,
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '',
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
      complete: false,
      reason: 'attach_pipette_failure_reason',
    })
  })
  it('should return calibrate pipette if cal date null', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('1')
      .mockReturnValue({
        left: {
          requestedPipetteMatch: 'match',
          pipetteCalDate: null,
          pipetteSpecs: {
            displayName: 'pipette 1',
          },
          tipRacksForPipette: [
            {
              displayName: 'Mock TipRack Definition',
              lastModifiedDate: '',
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
      complete: false,
      reason: 'calibrate_pipette_failure_reason',
    })
  })
  it('should return calibrate tip rack if cal date null', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('1')
      .mockReturnValue({
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
      complete: false,
      reason: 'calibrate_tiprack_failure_reason',
    })
  })
  it('should ignore tip rack calibration for the OT-3', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('1')
      .mockReturnValue({
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
    when(mockUseIsOT3).calledWith('otie').mockReturnValue(true)
    const { result } = renderHook(() => useRunCalibrationStatus('otie', '1'), {
      wrapper,
    })
    expect(result.current).toStrictEqual({
      complete: true,
    })
  })
  it('should return complete if everything is calibrated', () => {
    when(mockUseRunPipetteInfoByMount)
      .calledWith('1')
      .mockReturnValue({
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
