// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import {
  C_WHITE,
  FONT_SIZE_DEFAULT,
  FONT_SIZE_HEADER,
  FONT_SIZE_BODY_2,
  FONT_SIZE_BODY_1,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_SOLID,
  LINE_HEIGHT_TITLE,
  LINE_HEIGHT_COPY,
  FONT_STYLE_NORMAL,
  FONT_STYLE_ITALIC,
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
    expect(wrapper).toHaveStyleRule('font-size', '1rem')

    wrapper.setProps({ fontSize: FONT_SIZE_HEADER })
    expect(wrapper).toHaveStyleRule('font-size', '1.125rem')

    wrapper.setProps({ fontSize: FONT_SIZE_BODY_2 })
    expect(wrapper).toHaveStyleRule('font-size', '0.875rem')

    wrapper.setProps({ fontSize: FONT_SIZE_BODY_1 })
    expect(wrapper).toHaveStyleRule('font-size', '0.75rem')

    wrapper.setProps({ fontSize: FONT_SIZE_CAPTION })
    expect(wrapper).toHaveStyleRule('font-size', '0.625rem')
  })

  it('should take a fontWeight prop', () => {
    const wrapper = shallow(<Text fontWeight={FONT_WEIGHT_REGULAR} />)
    expect(wrapper).toHaveStyleRule('font-weight', '400')

    wrapper.setProps({ fontWeight: FONT_WEIGHT_SEMIBOLD })
    expect(wrapper).toHaveStyleRule('font-weight', '600')
  })

  it('should take a lineHeight prop', () => {
    const wrapper = shallow(<Text lineHeight={LINE_HEIGHT_SOLID} />)
    expect(wrapper).toHaveStyleRule('line-height', '1')

    wrapper.setProps({ lineHeight: LINE_HEIGHT_TITLE })
    expect(wrapper).toHaveStyleRule('line-height', '1.25')

    wrapper.setProps({ lineHeight: LINE_HEIGHT_COPY })
    expect(wrapper).toHaveStyleRule('line-height', '1.5')
  })

  it('should take a fontStyle prop', () => {
    const wrapper = shallow(<Text fontStyle={FONT_STYLE_NORMAL} />)
    expect(wrapper).toHaveStyleRule('font-style', 'normal')

    wrapper.setProps({ fontStyle: FONT_STYLE_ITALIC })
    expect(wrapper).toHaveStyleRule('font-style', 'italic')
  })
})
