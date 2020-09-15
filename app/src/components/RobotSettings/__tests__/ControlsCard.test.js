// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as RobotControls from '../../../robot-controls'
import * as RobotAdmin from '../../../robot-admin'
import * as Calibration from '../../../calibration'
import * as Config from '../../../config'
import * as RobotSelectors from '../../../robot/selectors'

import { ControlsCard } from '../ControlsCard'
import { CheckCalibrationControl } from '../CheckCalibrationControl'
import { LabeledToggle, LabeledButton } from '@opentrons/components'
import { CONNECTABLE, UNREACHABLE } from '../../../discovery'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'

import type { State, Action } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../robot-controls/selectors')
jest.mock('../../../robot/selectors')
jest.mock('../../../config/selectors')
jest.mock('../../../sessions/selectors')
jest.mock('../../../calibration/selectors')

jest.mock('../CheckCalibrationControl', () => ({
  CheckCalibrationControl: () => <></>,
}))

const mockRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
}: any)

const mockUnconnectableRobot: ViewableRobot = ({
  name: 'robot-name',
  connected: true,
  status: UNREACHABLE,
}: any)

const mockGetLightsOn: JestMockFn<
  [State, string],
  $Call<typeof RobotControls.getLightsOn, State, string>
> = RobotControls.getLightsOn

const mockGetIsRunning: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getIsRunning, State>
> = RobotSelectors.getIsRunning

const getDeckCalibrationStatus: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getDeckCalibrationStatus, State, string>
> = Calibration.getDeckCalibrationStatus

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof Config.getFeatureFlags, State>
> = Config.getFeatureFlags

const MOCK_STATE: State = ({ mockState: true }: any)

describe('ControlsCard', () => {
  const render = (robot: ViewableRobot = mockRobot) => {
    return mountWithStore<_, State, Action>(
      <ControlsCard robot={robot} calibrateDeckUrl="/deck/calibrate" />,
      { initialState: MOCK_STATE }
    )
  }

  const getDeckCalButton = wrapper =>
    wrapper
      .find('TitledControl[title="Calibrate deck"]')
      .find('button')
      .filter({ children: 'Calibrate' })

  const getCheckCalibrationControl = wrapper =>
    wrapper.find(CheckCalibrationControl)

  const getHomeButton = wrapper =>
    wrapper
      .find({ label: 'Home all axes' })
      .find(LabeledButton)
      .find('button')

  const getRestartButton = wrapper =>
    wrapper
      .find({ label: 'Restart robot' })
      .find(LabeledButton)
      .find('button')

  const getLightsButton = wrapper =>
    wrapper.find({ label: 'Lights' }).find(LabeledToggle)

  beforeEach(() => {
    jest.useFakeTimers()
    getDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    getFeatureFlags.mockReturnValue({})
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('calls fetchLights on mount', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotControls.fetchLights(mockRobot.name)
    )
  })

  it('calls fetchCalibrationStatus on mount and on a 10s interval', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenCalledWith(
      Calibration.fetchCalibrationStatus(mockRobot.name)
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

  it('calls updateLights with toggle on button click', () => {
    mockGetLightsOn.mockReturnValue(true)

    const { wrapper, store } = render()

    getLightsButton(wrapper).invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotControls.updateLights(mockRobot.name, false)
    )
  })

  it('calls restartRobot on button click', () => {
    const { wrapper, store } = render()

    getRestartButton(wrapper).invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotAdmin.restartRobot(mockRobot.name)
    )
  })

  it('calls home on button click', () => {
    const { wrapper, store } = render()

    getHomeButton(wrapper).invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotControls.home(mockRobot.name, RobotControls.ROBOT)
    )
  })

  it('DC, check cal, home, and restart buttons enabled if connected and not running', () => {
    mockGetIsRunning.mockReturnValue(false)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(false)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      null
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(false)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(false)
  })

  it('DC, check cal, home, and restart buttons disabled if not connectable', () => {
    const { wrapper } = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Cannot connect to robot'
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('DC, check cal, home, and restart buttons disabled if not connected', () => {
    const mockRobotNotConnected: ViewableRobot = ({
      name: 'robot-name',
      connected: false,
      status: CONNECTABLE,
    }: any)

    const { wrapper } = render(mockRobotNotConnected)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('DC, check cal, home, and restart buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Protocol is running'
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
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
})
