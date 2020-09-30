// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { Svg } from '..'

describe('Svg primitive component', () => {
  it('should be an <svg> with the base SVG props', () => {
    const wrapper = shallow(<Svg />)
    const el = wrapper.find('svg')

    expect(el.prop('version')).toBe('1.1')
    expect(el.prop('xmlns')).toBe('http://www.w3.org/2000/svg')
  })

  it('should accept svgWidth and svgHeight to set width and height props', () => {
    const wrapper = shallow(<Svg svgWidth="42" svgHeight="24" />)
    const el = wrapper.find('svg')

    expect(el.prop('width')).toBe('42')
    expect(el.prop('height')).toBe('24')
    expect(el.prop('svgWidth')).toBe(undefined)
    expect(el.prop('svgHeight')).toBe(undefined)
    expect(el).not.toHaveStyleRule('width')
    expect(el).not.toHaveStyleRule('height')
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Svg>
        <rect data-test="child" />
      </Svg>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })
})
