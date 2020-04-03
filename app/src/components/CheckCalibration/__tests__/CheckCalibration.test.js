// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Calibration from '../../../calibration'
import { mockRobotCalibrationCheckSessionData } from '../../../calibration/__fixtures__'

import { CheckCalibration } from '../index'
import { Introduction } from '../Introduction'
import { CompleteConfirmation } from '../CompleteConfirmation'

import type { State } from '../../../types'

jest.mock('../../../calibration/selectors')

const getRobotCalibrationCheckSession: JestMockFn<
  [State, string],
  $Call<typeof Calibration.getRobotCalibrationCheckSession, State, string>
> = Calibration.getRobotCalibrationCheckSession

describe('CheckCalibration', () => {
  let mockStore
  let render

  const mockCloseCalibrationCheck = jest.fn()

  const getBackButton = wrapper =>
    wrapper.find({ title: 'Back' }).find('button')

  beforeEach(() => {
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    render = () => {
      return mount(
        <CheckCalibration
          robotName="robot-name"
          closeCalibrationCheck={mockCloseCalibrationCheck}
        />,
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

  it('creates a robot cal check session on mount', () => {
    getRobotCalibrationCheckSession.mockReturnValue(
      mockRobotCalibrationCheckSessionData
    )
    render()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.createRobotCalibrationCheckSession('robot-name')
    )
  })

  it('renders Introduction contents when currentStep is sessionStart', () => {
    getRobotCalibrationCheckSession.mockReturnValue({
      ...mockRobotCalibrationCheckSessionData,
      currentStep: 'sessionStart',
    })
    const wrapper = render()

    expect(wrapper.exists(Introduction)).toBe(true)
    expect(wrapper.exists(CompleteConfirmation)).toBe(false)
  })

  it('calls deleteRobotCalibrationCheckSession on exit click', () => {
    const wrapper = render()

    getBackButton(wrapper).invoke('onClick')()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.deleteRobotCalibrationCheckSession('robot-name')
    )
    expect(mockCloseCalibrationCheck).toHaveBeenCalled()
  })
})
