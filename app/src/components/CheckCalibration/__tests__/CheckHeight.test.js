// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'

import {
  CHECK_TRANSFORM_TYPE_UNKNOWN,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_DECK,
} from '../../../calibration'
import { CheckHeight } from '../CheckHeight'

describe('CheckHeight', () => {
  let render

  const mockComparePoint = jest.fn()
  const mockGoToNextCheck = jest.fn()
  const mockJog = jest.fn()
  const mockExit = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('PrimaryButton[children="Go To Next Check"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getExitButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="exit robot calibration check"]')
      .find('button')

  const getVideo = wrapper => wrapper.find(`source`)

  const getDeckCalArticleLink = wrapper =>
    wrapper.find(
      'a[href="https://support.opentrons.com/en/articles/2687620-get-started-calibrate-the-deck"]'
    )

  const getContactSupport = wrapper =>
    wrapper.find(
      'p[children="Please contact Opentrons support for next steps."]'
    )

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
          transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
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
        multi: 'SLOT_5_LEFT_MULTI_Z_(640X480)_REV3.webm',
        single: 'SLOT_5_LEFT_SINGLE_Z_(640X480)_REV3.webm',
      },
      right: {
        multi: 'SLOT_5_RIGHT_MULTI_Z_(640X480)_REV3.webm',
        single: 'SLOT_5_RIGHT_SINGLE_Z_(640X480)_REV3.webm',
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
    const jogParamsByDirection = {
      up: ['z', 1, 0.1],
      down: ['z', -1, 0.1],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockJog).toHaveBeenCalledWith(...jogParamsByDirection[direction])
    })

    const unavailableJogDirections = ['left', 'right', 'back', 'forward']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('compares check step when primary button is clicked', () => {
    const wrapper = render()

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockComparePoint).toHaveBeenCalled()
  })

  it('confirms check step when isInspecting and primary button is clicked', () => {
    const wrapper = render({ isInspecting: true })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockGoToNextCheck).toHaveBeenCalled()
  })

  it('no exit button when isInspecting not exceeded threshold', () => {
    const wrapper = render({ isInspecting: true })

    expect(getExitButton(wrapper).exists()).toBe(false)
  })

  it('confirms check step when isInspecting and primary button is clicked, and deck transform issue', () => {
    const comparison = {
      differenceVector: [0, 0, 0],
      thresholdVector: [1, 1, 1],
      exceedsThreshold: true,
      transformType: CHECK_TRANSFORM_TYPE_DECK,
    }
    const wrapper = render({ isInspecting: true, comparison })

    act(() => getContinueButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockGoToNextCheck).toHaveBeenCalled()
    expect(getDeckCalArticleLink(wrapper).exists()).toBe(true)
    expect(getContactSupport(wrapper).exists()).toBe(false)
  })

  it('does not render deck cal blurb when exceeds threshold and transform type is instr offset', () => {
    const comparison = {
      differenceVector: [0, 0, 0],
      thresholdVector: [1, 1, 1],
      exceedsThreshold: true,
      transformType: CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
    }
    const wrapper = render({ isInspecting: true, comparison })

    expect(getDeckCalArticleLink(wrapper).exists()).toBe(false)
    expect(getContactSupport(wrapper).exists()).toBe(true)
  })

  it('does not render deck cal blurb when exceeds threshold and transform type is unknown', () => {
    const comparison = {
      differenceVector: [0, 0, 0],
      thresholdVector: [1, 1, 1],
      exceedsThreshold: true,
      transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
    }
    const wrapper = render({ isInspecting: true, comparison })

    expect(getDeckCalArticleLink(wrapper).exists()).toBe(false)
    expect(getContactSupport(wrapper).exists()).toBe(true)
  })
})
