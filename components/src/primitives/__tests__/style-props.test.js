// @flow
import * as React from 'react'
import { shallow } from 'enzyme'
import styled from 'styled-components'

import * as Styles from '../../styles'
import * as StyleProps from '../style-props'

describe('style props', () => {
  describe('color styles', () => {
    const TestColor = styled.div`
      ${StyleProps.colorStyles}
    `

    it('should be able to set color', () => {
      const wrapper = shallow(<TestColor color={Styles.C_WHITE} />)
      expect(wrapper).toHaveStyleRule('color', Styles.C_WHITE)
    })

    it('should be able to set background-color', () => {
      const wrapper = shallow(<TestColor backgroundColor={Styles.C_WHITE} />)
      expect(wrapper).toHaveStyleRule('background-color', Styles.C_WHITE)
    })
  })

  describe('typography styles', () => {
    const TestTypography = styled.div`
      ${StyleProps.typographyStyles}
    `

    it('should be able to set font-size', () => {
      const wrapper = shallow(
        <TestTypography fontSize={Styles.FONT_SIZE_DEFAULT} />
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
        <TestTypography fontWeight={Styles.FONT_WEIGHT_REGULAR} />
      )
      expect(wrapper).toHaveStyleRule('font-weight', '400')

      wrapper.setProps({ fontWeight: Styles.FONT_WEIGHT_SEMIBOLD })
      expect(wrapper).toHaveStyleRule('font-weight', '600')
    })

    it('should be able to set line-height', () => {
      const wrapper = shallow(
        <TestTypography lineHeight={Styles.LINE_HEIGHT_SOLID} />
      )
      expect(wrapper).toHaveStyleRule('line-height', '1')

      wrapper.setProps({ lineHeight: Styles.LINE_HEIGHT_TITLE })
      expect(wrapper).toHaveStyleRule('line-height', '1.25')

      wrapper.setProps({ lineHeight: Styles.LINE_HEIGHT_COPY })
      expect(wrapper).toHaveStyleRule('line-height', '1.5')
    })

    it('should be able to set font-style', () => {
      const wrapper = shallow(
        <TestTypography fontStyle={Styles.FONT_STYLE_NORMAL} />
      )
      expect(wrapper).toHaveStyleRule('font-style', 'normal')

      wrapper.setProps({ fontStyle: Styles.FONT_STYLE_ITALIC })
      expect(wrapper).toHaveStyleRule('font-style', 'italic')
    })

    it('should be able to set text-align', () => {
      const wrapper = shallow(
        <TestTypography textAlign={Styles.TEXT_ALIGN_LEFT} />
      )
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
        <TestTypography textTransform={Styles.TEXT_TRANSFORM_NONE} />
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
    const TestSpacing = styled.div`
      ${StyleProps.spacingStyles}
    `

    it('should be able to set margin', () => {
      const wrapper = shallow(<TestSpacing margin={Styles.SPACING_1} />)
      expect(wrapper).toHaveStyleRule('margin', '0.25rem')
    })

    it('should be able to set margin-right', () => {
      const wrapper = shallow(<TestSpacing marginRight={Styles.SPACING_2} />)
      expect(wrapper).toHaveStyleRule('margin-right', '0.5rem')
    })

    it('should be able to set margin-bottom', () => {
      const wrapper = shallow(<TestSpacing marginBottom={Styles.SPACING_3} />)
      expect(wrapper).toHaveStyleRule('margin-bottom', '1rem')
    })

    it('should be able to set margin-left', () => {
      const wrapper = shallow(<TestSpacing marginLeft={Styles.SPACING_4} />)
      expect(wrapper).toHaveStyleRule('margin-left', '2rem')
    })

    it('should be able to set margin-left and margin-right simultaneously', () => {
      const wrapper = shallow(<TestSpacing marginX={Styles.SPACING_AUTO} />)
      expect(wrapper).toHaveStyleRule('margin-left', 'auto')
      expect(wrapper).toHaveStyleRule('margin-right', 'auto')
    })

    it('should be able to set margin-top and margin-bottom simultaneously', () => {
      const wrapper = shallow(<TestSpacing marginY={Styles.SPACING_5} />)
      expect(wrapper).toHaveStyleRule('margin-top', '4rem')
      expect(wrapper).toHaveStyleRule('margin-bottom', '4rem')
    })

    it('should be able to set padding', () => {
      const wrapper = shallow(<TestSpacing padding={Styles.SPACING_6} />)
      expect(wrapper).toHaveStyleRule('padding', '8rem')
    })

    it('should be able to set padding-right', () => {
      const wrapper = shallow(<TestSpacing paddingRight={Styles.SPACING_7} />)
      expect(wrapper).toHaveStyleRule('padding-right', '16rem')
    })

    it('should be able to set padding-bottom', () => {
      const wrapper = shallow(<TestSpacing paddingBottom={Styles.SPACING_8} />)
      expect(wrapper).toHaveStyleRule('padding-bottom', '32rem')
    })

    it('should be able to set padding-left', () => {
      const wrapper = shallow(<TestSpacing paddingLeft={0} />)
      expect(wrapper).toHaveStyleRule('padding-left', '0')
    })

    it('should be able to set padding-left and padding-right simultaneously', () => {
      const wrapper = shallow(<TestSpacing paddingX="25%" />)
      expect(wrapper).toHaveStyleRule('padding-left', '25%')
      expect(wrapper).toHaveStyleRule('padding-right', '25%')
    })

    it('should be able to set padding-top and padding-bottom simultaneously', () => {
      const wrapper = shallow(<TestSpacing paddingY={Styles.SPACING_1} />)
      expect(wrapper).toHaveStyleRule('padding-top', '0.25rem')
      expect(wrapper).toHaveStyleRule('padding-bottom', '0.25rem')
    })
  })
})
