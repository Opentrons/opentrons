// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Flex } from '..'

describe('Flex primitive component', () => {
  it('should be a div with display: flex', () => {
    const wrapper = shallow(<Flex />)
    expect(wrapper.exists('div')).toBe(true)
    expect(wrapper).toHaveStyleRule('display', 'flex')
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Flex>
        <span data-test="child" />
      </Flex>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
