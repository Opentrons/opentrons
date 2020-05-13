// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import {
  C_WHITE,
  SPACING_AUTO,
  SPACING_1,
  FONT_SIZE_BODY_1,
} from '../../styles'
import { Box } from '..'

describe('Box primitive component', () => {
  it('should be a simple div', () => {
    const wrapper = shallow(<Box />)
    expect(wrapper.exists('div')).toBe(true)
  })

  it('should accept an `as` prop', () => {
    const wrapper = shallow(<Box as="nav" />)
    expect(wrapper.exists('nav')).toBe(true)
  })

  it('should accept an `className` prop', () => {
    const wrapper = shallow(<Box className="extra-class" />)
    expect(wrapper.hasClass('extra-class')).toBe(true)
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Box>
        <span data-test="child" />
      </Box>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('should take a color prop', () => {
    const wrapper = shallow(<Box color={C_WHITE} />)
    expect(wrapper).toHaveStyleRule('color', '#ffffff')
  })

  it('should take a backgroundColor prop', () => {
    const wrapper = shallow(<Box backgroundColor={C_WHITE} />)
    expect(wrapper).toHaveStyleRule('background-color', '#ffffff')
  })

  it('should take spacing props', () => {
    const wrapper = shallow(<Box marginX={SPACING_AUTO} padding={SPACING_1} />)
    expect(wrapper).toHaveStyleRule('margin-left', 'auto')
    expect(wrapper).toHaveStyleRule('margin-right', 'auto')
    expect(wrapper).toHaveStyleRule('padding', SPACING_1)
  })

  it('should take typography props', () => {
    const wrapper = shallow(<Box fontSize={FONT_SIZE_BODY_1} />)
    expect(wrapper).toHaveStyleRule('font-size', FONT_SIZE_BODY_1)
  })
})
