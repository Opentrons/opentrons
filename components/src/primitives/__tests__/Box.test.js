// @flow
import { shallow } from 'enzyme'
import * as React from 'react'

import { Box } from '..'

describe('Box primitive component', () => {
  it('should be a div with min-width: 0', () => {
    const wrapper = shallow(<Box />)
    expect(wrapper.exists('div')).toBe(true)
    expect(wrapper).toHaveStyleRule('min-width', '0')
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Box>
        <span data-test="child" />
      </Box>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
