// @flow
import { shallow } from 'enzyme'
import * as React from 'react'

import { Link } from '..'

describe('Link primitive component', () => {
  it('should be an <a> with text-decoration: none', () => {
    const wrapper = shallow(<Link href="https://opentrons.com" />)

    expect(wrapper).toHaveStyleRule('text-decoration', 'none')
    expect(wrapper.find('a').prop('href')).toBe('https://opentrons.com')
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Link>
        <span data-test="child" />
      </Link>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('should support external links', () => {
    const wrapper = shallow(<Link href="https://opentrons.com" external />)
    const anchor = wrapper.find('a')
    expect(anchor.prop('target')).toBe('_blank')
    expect(anchor.prop('rel')).toBe('noopener noreferrer')
    expect(anchor.prop('external')).toBe(undefined)
  })
})
