// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { act } from 'react-dom/test-utils'

import { mockRobotCalibrationCheckSessionDetails } from '../../../sessions/__fixtures__'
import { TipPickUp } from '../TipPickUp'

describe('TipPickUp', () => {
  let render

  const mockPickUpTip = jest.fn()
  const mockConfirmTip = jest.fn()
  const mockInvalidateTip = jest.fn()
  const mockJog = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="Pick up tip"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getConfirmButton = wrapper =>
    wrapper.find('PrimaryButton[children="Yes, continue"]').find('button')

  const getRejectButton = (wrapper, direction) =>
    wrapper.find('PrimaryButton[children="No, try again"]').find('button')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        isMulti = false,
        tiprack = mockRobotCalibrationCheckSessionDetails.labware[0],
        isInspecting = false,
        tipRackWellName = 'A1',
      } = props
      return mount(
        <TipPickUp
          isMulti={isMulti}
          tiprack={tiprack}
          isInspecting={isInspecting}
          tipRackWellName={tipRackWellName}
          confirmTip={mockConfirmTip}
          invalidateTip={mockInvalidateTip}
          pickUpTip={mockPickUpTip}
          jog={mockJog}
        />
      )
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('picks up tip after jogging, when not inspecting tip', () => {
    const wrapper = render()

    const jogDirections = ['left', 'right', 'back', 'forward', 'up', 'down']
    const jogParamsByDirection = {
      left: ['x', -1, 0.1],
      right: ['x', 1, 0.1],
      back: ['y', 1, 0.1],
      forward: ['y', -1, 0.1],
      up: ['z', 1, 0.1],
      down: ['z', -1, 0.1],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockJog).toHaveBeenCalledWith(...jogParamsByDirection[direction])
    })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockPickUpTip).toHaveBeenCalled()
  })

  it('gives option to continue or invalidate tip if inspecting', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getConfirmButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockConfirmTip).toHaveBeenCalled()

    act(() => getRejectButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockInvalidateTip).toHaveBeenCalled()
  })
})
