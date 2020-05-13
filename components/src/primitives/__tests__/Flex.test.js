// @flow
import * as React from 'react'
import { shallow } from 'enzyme'

import { C_WHITE, FONT_SIZE_BODY_1 } from '../../styles'
import {
  Flex,
  ALIGN_NORMAL,
  ALIGN_START,
  ALIGN_END,
  ALIGN_FLEX_START,
  ALIGN_FLEX_END,
  ALIGN_CENTER,
  ALIGN_BASELINE,
  ALIGN_STRETCH,
  JUSTIFY_NORMAL,
  JUSTIFY_START,
  JUSTIFY_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_FLEX_END,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_SPACE_EVENLY,
  JUSTIFY_STRETCH,
  DIRECTION_ROW,
  DIRECTION_ROW_REVERSE,
  DIRECTION_COLUMN,
  DIRECTION_COLUMN_REVERSE,
  WRAP,
  NO_WRAP,
  WRAP_REVERSE,
} from '..'

describe('Flex primitive component', () => {
  it('should be a div with display: flex', () => {
    const wrapper = shallow(<Flex />)
    expect(wrapper.exists('div')).toBe(true)
    expect(wrapper).toHaveStyleRule('display', 'flex')
  })

  it('should accept an `as` prop', () => {
    const wrapper = shallow(<Flex as="nav" />)
    expect(wrapper.exists('nav')).toBe(true)
    expect(wrapper).toHaveStyleRule('display', 'flex')
  })

  it('should accept an `className` prop', () => {
    const wrapper = shallow(<Flex className="extra-class" />)
    expect(wrapper.hasClass('extra-class')).toBe(true)
  })

  it('should render children', () => {
    const wrapper = shallow(
      <Flex>
        <span data-test="child" />
      </Flex>
    )
    expect(wrapper.exists('[data-test="child"]')).toBe(true)
  })

  it('should take a color prop', () => {
    const wrapper = shallow(<Flex color={C_WHITE} />)
    expect(wrapper).toHaveStyleRule('color', '#ffffff')
  })

  it('should take an alignItems prop', () => {
    const wrapper = shallow(<Flex alignItems={ALIGN_NORMAL} />)
    expect(wrapper).toHaveStyleRule('align-items', 'normal')

    wrapper.setProps({ alignItems: ALIGN_START })
    expect(wrapper).toHaveStyleRule('align-items', 'start')

    wrapper.setProps({ alignItems: ALIGN_END })
    expect(wrapper).toHaveStyleRule('align-items', 'end')

    wrapper.setProps({ alignItems: ALIGN_FLEX_START })
    expect(wrapper).toHaveStyleRule('align-items', 'flex-start')

    wrapper.setProps({ alignItems: ALIGN_FLEX_END })
    expect(wrapper).toHaveStyleRule('align-items', 'flex-end')

    wrapper.setProps({ alignItems: ALIGN_CENTER })
    expect(wrapper).toHaveStyleRule('align-items', 'center')

    wrapper.setProps({ alignItems: ALIGN_BASELINE })
    expect(wrapper).toHaveStyleRule('align-items', 'baseline')

    wrapper.setProps({ alignItems: ALIGN_STRETCH })
    expect(wrapper).toHaveStyleRule('align-items', 'stretch')
  })

  it('should take a justifyContent prop', () => {
    const wrapper = shallow(<Flex justifyContent={JUSTIFY_NORMAL} />)
    expect(wrapper).toHaveStyleRule('justify-content', 'normal')

    wrapper.setProps({ justifyContent: JUSTIFY_START })
    expect(wrapper).toHaveStyleRule('justify-content', 'start')

    wrapper.setProps({ justifyContent: JUSTIFY_END })
    expect(wrapper).toHaveStyleRule('justify-content', 'end')

    wrapper.setProps({ justifyContent: JUSTIFY_FLEX_START })
    expect(wrapper).toHaveStyleRule('justify-content', 'flex-start')

    wrapper.setProps({ justifyContent: JUSTIFY_FLEX_END })
    expect(wrapper).toHaveStyleRule('justify-content', 'flex-end')

    wrapper.setProps({ justifyContent: JUSTIFY_CENTER })
    expect(wrapper).toHaveStyleRule('justify-content', 'center')

    wrapper.setProps({ justifyContent: JUSTIFY_SPACE_BETWEEN })
    expect(wrapper).toHaveStyleRule('justify-content', 'space-between')

    wrapper.setProps({ justifyContent: JUSTIFY_SPACE_AROUND })
    expect(wrapper).toHaveStyleRule('justify-content', 'space-around')

    wrapper.setProps({ justifyContent: JUSTIFY_SPACE_EVENLY })
    expect(wrapper).toHaveStyleRule('justify-content', 'space-evenly')

    wrapper.setProps({ justifyContent: JUSTIFY_STRETCH })
    expect(wrapper).toHaveStyleRule('justify-content', 'stretch')
  })

  it('should take a direction prop', () => {
    const wrapper = shallow(<Flex direction={DIRECTION_ROW} />)
    expect(wrapper).toHaveStyleRule('flex-direction', 'row')

    wrapper.setProps({ direction: DIRECTION_ROW_REVERSE })
    expect(wrapper).toHaveStyleRule('flex-direction', 'row-reverse')

    wrapper.setProps({ direction: DIRECTION_COLUMN })
    expect(wrapper).toHaveStyleRule('flex-direction', 'column')

    wrapper.setProps({ direction: DIRECTION_COLUMN_REVERSE })
    expect(wrapper).toHaveStyleRule('flex-direction', 'column-reverse')
  })

  it('should take a wrap prop', () => {
    const wrapper = shallow(<Flex wrap={WRAP} />)
    expect(wrapper).toHaveStyleRule('flex-wrap', 'wrap')

    wrapper.setProps({ wrap: NO_WRAP })
    expect(wrapper).toHaveStyleRule('flex-wrap', 'nowrap')

    wrapper.setProps({ wrap: WRAP_REVERSE })
    expect(wrapper).toHaveStyleRule('flex-wrap', 'wrap-reverse')
  })

  it('should take spacing props', () => {
    const wrapper = shallow(<Flex marginBottom={0} paddingLeft={0} />)
    expect(wrapper).toHaveStyleRule('margin-bottom', '0')
    expect(wrapper).toHaveStyleRule('padding-left', '0')
  })

  it('should take typography props', () => {
    const wrapper = shallow(<Flex fontSize={FONT_SIZE_BODY_1} />)
    expect(wrapper).toHaveStyleRule('font-size', FONT_SIZE_BODY_1)
  })
})
