// @flow

import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as PipetteOffset from '../../../calibration/pipette-offset'
import * as Calibration from '../../../calibration'
import * as Pipettes from '../../../pipettes'
import * as Config from '../../../config'
import * as RobotSelectors from '../../../robot/selectors'

import { CalibrationCard } from '../CalibrationCard'
import { CheckCalibrationControl } from '../CheckCalibrationControl'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'
import { PipetteOffsets } from '../PipetteOffsets'

import { CONNECTABLE, UNREACHABLE } from '../../../discovery'

import type { State, Action } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('react-router-dom', () => ({ Link: 'a' }))

jest.mock('../../../robot/selectors')
jest.mock('../../../config/selectors')
jest.mock('../../../calibration/selectors')
jest.mock('../../../sessions/selectors')

jest.mock('../CheckCalibrationControl', () => ({
  CheckCalibrationControl: () => <></>,
}))

jest.mock('../PipetteOffsets', () => ({
  PipetteOffsets: () => <></>,
}))

const MOCK_STATE: State = ({ mockState: true }: any)

const mockGetIsRunning: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsRunning, State>
> = RobotSelectors.getIsRunning

const mockUnconnectableRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: UNREACHABLE,
}: any)

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

const getDeckCalibrationStatus: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getDeckCalibrationStatus, State, string>
> = Calibration.getDeckCalibrationStatus
const getDeckCalButton = wrapper =>
  wrapper
    .find('TitledControl[title="Calibrate deck"]')
    .find('button')
    .filter({ children: 'Calibrate' })

const getCheckCalibrationControl = wrapper =>
  wrapper.find(CheckCalibrationControl)

describe('CalibrationCard', () => {
  const render = (robot: ViewableRobot = mockRobot) => {
    return mountWithStore<_, State, Action>(
      <CalibrationCard robot={robot} pipettesPageUrl={'fake-url'} />,
      {
        initialState: MOCK_STATE,
      }
    )
  }

  beforeEach(() => {
    jest.useFakeTimers()
    getDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    getFeatureFlags.mockReturnValue({
      enableCalibrationOverhaul: true,
      allPipetteConfig: false,
      enableBundleUpload: false,
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('calls fetches data on mount and on a 10s interval', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Pipettes.fetchPipettes(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      PipetteOffset.fetchPipetteOffsetCalibrations(mockRobot.name)
    )
    store.dispatch.mockReset()
    jest.advanceTimersByTime(20000)
    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
  })

  it('DC and check cal buttons enabled if connected and not running', () => {
    mockGetIsRunning.mockReturnValue(false)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(null)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      null
    )
  })

  it('DC and check cal buttons disabled if not connectable', () => {
    const { wrapper } = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Cannot connect to robot'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Cannot connect to robot'
    )
  })

  it('DC and check cal buttons disabled if not connected', () => {
    const mockRobotNotConnected: ViewableRobot = ({
      name: 'robot-name',
      connected: false,
      status: CONNECTABLE,
    }: any)

    const { wrapper } = render(mockRobotNotConnected)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Connect to robot to control'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
    )
  })

  it('DC and check cal buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Protocol is running'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Protocol is running'
    )
  })

  it('does not render check cal button if GET /calibration/status has not responded', () => {
    getDeckCalibrationStatus.mockReturnValue(null)

    const { wrapper } = render()
    expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
  })

  it('disables check cal button if deck calibration is bad', () => {
    getDeckCalibrationStatus.mockImplementation((state, rName) => {
      expect(state).toEqual(MOCK_STATE)
      expect(rName).toEqual(mockRobot.name)
      return Calibration.DECK_CAL_STATUS_BAD_CALIBRATION
    })

    const { wrapper } = render()

    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Bad deck calibration detected. Please perform a full deck calibration.'
    )

    getDeckCalibrationStatus.mockReturnValue(
      Calibration.DECK_CAL_STATUS_SINGULARITY
    )
    wrapper.setProps({})
    wrapper.update()

    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Bad deck calibration detected. Please perform a full deck calibration.'
    )

    getDeckCalibrationStatus.mockReturnValue(
      Calibration.DECK_CAL_STATUS_IDENTITY
    )
    wrapper.setProps({})
    wrapper.update()

    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Please perform a full deck calibration.'
    )
  })

  it('DeckCalibrationWarning component renders if deck calibration is bad', () => {
    const { wrapper } = render()

    // check that the deck calibration warning component is not null
    // TODO(lc, 2020-06-18): Mock out the new transform status such that
    // this should evaluate to true.
    expect(wrapper.exists(DeckCalibrationWarning)).toBe(true)
  })
  it('renders PipetteOffsets', () => {
    const { wrapper } = render()
    expect(wrapper.exists(PipetteOffsets)).toBe(true)
  })
})
