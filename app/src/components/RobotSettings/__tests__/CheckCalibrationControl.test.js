// @flow
import { Icon, Tooltip } from '@opentrons/components'
import { mount } from 'enzyme'
import { noop } from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'

import * as RobotApi from '../../../robot-api'
import { mockRobot } from '../../../robot-api/__fixtures__'
import type { RequestState } from '../../../robot-api/types'
import * as Sessions from '../../../sessions'
import type { State } from '../../../types'
import { CheckCalibration } from '../../CheckCalibration'
import { Portal } from '../../portal'
import { TitledControl } from '../../TitledControl'
import { CheckCalibrationControl } from '../CheckCalibrationControl'

jest.mock('../../../robot-api/selectors')
jest.mock('../../CheckCalibration', () => ({
  CheckCalibration: () => <></>,
}))

const { name: robotName } = mockRobot
const MOCK_STATE: $Shape<State> = {}

const getRequestById: JestMockFn<[State, string], RequestState | null> =
  RobotApi.getRequestById

describe('CheckCalibrationControl', () => {
  const dispatch = jest.fn()
  const render = props => {
    return mount(
      <CheckCalibrationControl robotName={mockRobot.name} {...props} />,
      {
        wrappingComponent: Provider,
        wrappingComponentProps: {
          store: { getState: () => MOCK_STATE, subscribe: noop, dispatch },
        },
      }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a TitledControl', () => {
    const wrapper = render({ disabledReason: null })
    const titledButton = wrapper.find(TitledControl)

    expect(titledButton.prop('title')).toBe('Check robot calibration')
    expect(titledButton.html()).toMatch(/check the robot's calibration state/i)
  })

  it('should be able to disable the button', () => {
    const wrapper = render({ disabledReason: 'oh no!' })
    const button = wrapper.find('button')
    const tooltip = wrapper.find(Tooltip)

    expect(button.prop('disabled')).toBe(true)
    expect(tooltip.prop('children')).toBe('oh no!')
  })

  it('should ensure a calibration check session exists on click', () => {
    const wrapper = render({ disabledReason: null })

    wrapper.find('button').invoke('onClick')()

    expect(dispatch).toHaveBeenCalledWith({
      ...Sessions.ensureSession(
        robotName,
        Sessions.SESSION_TYPE_CALIBRATION_CHECK
      ),
      meta: { requestId: expect.any(String) },
    })
  })

  it('should show a spinner in the button while request is pending', () => {
    const wrapper = render({ disabledReason: null })
    wrapper.find('button').invoke('onClick')()

    const action = dispatch.mock.calls[0][0]
    const requestId = action.meta.requestId

    getRequestById.mockImplementation((state, reqId) => {
      expect(state).toBe(MOCK_STATE)
      expect(reqId).toBe(requestId)
      return { status: RobotApi.PENDING }
    })

    wrapper.setProps({})

    const button = wrapper.find('button')
    const spinner = button.find(Icon)

    expect(button.prop('disabled')).toBe(true)
    expect(spinner.prop('name')).toBe('ot-spinner')
    expect(spinner.prop('spin')).toBe(true)
  })

  it('should show a CheckCalbration wizard in a Portal when request succeeds', () => {
    const wrapper = render({ disabledReason: null })

    wrapper.find('button').invoke('onClick')()
    getRequestById.mockReturnValue(({ status: RobotApi.SUCCESS }: any))
    wrapper.setProps({})
    wrapper.update()

    const wizard = wrapper.find(Portal).find(CheckCalibration)
    expect(wizard.prop('robotName')).toBe(robotName)

    wrapper.find(CheckCalibration).invoke('closeCalibrationCheck')()
    expect(wrapper.exists(CheckCalibration)).toBe(false)
  })

  it('should show a warning message if the request fails', () => {
    const wrapper = render({ disabledReason: null })

    wrapper.find('button').invoke('onClick')()
    getRequestById.mockReturnValue({
      status: RobotApi.FAILURE,
      response: { ok: false, method: 'GET', path: '/sessions', status: 500 },
      error: { errors: [{ detail: 'oh no!' }] },
    })
    wrapper.setProps({})
    wrapper.update()

    expect(wrapper.exists(CheckCalibration)).toBe(false)
    expect(wrapper.exists('Icon[name="alert-circle"]')).toBe(true)
    expect(wrapper.html()).toMatch(/could not start robot calibration check/i)
    expect(wrapper.html()).toContain('oh no!')
  })
})
