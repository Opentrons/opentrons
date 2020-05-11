// @flow
import * as React from 'react'
import { mount } from 'enzyme'

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
import { Link } from '..'

describe('Link primitive component', () => {
  it('should be an <a> by default', () => {
    const wrapper = mount(<Link href="https://opentrons.com" />)
    expect(wrapper.find('a').prop('href')).toBe('https://opentrons.com')
  })

  it('should accept an `as` prop', () => {
    const wrapper = mount(<Link as="span" />)
    expect(wrapper.exists('span')).toBe(true)
  })

  it('should accept an `className` prop', () => {
    const wrapper = mount(<Link className="extra-class" />)
    expect(wrapper.hasClass('extra-class')).toBe(true)
  })

  it('should render children', () => {
    const wrapper = mount(
      <Link>
        <span data-test="child" />
      </Link>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('supports external links', () => {
    const wrapper = mount(<Link href="https://opentrons.com" external />)
    const anchor = wrapper.find('a')
    expect(anchor.prop('target')).toBe('_blank')
    expect(anchor.prop('rel')).toBe('noopener noreferrer')
  })

  it('removes text-decoration', () => {
    const wrapper = mount(<Link href="#" />)
    expect(wrapper).toHaveStyleRule('text-decoration', 'none')
  })

  it('should take a color prop', () => {
    const wrapper = mount(<Link href="#" color={C_WHITE} />)
    expect(wrapper).toHaveStyleRule('color', C_WHITE)
  })

  it('should take a fontSize prop', () => {
    const wrapper = mount(<Link href="#" fontSize={FONT_SIZE_DEFAULT} />)
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
    const wrapper = mount(<Link href="#" fontWeight={FONT_WEIGHT_REGULAR} />)
    expect(wrapper).toHaveStyleRule('font-weight', '400')

    wrapper.setProps({ fontWeight: FONT_WEIGHT_SEMIBOLD })
    expect(wrapper).toHaveStyleRule('font-weight', '600')
  })

  it('should take a lineHeight prop', () => {
    const wrapper = mount(<Link href="#" lineHeight={LINE_HEIGHT_SOLID} />)
    expect(wrapper).toHaveStyleRule('line-height', '1')

    wrapper.setProps({ lineHeight: LINE_HEIGHT_TITLE })
    expect(wrapper).toHaveStyleRule('line-height', '1.25')

    wrapper.setProps({ lineHeight: LINE_HEIGHT_COPY })
    expect(wrapper).toHaveStyleRule('line-height', '1.5')
  })

  it('should take a fontStyle prop', () => {
    const wrapper = mount(<Link href="#" fontStyle={FONT_STYLE_NORMAL} />)
    expect(wrapper).toHaveStyleRule('font-style', 'normal')

    wrapper.setProps({ fontStyle: FONT_STYLE_ITALIC })
    expect(wrapper).toHaveStyleRule('font-style', 'italic')
  })
})
