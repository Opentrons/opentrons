// @flow
import * as React from 'react'
import { shallow } from 'enzyme'
import styled from 'styled-components'

import * as Styles from '../../styles'
import { styleProps, isntStyleProp } from '..'

import type { PrimitiveComponent } from '..'

const TestStyles: PrimitiveComponent<HTMLDivElement> = styled.div.withConfig({
  shouldForwardProp: isntStyleProp,
})(styleProps)

describe('style props', () => {
  describe('color styles', () => {
    it('should be able to set color', () => {
      const wrapper = shallow(<TestStyles color={Styles.C_WHITE} />)
      expect(wrapper).toHaveStyleRule('color', Styles.C_WHITE)
    })

    it('should be able to set background-color', () => {
      const wrapper = shallow(<TestStyles backgroundColor={Styles.C_WHITE} />)
      expect(wrapper).toHaveStyleRule('background-color', Styles.C_WHITE)
    })

    it('should be able to set opacity', () => {
      const wrapper = shallow(<TestStyles opacity={Styles.OPACITY_DISABLED} />)
      expect(wrapper).toHaveStyleRule('opacity', '0.3')
    })
  })

  describe('typography styles', () => {
    it('should be able to set font-size', () => {
      const wrapper = shallow(
        <TestStyles fontSize={Styles.FONT_SIZE_DEFAULT} />
      )
      expect(wrapper).toHaveStyleRule('font-size', '1rem')

      wrapper.setProps({ fontSize: Styles.FONT_SIZE_HEADER })
      expect(wrapper).toHaveStyleRule('font-size', '1.125rem')

      wrapper.setProps({ fontSize: Styles.FONT_SIZE_BODY_2 })
      expect(wrapper).toHaveStyleRule('font-size', '0.875rem')

      wrapper.setProps({ fontSize: Styles.FONT_SIZE_BODY_1 })
      expect(wrapper).toHaveStyleRule('font-size', '0.75rem')

      wrapper.setProps({ fontSize: Styles.FONT_SIZE_CAPTION })
      expect(wrapper).toHaveStyleRule('font-size', '0.625rem')
    })

    it('should be able to set font-weight', () => {
      const wrapper = shallow(
        <TestStyles fontWeight={Styles.FONT_WEIGHT_REGULAR} />
      )
      expect(wrapper).toHaveStyleRule('font-weight', '400')

      wrapper.setProps({ fontWeight: Styles.FONT_WEIGHT_SEMIBOLD })
      expect(wrapper).toHaveStyleRule('font-weight', '600')
    })

    it('should be able to set font-style', () => {
      const wrapper = shallow(
        <TestStyles fontStyle={Styles.FONT_STYLE_NORMAL} />
      )
      expect(wrapper).toHaveStyleRule('font-style', 'normal')

      wrapper.setProps({ fontStyle: Styles.FONT_STYLE_ITALIC })
      expect(wrapper).toHaveStyleRule('font-style', 'italic')
    })

    it('should be able to set line-height', () => {
      const wrapper = shallow(
        <TestStyles lineHeight={Styles.LINE_HEIGHT_SOLID} />
      )
      expect(wrapper).toHaveStyleRule('line-height', '1')

      wrapper.setProps({ lineHeight: Styles.LINE_HEIGHT_TITLE })
      expect(wrapper).toHaveStyleRule('line-height', '1.25')

      wrapper.setProps({ lineHeight: Styles.LINE_HEIGHT_COPY })
      expect(wrapper).toHaveStyleRule('line-height', '1.5')
    })

    it('should be able to set text-align', () => {
      const wrapper = shallow(<TestStyles textAlign={Styles.TEXT_ALIGN_LEFT} />)
      expect(wrapper).toHaveStyleRule('text-align', 'left')

      wrapper.setProps({ textAlign: Styles.TEXT_ALIGN_CENTER })
      expect(wrapper).toHaveStyleRule('text-align', 'center')

      wrapper.setProps({ textAlign: Styles.TEXT_ALIGN_RIGHT })
      expect(wrapper).toHaveStyleRule('text-align', 'right')

      wrapper.setProps({ textAlign: Styles.TEXT_ALIGN_JUSTIFY })
      expect(wrapper).toHaveStyleRule('text-align', 'justify')
    })

    it('should be able to set text-transform', () => {
      const wrapper = shallow(
        <TestStyles textTransform={Styles.TEXT_TRANSFORM_NONE} />
      )
      expect(wrapper).toHaveStyleRule('text-transform', 'none')

      wrapper.setProps({ textTransform: Styles.TEXT_TRANSFORM_CAPITALIZE })
      expect(wrapper).toHaveStyleRule('text-transform', 'capitalize')

      wrapper.setProps({ textTransform: Styles.TEXT_TRANSFORM_UPPERCASE })
      expect(wrapper).toHaveStyleRule('text-transform', 'uppercase')

      wrapper.setProps({ textTransform: Styles.TEXT_TRANSFORM_LOWERCASE })
      expect(wrapper).toHaveStyleRule('text-transform', 'lowercase')
    })
  })

  describe('spacing styles', () => {
    it('should be able to set margin', () => {
      const wrapper = shallow(<TestStyles margin={Styles.SPACING_1} />)
      expect(wrapper).toHaveStyleRule('margin', '0.25rem')
    })

    it('should be able to set margin-right', () => {
      const wrapper = shallow(<TestStyles marginRight={Styles.SPACING_2} />)
      expect(wrapper).toHaveStyleRule('margin-right', '0.5rem')
    })

    it('should be able to set margin-bottom', () => {
      const wrapper = shallow(<TestStyles marginBottom={Styles.SPACING_3} />)
      expect(wrapper).toHaveStyleRule('margin-bottom', '1rem')
    })

    it('should be able to set margin-left', () => {
      const wrapper = shallow(<TestStyles marginLeft={Styles.SPACING_4} />)
      expect(wrapper).toHaveStyleRule('margin-left', '2rem')
    })

    it('should be able to set margin-left and margin-right simultaneously', () => {
      const wrapper = shallow(<TestStyles marginX={Styles.SPACING_AUTO} />)
      expect(wrapper).toHaveStyleRule('margin-left', 'auto')
      expect(wrapper).toHaveStyleRule('margin-right', 'auto')
    })

    it('should be able to set margin-top and margin-bottom simultaneously', () => {
      const wrapper = shallow(<TestStyles marginY={Styles.SPACING_5} />)
      expect(wrapper).toHaveStyleRule('margin-top', '4rem')
      expect(wrapper).toHaveStyleRule('margin-bottom', '4rem')
    })

    it('should be able to set padding', () => {
      const wrapper = shallow(<TestStyles padding={Styles.SPACING_6} />)
      expect(wrapper).toHaveStyleRule('padding', '8rem')
    })

    it('should be able to set padding-right', () => {
      const wrapper = shallow(<TestStyles paddingRight={Styles.SPACING_7} />)
      expect(wrapper).toHaveStyleRule('padding-right', '16rem')
    })

    it('should be able to set padding-bottom', () => {
      const wrapper = shallow(<TestStyles paddingBottom={Styles.SPACING_8} />)
      expect(wrapper).toHaveStyleRule('padding-bottom', '32rem')
    })

    it('should be able to set padding-left', () => {
      const wrapper = shallow(<TestStyles paddingLeft={0} />)
      expect(wrapper).toHaveStyleRule('padding-left', '0')
    })

    it('should be able to set padding-left and padding-right simultaneously', () => {
      const wrapper = shallow(<TestStyles paddingX="25%" />)
      expect(wrapper).toHaveStyleRule('padding-left', '25%')
      expect(wrapper).toHaveStyleRule('padding-right', '25%')
    })

    it('should be able to set padding-top and padding-bottom simultaneously', () => {
      const wrapper = shallow(<TestStyles paddingY={Styles.SPACING_1} />)
      expect(wrapper).toHaveStyleRule('padding-top', '0.25rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.25rem')
    })
  })

  describe('border styles', () => {
    it('should be able to set border', () => {
      const wrapper = shallow(<TestStyles border={Styles.BORDER_SOLID_LIGHT} />)
      expect(wrapper).toHaveStyleRule('border', '1px solid #e6e6e6')
    })

    it('should be able to set border-top', () => {
      const wrapper = shallow(
        <TestStyles borderTop={Styles.BORDER_SOLID_LIGHT} />
      )
      expect(wrapper).toHaveStyleRule('border-top', '1px solid #e6e6e6')
    })

    it('should be able to set border-right', () => {
      const wrapper = shallow(
        <TestStyles borderRight={Styles.BORDER_SOLID_LIGHT} />
      )
      expect(wrapper).toHaveStyleRule('border-right', '1px solid #e6e6e6')
    })

    it('should be able to set border-bottom', () => {
      const wrapper = shallow(
        <TestStyles borderBottom={Styles.BORDER_SOLID_LIGHT} />
      )
      expect(wrapper).toHaveStyleRule('border-bottom', '1px solid #e6e6e6')
    })

    it('should be able to set border-left', () => {
      const wrapper = shallow(
        <TestStyles borderLeft={Styles.BORDER_SOLID_LIGHT} />
      )
      expect(wrapper).toHaveStyleRule('border-left', '1px solid #e6e6e6')
    })

    it('should be able to set border-radius', () => {
      const wrapper = shallow(
        <TestStyles borderRadius={Styles.BORDER_RADIUS_DEFAULT} />
      )
      expect(wrapper).toHaveStyleRule('border-radius', '2px')
    })
  })

  describe('flexbox styles', () => {
    it('should be able to set flex', () => {
      const wrapper = shallow(<TestStyles flex={Styles.FLEX_NONE} />)
      expect(wrapper).toHaveStyleRule('flex', 'none')

      wrapper.setProps({ flex: Styles.FLEX_AUTO })
      expect(wrapper).toHaveStyleRule('flex', 'auto')

      wrapper.setProps({ flex: Styles.FLEX_MIN_CONTENT })
      expect(wrapper).toHaveStyleRule('flex', 'min-content')
    })

    it('should be able to set align-items', () => {
      const wrapper = shallow(<TestStyles alignItems={Styles.ALIGN_NORMAL} />)
      expect(wrapper).toHaveStyleRule('align-items', 'normal')

      wrapper.setProps({ alignItems: Styles.ALIGN_START })
      expect(wrapper).toHaveStyleRule('align-items', 'start')

      wrapper.setProps({ alignItems: Styles.ALIGN_END })
      expect(wrapper).toHaveStyleRule('align-items', 'end')

      wrapper.setProps({ alignItems: Styles.ALIGN_FLEX_START })
      expect(wrapper).toHaveStyleRule('align-items', 'flex-start')

      wrapper.setProps({ alignItems: Styles.ALIGN_FLEX_END })
      expect(wrapper).toHaveStyleRule('align-items', 'flex-end')

      wrapper.setProps({ alignItems: Styles.ALIGN_CENTER })
      expect(wrapper).toHaveStyleRule('align-items', 'center')

      wrapper.setProps({ alignItems: Styles.ALIGN_BASELINE })
      expect(wrapper).toHaveStyleRule('align-items', 'baseline')

      wrapper.setProps({ alignItems: Styles.ALIGN_STRETCH })
      expect(wrapper).toHaveStyleRule('align-items', 'stretch')
    })

    it('should be able to set justify-content', () => {
      const wrapper = shallow(
        <TestStyles justifyContent={Styles.JUSTIFY_NORMAL} />
      )
      expect(wrapper).toHaveStyleRule('justify-content', 'normal')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_START })
      expect(wrapper).toHaveStyleRule('justify-content', 'start')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_END })
      expect(wrapper).toHaveStyleRule('justify-content', 'end')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_FLEX_START })
      expect(wrapper).toHaveStyleRule('justify-content', 'flex-start')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_FLEX_END })
      expect(wrapper).toHaveStyleRule('justify-content', 'flex-end')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_CENTER })
      expect(wrapper).toHaveStyleRule('justify-content', 'center')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_SPACE_BETWEEN })
      expect(wrapper).toHaveStyleRule('justify-content', 'space-between')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_SPACE_AROUND })
      expect(wrapper).toHaveStyleRule('justify-content', 'space-around')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_SPACE_EVENLY })
      expect(wrapper).toHaveStyleRule('justify-content', 'space-evenly')

      wrapper.setProps({ justifyContent: Styles.JUSTIFY_STRETCH })
      expect(wrapper).toHaveStyleRule('justify-content', 'stretch')
    })

    it('should be able to set flex-direction', () => {
      const wrapper = shallow(
        <TestStyles flexDirection={Styles.DIRECTION_ROW} />
      )
      expect(wrapper).toHaveStyleRule('flex-direction', 'row')

      wrapper.setProps({ flexDirection: Styles.DIRECTION_ROW_REVERSE })
      expect(wrapper).toHaveStyleRule('flex-direction', 'row-reverse')

      wrapper.setProps({ flexDirection: Styles.DIRECTION_COLUMN })
      expect(wrapper).toHaveStyleRule('flex-direction', 'column')

      wrapper.setProps({ flexDirection: Styles.DIRECTION_COLUMN_REVERSE })
      expect(wrapper).toHaveStyleRule('flex-direction', 'column-reverse')
    })

    it('should be able to set flex-wrap', () => {
      const wrapper = shallow(<TestStyles flexWrap={Styles.WRAP} />)
      expect(wrapper).toHaveStyleRule('flex-wrap', 'wrap')

      wrapper.setProps({ flexWrap: Styles.NO_WRAP })
      expect(wrapper).toHaveStyleRule('flex-wrap', 'nowrap')

      wrapper.setProps({ flexWrap: Styles.WRAP_REVERSE })
      expect(wrapper).toHaveStyleRule('flex-wrap', 'wrap-reverse')
    })
  })

  describe('layout styles', () => {
    it('should be able to set display', () => {
      const wrapper = shallow(<TestStyles display={Styles.DISPLAY_NONE} />)
      expect(wrapper).toHaveStyleRule('display', 'none')

      wrapper.setProps({ display: Styles.DISPLAY_INLINE })
      expect(wrapper).toHaveStyleRule('display', 'inline')

      wrapper.setProps({ display: Styles.DISPLAY_INLINE_BLOCK })
      expect(wrapper).toHaveStyleRule('display', 'inline-block')

      wrapper.setProps({ display: Styles.DISPLAY_FLEX })
      expect(wrapper).toHaveStyleRule('display', 'flex')
    })

    it('should be able to set width', () => {
      const wrapper = shallow(<TestStyles width={Styles.SIZE_AUTO} />)
      expect(wrapper).toHaveStyleRule('width', 'auto')
    })

    it('should be able to set height', () => {
      const wrapper = shallow(<TestStyles height={Styles.SIZE_1} />)
      expect(wrapper).toHaveStyleRule('height', '1rem')
    })

    it('should be able to set width and height simultaneously', () => {
      const wrapper = shallow(<TestStyles size={Styles.SIZE_2} />)
      expect(wrapper).toHaveStyleRule('width', '2rem')
      expect(wrapper).toHaveStyleRule('height', '2rem')
    })

    it('should be able to set min-width', () => {
      const wrapper = shallow(<TestStyles minWidth={Styles.SIZE_3} />)
      expect(wrapper).toHaveStyleRule('min-width', '4rem')
    })

    it('should be able to set min-height', () => {
      const wrapper = shallow(<TestStyles minHeight={Styles.SIZE_4} />)
      expect(wrapper).toHaveStyleRule('min-height', '8rem')
    })

    it('should be able to set overflow', () => {
      const wrapper = shallow(<TestStyles overflow={Styles.OVERFLOW_AUTO} />)
      expect(wrapper).toHaveStyleRule('overflow', 'auto')

      wrapper.setProps({ overflow: Styles.OVERFLOW_VISIBLE })
      expect(wrapper).toHaveStyleRule('overflow', 'visible')

      wrapper.setProps({ overflow: Styles.OVERFLOW_HIDDEN })
      expect(wrapper).toHaveStyleRule('overflow', 'hidden')

      wrapper.setProps({ overflow: Styles.OVERFLOW_CLIP })
      expect(wrapper).toHaveStyleRule('overflow', 'clip')

      wrapper.setProps({ overflow: Styles.OVERFLOW_SCROLL })
      expect(wrapper).toHaveStyleRule('overflow', 'scroll')
    })

    it('should be able to set overflow-x', () => {
      const wrapper = shallow(
        <TestStyles overflowX={Styles.OVERFLOW_VISIBLE} />
      )
      expect(wrapper).toHaveStyleRule('overflow-x', 'visible')
    })

    it('should be able to set overflow-y', () => {
      const wrapper = shallow(<TestStyles overflowY={Styles.OVERFLOW_HIDDEN} />)
      expect(wrapper).toHaveStyleRule('overflow-y', 'hidden')
    })
  })
})
