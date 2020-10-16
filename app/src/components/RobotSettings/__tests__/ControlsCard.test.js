// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import * as RobotControls from '../../../robot-controls'
import * as RobotAdmin from '../../../robot-admin'
import * as RobotSelectors from '../../../robot/selectors'

import { ControlsCard } from '../ControlsCard'
import { LabeledToggle, LabeledButton } from '@opentrons/components'
import { CONNECTABLE, UNREACHABLE } from '../../../discovery'

import type { State, Action } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../robot-controls/selectors')
jest.mock('../../../robot/selectors')
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

const MOCK_STATE: State = ({ mockState: true }: any)

describe('ControlsCard', () => {
  const render = (robot: ViewableRobot = mockRobot) => {
    return mountWithStore<_, State, Action>(<ControlsCard robot={robot} />, {
      initialState: MOCK_STATE,
    })
  }

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

  it('home and restart buttons enabled if connected and not running', () => {
    mockGetIsRunning.mockReturnValue(false)

    const { wrapper } = render()

    expect(getHomeButton(wrapper).prop('disabled')).toBe(false)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(false)
  })

  it('home and restart buttons disabled if not connectable', () => {
    const { wrapper } = render(mockUnconnectableRobot)

    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('home, and restart buttons disabled if not connected', () => {
    const mockRobotNotConnected: ViewableRobot = ({
      name: 'robot-name',
      connected: false,
      status: CONNECTABLE,
    }: any)

    const { wrapper } = render(mockRobotNotConnected)

    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })

  it('home and restart buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const { wrapper } = render()

    expect(getHomeButton(wrapper).prop('disabled')).toBe(true)
    expect(getRestartButton(wrapper).prop('disabled')).toBe(true)
  })
})
