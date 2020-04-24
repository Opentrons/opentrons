// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { act } from 'react-dom/test-utils'
import {
  mockRobotCalibrationCheckSessionData,
  mockRobot,
} from '../../../calibration/__fixtures__'
import * as Calibration from '../../../calibration'

import { TipPickUp, type TipPickUpProps } from '../TipPickUp'

describe('TipPickUp', () => {
  let render
  let mockStore

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
    mockStore = {
      subscribe: () => {},
      getState: () => ({
        mockState: true,
      }),
      dispatch: jest.fn(),
    }

    render = (props = {}) => {
      const {
        pipetteId = Object.keys(
          mockRobotCalibrationCheckSessionData.instruments
        )[0],
        isMulti = false,
        tiprack = mockRobotCalibrationCheckSessionData.labware[0],
        robotName = mockRobot.name,
        isInspecting = false,
      } = props
      return mount(
        <TipPickUp
          pipetteId={pipetteId}
          isMulti={isMulti}
          tiprack={tiprack}
          robotName={robotName}
          isInspecting={isInspecting}
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

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        Calibration.jogRobotCalibrationCheck(
          mockRobot.name,
          'abc123_pipette_uuid',
          jogVectorsByDirection[direction]
        )
      )
    })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.pickUpTipRobotCalibrationCheck(
        mockRobot.name,
        'abc123_pipette_uuid'
      )
    )
  })

  it('gives option to continue or invalidate tip if inspecting', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getConfirmButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.confirmTipRobotCalibrationCheck(
        mockRobot.name,
        'abc123_pipette_uuid'
      )
    )

    act(() => getRejectButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.invalidateTipRobotCalibrationCheck(
        mockRobot.name,
        'abc123_pipette_uuid'
      )
    )
  })
})
