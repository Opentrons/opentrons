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

import { CheckHeight } from '../CheckHeight'

describe('CheckHeight', () => {
  let render
  let mockStore

  const getConfirmButton = wrapper =>
    wrapper.find('PrimaryButton[children="check z-axis"]').find('button')

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="continue"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getVideo = wrapper => wrapper.find(`source`)

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
        robotName = mockRobot.name,
        isMulti = false,
        isInspecting = false,
        mountProp = 'left',
      } = props
      return mount(
        <CheckHeight
          pipetteId={pipetteId}
          robotName={robotName}
          isMulti={isMulti}
          isInspecting={isInspecting}
          mount={mountProp}
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

  it('displays proper demo asset', () => {
    const assetMap = {
      left: {
        multi: 'SLOT_5_LEFT_MULTI_Z_(640X480)_REV1.webm',
        single: 'SLOT_5_LEFT_SINGLE_Z_(640X480)_REV1.webm',
      },
      right: {
        multi: 'SLOT_5_RIGHT_MULTI_Z_(640X480)_REV1.webm',
        single: 'SLOT_5_RIGHT_SINGLE_Z_(640X480)_REV1.webm',
      },
    }

    Object.keys(assetMap).forEach(mountString => {
      Object.keys(assetMap[mountString]).forEach(channelString => {
        const wrapper = render({
          mountProp: mountString,
          isMulti: channelString === 'multi',
        })
        expect(getVideo(wrapper).prop('src')).toEqual(
          assetMap[mountString][channelString]
        )
      })
    })
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['up', 'down']
    const jogVectorsByDirection = {
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

    const unavailableJogDirections = ['left', 'right', 'back', 'forward']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('compares check step when primary button is clicked', () => {
    const wrapper = render()

    act(() => getConfirmButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.comparePointRobotCalibrationCheck(
        mockRobot.name,
        'abc123_pipette_uuid'
      )
    )
  })

  it('confirms check step when isInspecting and primary button is clicked', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockStore.dispatch).toHaveBeenCalledWith(
      Calibration.confirmStepRobotCalibrationCheck(
        mockRobot.name,
        'abc123_pipette_uuid'
      )
    )
  })
})
