// @flow
import { LabeledButton, LabeledToggle } from '@opentrons/components'
import { mount } from 'enzyme'
import * as React from 'react'
import { Provider } from 'react-redux'

import * as Calibration from '../../../calibration'
import { CONNECTABLE, UNREACHABLE } from '../../../discovery'
import type { ViewableRobot } from '../../../discovery/types'
import * as RobotAdmin from '../../../robot-admin'
import * as RobotControls from '../../../robot-controls'
import * as RobotSelectors from '../../../robot/selectors'
import type { State } from '../../../types'
import { CheckCalibrationControl } from '../CheckCalibrationControl'
import { ControlsCard } from '../ControlsCard'
import { DeckCalibrationWarning } from '../DeckCalibrationWarning'

jest.mock('../../../robot-controls/selectors')
jest.mock('../../../robot/selectors')
jest.mock('../../../config/selectors')
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

describe('ControlsCard', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper.find('TitledControl[title="Calibrate deck"]').find('button')

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
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    getDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)

    render = (robot: ViewableRobot = mockRobot) => {
      return mount(
        <ControlsCard robot={robot} calibrateDeckUrl="/deck/calibrate" />,
        {
          wrappingComponent: Provider,
          wrappingComponentProps: { store: mockStore },
        }
      )
    }
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('calls fetchLights on mount', () => {
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      RobotControls.fetchLights(mockRobot.name)
    )
  })

  it('calls fetchCalibrationStatus on mount and on a 10s interval', () => {
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    mockStore.dispatch.mockReset()
    jest.advanceTimersByTime(20000)
    expect(mockStore.dispatch).toHaveBeenCalledTimes(2)
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(
      2,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
  })

  it('calls updateLights with toggle on button click', () => {
    mockGetLightsOn.mockReturnValue(true)

    const wrapper = render()

    getLightsButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      RobotControls.updateLights(mockRobot.name, false)
    )
  })

  it('calls restartRobot on button click', () => {
    const wrapper = render()

    getRestartButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      RobotAdmin.restartRobot(mockRobot.name)
    )
  })

  it('calls home on button click', () => {
    const wrapper = render()

    getHomeButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      RobotControls.home(mockRobot.name, RobotControls.ROBOT)
    )
  })

  it('DC, check cal, home, and restart buttons enabled if connected and not running', () => {
    mockGetIsRunning.mockReturnValue(false)

    const wrapper = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(false)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      null
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(false)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(false)
  })

  it('DC, check cal, home, and restart buttons disabled if not connectable', () => {
    const wrapper = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
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

    const wrapper = render(mockRobotNotConnected)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('DC, check cal, home, and restart buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const wrapper = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Protocol is running'
    )
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('does not render check cal button if GET /calibration/status has not responded', () => {
    getDeckCalibrationStatus.mockReturnValue(null)

    const wrapper = render()
    expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
  })

  it('disables check cal button if deck calibration is bad', () => {
    getDeckCalibrationStatus.mockImplementation((state, rName) => {
      expect(state).toEqual({ mockState: true })
      expect(rName).toEqual(mockRobot.name)
      return Calibration.DECK_CAL_STATUS_BAD_CALIBRATION
    })

    const wrapper = render()

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
    const wrapper = render()

    // check that the deck calibration warning component is not null
    // TODO(lc, 2020-06-18): Mock out the new transform status such that
    // this should evaluate to true.
    expect(wrapper.exists(DeckCalibrationWarning)).toBe(true)
  })
})
