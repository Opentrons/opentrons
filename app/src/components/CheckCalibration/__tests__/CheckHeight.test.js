// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import { CheckHeight } from '../CheckHeight'

describe('CheckHeight', () => {
  let render

  const mockComparePoint = jest.fn()
  const mockGoToNextCheck = jest.fn()
  const mockJog = jest.fn()
  const mockExit = jest.fn()

  const getConfirmButton = wrapper =>
    wrapper.find('PrimaryButton[children="check z-axis"]').find('button')

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="continue"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getExitButton = (wrapper, direction) =>
    wrapper
      .find('JogButton[children="Drop tip and exit calibration check"]')
      .find('button')

  const getVideo = wrapper => wrapper.find(`source`)

  beforeEach(() => {
    render = (props = {}) => {
      const {
        isMulti = false,
        isInspecting = false,
        mountProp = 'left',
        comparison = {
          differenceVector: [0, 0, 0],
          thresholdVector: [1, 1, 1],
          exceedsThreshold: false,
        },
      } = props
      return mount(
        <CheckHeight
          isMulti={isMulti}
          isInspecting={isInspecting}
          comparison={comparison}
          mount={mountProp}
          nextButtonText="Go To Next Check"
          comparePoint={mockComparePoint}
          goToNextCheck={mockGoToNextCheck}
          jog={mockJog}
          exit={mockExit}
        />
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

      expect(mockJog).toHaveBeenCalledWith(jogVectorsByDirection[direction])
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

    expect(mockComparePoint).toHaveBeenCalled()
  })

  it('confirms check step when isInspecting and primary button is clicked', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockGoToNextCheck).toHaveBeenCalled()
  })

  it('exits when isInspecting and exit button is clicked', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getExitButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockExit).toHaveBeenCalled()
  })
})
