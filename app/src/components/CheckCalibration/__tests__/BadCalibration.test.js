// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import * as Sessions from '../../../sessions'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'

import { BadCalibration } from '../BadCalibration'

describe('BadCalibration', () => {
  const mockDeleteSession = jest.fn()

  const getExitButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Drop tip in trash and exit"]')
      .find('button')
  const render = (
    props: $Shape<React.ElementProps<typeof BadCalibration>> = {}
  ) => {
    const {
      pipMount = 'left',
      isMulti = false,
      tipRack = mockDeckCalTipRack,
      calBlock = null,
      sendCommands = jest.fn(),
      cleanUpAndExit = mockDeleteSession,
      currentStep = Sessions.CHECK_STEP_BAD_ROBOT_CALIBRATION,
      sessionType = Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
    } = props
    return mount(
      <BadCalibration
        isMulti={isMulti}
        mount={pipMount}
        tipRack={tipRack}
        calBlock={calBlock}
        sendCommands={sendCommands}
        cleanUpAndExit={cleanUpAndExit}
        currentStep={currentStep}
        sessionType={sessionType}
      />
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking button exits calibration check', () => {
    const wrapper = render()
    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockDeleteSession).toHaveBeenCalled()
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })
})
