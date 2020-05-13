// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import {
  C_WHITE,
  FONT_SIZE_DEFAULT,
  FONT_WEIGHT_REGULAR,
  LINE_HEIGHT_SOLID,
  FONT_STYLE_NORMAL,
} from '../../styles'

import { Text } from '..'

describe('Text primitive component', () => {
  it('should be a p', () => {
    const wrapper = shallow(<Text />)
    expect(wrapper.exists('p')).toBe(true)
  })

  it('should accept an `as` prop', () => {
    const wrapper = shallow(<Text as="span" />)
    expect(wrapper.exists('span')).toBe(true)
  })

  it('should accept an `className` prop', () => {
    const wrapper = shallow(<Text className="extra-class" />)
    expect(wrapper.hasClass('extra-class')).toBe(true)
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Text>
        <span data-test="child" />
      </Text>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('should reset margin to 0', () => {
    const wrapper = shallow(<Text />)
    expect(wrapper).toHaveStyleRule('margin-top', '0')
    expect(wrapper).toHaveStyleRule('margin-bottom', '0')
  })

  it('leaves color and font-size unspecified', () => {
    const wrapper = shallow(<Text />)
    expect(wrapper).toHaveStyleRule('color', undefined)
    expect(wrapper).toHaveStyleRule('font-size', undefined)
  })

  it('should take a color prop', () => {
    const wrapper = shallow(<Text color={C_WHITE} />)
    expect(wrapper).toHaveStyleRule('color', C_WHITE)
  })

  it('should take a fontSize prop', () => {
    const wrapper = shallow(<Text fontSize={FONT_SIZE_DEFAULT} />)
    expect(wrapper).toHaveStyleRule('font-size', FONT_SIZE_DEFAULT)
  })

  it('should take a fontWeight prop', () => {
    const wrapper = shallow(<Text fontWeight={FONT_WEIGHT_REGULAR} />)
    expect(wrapper).toHaveStyleRule('font-weight', `${FONT_WEIGHT_REGULAR}`)
  })

  it('should take a lineHeight prop', () => {
    const wrapper = shallow(<Text lineHeight={LINE_HEIGHT_SOLID} />)
    expect(wrapper).toHaveStyleRule('line-height', `${LINE_HEIGHT_SOLID}`)
  })

  it('should take a fontStyle prop', () => {
    const wrapper = shallow(<Text fontStyle={FONT_STYLE_NORMAL} />)
    expect(wrapper).toHaveStyleRule('font-style', FONT_STYLE_NORMAL)
  })

  it('should take spacing props', () => {
    const wrapper = shallow(<Text marginRight="100%" paddingBottom={0} />)
    expect(wrapper).toHaveStyleRule('margin-right', '100%')
    expect(wrapper).toHaveStyleRule('padding-bottom', '0')
  })
})
