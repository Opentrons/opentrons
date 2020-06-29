// @flow
import { Icon } from '@opentrons/components'
import { mount } from 'enzyme'
import * as React from 'react'

import { IconCta } from '..'

const NAME = 'some-call-to-action'
const ICON_NAME = 'flask-outline'
const TEXT = 'some text'

describe('IconCta', () => {
  const mockHandleClick = jest.fn()
  let wrapper

  beforeEach(() => {
    wrapper = mount(
      <IconCta
        name={NAME}
        iconName={ICON_NAME}
        text={TEXT}
        onClick={mockHandleClick}
      />
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a <button>', () => {
    expect(wrapper.find('button')).toHaveLength(1)
  })

  it('renders an <Icon>', () => {
    const icon = wrapper.find(Icon)
    expect(icon.prop('name')).toEqual(ICON_NAME)
  })

  it('renders text', () => {
    expect(wrapper.find('span').html()).toContain(TEXT)
  })

  it('is clickable', () => {
    expect(mockHandleClick).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    expect(mockHandleClick).toHaveBeenCalledTimes(1)
  })
})
