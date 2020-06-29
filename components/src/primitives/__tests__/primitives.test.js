// @flow
// test concrete implementations of primitive components to ensure that they:
// - Apply the style props to CSS
// - Don't pass the style props down to the DOM

import { shallow } from 'enzyme'
import * as React from 'react'

import { Box, Flex, Link, Text } from '..'
import * as Styles from '../../styles'

const COMPONENTS = [
  { Component: Box, name: 'Box' },
  { Component: Flex, name: 'Flex' },
  { Component: Text, name: 'Text' },
  { Component: Link, name: 'Link' },
]

describe('primitive components with style props', () => {
  COMPONENTS.forEach(({ Component, name }) => {
    const render = props => {
      const wrapper = shallow(<Component {...props} />)
      const domNode = wrapper.hostNodes()

      return [wrapper, domNode]
    }

    describe(`${name} primitive`, () => {
      it('should accept an `as` prop', () => {
        const [wrapper] = render({ as: 'nav' })
        expect(wrapper.exists('nav')).toBe(true)
      })

      it('should accept an `className` prop', () => {
        const [wrapper] = render({ className: 'extra-class' })
        expect(wrapper.hasClass('extra-class')).toBe(true)
      })

      it('should take color props', () => {
        const [wrapper, domNode] = render({
          color: Styles.C_WHITE,
          backgroundColor: Styles.C_BLACK,
        })

        expect(wrapper).toHaveStyleRule('color', Styles.C_WHITE)
        expect(wrapper).toHaveStyleRule('background-color', Styles.C_BLACK)
        expect(domNode.prop('color')).toBe(undefined)
        expect(domNode.prop('backgroundColor')).toBe(undefined)
      })

      it('should take spacing props', () => {
        const [wrapper, domNode] = render({
          marginX: Styles.SPACING_AUTO,
          padding: Styles.SPACING_1,
        })

        expect(wrapper).toHaveStyleRule('margin-left', Styles.SPACING_AUTO)
        expect(wrapper).toHaveStyleRule('margin-right', Styles.SPACING_AUTO)
        expect(wrapper).toHaveStyleRule('padding', Styles.SPACING_1)
        expect(domNode.prop('marginX')).toBe(undefined)
        expect(domNode.prop('padding')).toBe(undefined)
      })

      it('should take typography props', () => {
        const [wrapper, domNode] = render({
          fontSize: Styles.FONT_SIZE_BODY_1,
        })

        expect(wrapper).toHaveStyleRule('font-size', Styles.FONT_SIZE_BODY_1)
        expect(domNode.prop('fontSize')).toBe(undefined)
      })

      it('should take layout props', () => {
        const [wrapper, domNode] = render({
          size: Styles.SIZE_3,
        })

        expect(wrapper).toHaveStyleRule('width', Styles.SIZE_3)
        expect(wrapper).toHaveStyleRule('height', Styles.SIZE_3)
        expect(domNode.prop('width')).toBe(undefined)
        expect(domNode.prop('height')).toBe(undefined)
      })

      it('should take border props', () => {
        const [wrapper, domNode] = render({
          border: Styles.BORDER_SOLID_LIGHT,
          borderRadius: Styles.BORDER_RADIUS_DEFAULT,
        })

        expect(wrapper).toHaveStyleRule('border', Styles.BORDER_SOLID_LIGHT)
        expect(wrapper).toHaveStyleRule(
          'border-radius',
          Styles.BORDER_RADIUS_DEFAULT
        )
        expect(domNode.prop('border')).toBe(undefined)
        expect(domNode.prop('borderRadius')).toBe(undefined)
      })

      it('should take flexbox props', () => {
        const [wrapper, domNode] = render({
          flex: Styles.FLEX_NONE,
        })

        expect(wrapper).toHaveStyleRule('flex', Styles.FLEX_NONE)
        expect(domNode.prop('flex')).toBe(undefined)
      })

      it('should take position props', () => {
        const [wrapper, domNode] = render({
          position: Styles.POSITION_ABSOLUTE,
          top: 0,
        })

        expect(wrapper).toHaveStyleRule('position', Styles.POSITION_ABSOLUTE)
        expect(wrapper).toHaveStyleRule('top', '0')
        expect(domNode.prop('position')).toBe(undefined)
        expect(domNode.prop('top')).toBe(undefined)
      })
    })
  })
})
