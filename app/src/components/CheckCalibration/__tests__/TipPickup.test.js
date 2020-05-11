// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockRobotCalibrationCheckSessionData } from '../../../calibration/__fixtures__'
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
    wrapper
      .find('PrimaryButton[children="Yes, move to first check"]')
      .find('button')

  const getRejectButton = (wrapper, direction) =>
    wrapper.find('PrimaryButton[children="No, try again"]').find('button')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        isMulti = false,
        tiprack = mockRobotCalibrationCheckSessionData.labware[0],
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
    const jogVectorsByDirection = {
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockJog).toHaveBeenCalledWith(jogVectorsByDirection[direction])
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
