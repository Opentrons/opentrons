// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { Icon } from '@opentrons/components'
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

  test('renders a <button>', () => {
    expect(wrapper.find('button')).toHaveLength(1)
  })

  test('renders an <Icon>', () => {
    const icon = wrapper.find(Icon)
    expect(icon.prop('name')).toEqual('flask-outline')
  })

  test('renders text', () => {
    expect(wrapper.find('span').html()).toContain(TEXT)
  })

  test('is clickable', () => {
    expect(mockHandleClick).toHaveBeenCalledTimes(0)
    wrapper.find('button').invoke('onClick')()
    expect(mockHandleClick).toHaveBeenCalledTimes(1)
  })
})
