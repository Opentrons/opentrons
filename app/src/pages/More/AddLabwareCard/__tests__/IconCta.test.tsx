import * as React from 'react'
import { mount } from 'enzyme'
import { Icon } from '@opentrons/components'
import { IconCta } from '../IconCta'

import type { ReactWrapper } from 'enzyme'

const NAME = 'some-call-to-action'
const ICON_NAME = 'flask-outline'
const TEXT = 'some text'

describe('IconCta', () => {
  const mockHandleClick = jest.fn()
  let wrapper: ReactWrapper<React.ComponentProps<typeof IconCta>>

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
    wrapper.find('button').invoke('onClick')?.({} as React.MouseEvent)
    expect(mockHandleClick).toHaveBeenCalledTimes(1)
  })
})
