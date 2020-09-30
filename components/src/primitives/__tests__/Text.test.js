// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Text } from '..'

describe('Text primitive component', () => {
  it('should be a p with no margins', () => {
    const wrapper = shallow(<Text />)
    expect(wrapper.exists('p')).toBe(true)
    expect(wrapper).toHaveStyleRule('margin-top', '0')
    expect(wrapper).toHaveStyleRule('margin-bottom', '0')
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Text>
        <span data-test="child" />
      </Text>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
