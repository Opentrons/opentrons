// @flow
import { mount } from 'enzyme'
import * as React from 'react'

import {
  CHECK_TRANSFORM_TYPE_DECK,
  CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
} from '../../../sessions'
import { BadOutcomeBody } from '../BadOutcomeBody'

describe('CheckHeight', () => {
  let render

  const getBadOutcomeBlurb = wrapper => wrapper.text()

  beforeEach(() => {
    render = (props = {}) => {
      const { transform = CHECK_TRANSFORM_TYPE_UNKNOWN } = props
      return mount(<BadOutcomeBody transform={transform} />)
    }
  })

  it('renders deck calibration when exceeds threshold and transform type is deck calibration', () => {
    const wrapper = render({ transform: CHECK_TRANSFORM_TYPE_DECK })
    expect(getBadOutcomeBlurb(wrapper)).toEqual(
      expect.stringMatching(/perform a deck calibration/)
    )
  })

  it('renders instrument offset blurb when exceeds threshold and transform type is instrument offset', () => {
    const wrapper = render({
      transform: CHECK_TRANSFORM_TYPE_INSTRUMENT_OFFSET,
    })

    expect(wrapper.exists()).toBe(true)
    expect(getBadOutcomeBlurb(wrapper)).toEqual(
      expect.stringMatching(/troubleshoot/)
    )
  })

  it('renders unknown blurb when exceeds threshold and transform type is unknown', () => {
    const wrapper = render({
      transform: CHECK_TRANSFORM_TYPE_UNKNOWN,
    })

    expect(wrapper.exists()).toBe(true)
    expect(getBadOutcomeBlurb(wrapper)).toEqual(
      expect.stringMatching(/troubleshoot/)
    )
  })
})
