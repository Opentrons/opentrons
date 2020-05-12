// @flow
import * as React from 'react'
import { mount } from 'enzyme'

import {
  C_WHITE,
  FONT_SIZE_DEFAULT,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_TITLE,
  FONT_STYLE_ITALIC,
  SPACING_AUTO,
  SPACING_1,
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
    expect(wrapper).toHaveStyleRule('font-size', FONT_SIZE_DEFAULT)
  })

  it('should take a fontWeight prop', () => {
    const wrapper = mount(<Link href="#" fontWeight={FONT_WEIGHT_SEMIBOLD} />)
    expect(wrapper).toHaveStyleRule('font-weight', `${FONT_WEIGHT_SEMIBOLD}`)
  })

  it('should take a lineHeight prop', () => {
    const wrapper = mount(<Link href="#" lineHeight={LINE_HEIGHT_TITLE} />)
    expect(wrapper).toHaveStyleRule('line-height', `${LINE_HEIGHT_TITLE}`)
  })

  it('should take a fontStyle prop', () => {
    const wrapper = mount(<Link href="#" fontStyle={FONT_STYLE_ITALIC} />)
    expect(wrapper).toHaveStyleRule('font-style', FONT_STYLE_ITALIC)
  })

  it('should take spacing props', () => {
    const wrapper = mount(
      <Link href="#" marginX={SPACING_AUTO} paddingY={SPACING_1} />
    )
    expect(wrapper).toHaveStyleRule('margin-left', 'auto')
    expect(wrapper).toHaveStyleRule('margin-right', 'auto')
    expect(wrapper).toHaveStyleRule('padding-top', SPACING_1)
    expect(wrapper).toHaveStyleRule('padding-bottom', SPACING_1)
  })
})
