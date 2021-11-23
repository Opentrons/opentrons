import * as React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { getConnectedRobotName } from '../../../../../redux/robot/selectors'
import { getDeckCalibrationStatus } from '../../../../../redux/calibration/selectors'
import { mockTipRackDefinition } from '../../../../../redux/custom-labware/__fixtures__'
import { useCurrentRunPipetteInfoByMount } from '../useCurrentRunPipetteInfoByMount'
import { useProtocolCalibrationStatus } from '../useProtocolCalibrationStatus'
import type { Store } from 'redux'
import type { State } from '../../../../../redux/types'

jest.mock('../../../../../redux/robot/selectors')
jest.mock('../../../../../redux/calibration/selectors')
jest.mock('../useCurrentRunPipetteInfoByMount')

const mockGetConnectedRobotName = getConnectedRobotName as jest.MockedFunction<
  typeof getConnectedRobotName
>
const mockGetDeckCalibrationStatus = getDeckCalibrationStatus as jest.MockedFunction<
  typeof getDeckCalibrationStatus
>
const mockUseCurrentRunPipetteInfoByMount = useCurrentRunPipetteInfoByMount as jest.MockedFunction<
  typeof useCurrentRunPipetteInfoByMount
>

describe('useProtocolCalibrationStatus hook', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()

    when(mockGetConnectedRobotName)
      .calledWith(undefined as any)
      .mockReturnValue('robot name')

    when(mockGetDeckCalibrationStatus)
      .calledWith(undefined as any, 'robot name')
      .mockReturnValue('OK')

    when(mockUseCurrentRunPipetteInfoByMount).calledWith().mockReturnValue({
      left: null,
      right: null,
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('should return deck cal failure if not calibrated', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockGetDeckCalibrationStatus.mockReturnValue('BAD_CALIBRATION')
    const { result } = renderHook(useProtocolCalibrationStatus, { wrapper })
    expect(result.current).toMatchObject({
      complete: false,
      reason: 'calibrate_deck_failure_reason',
    })
  })
  it('should return attach pipette if missing', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
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
      },
      right: null,
    } as any)
    const { result } = renderHook(useProtocolCalibrationStatus, { wrapper })
    expect(result.current).toMatchObject({
      complete: false,
      reason: 'attach_pipette_failure_reason',
    })
  })
  it('should return calibrate pipette if cal date null', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
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
      },
      right: null,
    } as any)
    const { result } = renderHook(useProtocolCalibrationStatus, { wrapper })
    expect(result.current).toMatchObject({
      complete: false,
      reason: 'calibrate_pipette_failure_reason',
    })
  })
  it('should return calibrate tip rack if cal date null', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
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
      },
      right: null,
    } as any)
    const { result } = renderHook(useProtocolCalibrationStatus, { wrapper })
    expect(result.current).toMatchObject({
      complete: false,
      reason: 'calibrate_tiprack_failure_reason',
    })
  })
  it('should return complete if everything is calibrated', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseCurrentRunPipetteInfoByMount.mockReturnValue({
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
      },
      right: null,
    } as any)
    const { result } = renderHook(useProtocolCalibrationStatus, { wrapper })
    expect(result.current).toMatchObject({
      complete: true,
    })
  })
})
