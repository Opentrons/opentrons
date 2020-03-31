// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as RobotControls from '../../../robot-controls'
import * as RobotAdmin from '../../../robot-admin'
import * as RobotSelectors from '../../../robot/selectors'
import * as ConfigSelectors from '../../../config/selectors'
import { ControlsCard } from '../ControlsCard'
import { LabeledToggle, LabeledButton } from '@opentrons/components'
import { CONNECTABLE, UNREACHABLE } from '../../../discovery'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../robot-controls/selectors')
jest.mock('../../../robot/selectors')
jest.mock('../../../config/selectors')

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

const getFeatureFlags: JestMockFn<
  [State],
  $Call<typeof ConfigSelectors.getFeatureFlags, State>
> = ConfigSelectors.getFeatureFlags

describe('ControlsCard', () => {
  let mockStore
  let render

  const getDeckCalButton = wrapper =>
    wrapper
      .find({ label: 'Calibrate deck' })
      .find(LabeledButton)
      .find('button')

  const getRobotCalibrationCheckButton = wrapper =>
    wrapper
      .find({ label: 'Check deck calibration' })
      .find(LabeledButton)
      .find('button')

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
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    getFeatureFlags.mockReturnValue({
      enableRobotCalCheck: true,
    })

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
    jest.resetAllMocks()
  })

  it('calls fetchLights on mount', () => {
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      RobotControls.fetchLights(mockRobot.name)
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
    expect(getRobotCalibrationCheckButton(wrapper).prop('disabled')).toBe(false)
    expect(getHomeButton(wrapper).prop('disabled')).toBe(false)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(false)
  })

  it('DC, check cal, home, and restart buttons disabled if not connectable', () => {
    const wrapper = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getRobotCalibrationCheckButton(wrapper).prop('disabled')).toBe(true)
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
    expect(getRobotCalibrationCheckButton(wrapper).prop('disabled')).toBe(true)
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('DC, check cal, home, and restart buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const wrapper = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(true)
    expect(getRobotCalibrationCheckButton(wrapper).prop('disabled')).toBe(true)
    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('Check cal button does not render if feature flag off', () => {
    mockGetIsRunning.mockReturnValue(true)

    getFeatureFlags.mockReturnValue({
      enableRobotCalCheck: false,
    })

    const wrapper = render()

    expect(wrapper.exists({ label: 'Check deck calibration' })).toBe(false)
  })
})
