// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as RobotControls from '../../../robot-controls'
import * as RobotAdmin from '../../../robot-admin'
import * as RobotSelectors from '../../../robot/selectors'

import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionData } from '../../../calibration/__fixtures__'

import { CheckCalibration } from '../index'
import { Introduction } from '../Introduction'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../calibration/selectors')

const getRobotCalibrationCheckSession: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getRobotCalibrationCheckSession, State, string>
> = Calibration.getRobotCalibrationCheckSession

describe('CheckCalibration', () => {
  let mockStore
  let render

  const getIntroduction = wrapper =>
    wrapper
      .find(Introduction)

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

    render = (robot: ViewableRobot = mockRobot) => {
      return mount(
        <CheckCalibration robotName="robot-name" closeCalibrationCheck={() => {}} />,
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

  it('renders Introduction contents when currentStep is sessionStart', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'sessionStart',
    })
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


})
