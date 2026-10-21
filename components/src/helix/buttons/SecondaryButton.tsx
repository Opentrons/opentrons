import styled from 'styled-components'

import { BORDERS, COLORS } from '../../helix-design-system'
import { CURSOR_DEFAULT, CURSOR_POINTER } from '../../index'
import { isntStyleProp, styleProps } from '../../primitives'
import { SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { StyleProps } from '../../index'

interface SecondaryButtonProps extends StyleProps {
  /** button action is dangerous and may have non-reversible side-effects for user */
  isDangerous?: boolean
  'aria-disabled'?: boolean
}
export const SecondaryButton = styled.button.withConfig<SecondaryButtonProps>({
  shouldForwardProp: p => isntStyleProp(p) && p !== 'isDangerous',
})<SecondaryButtonProps>`
  appearance: none;
  cursor: ${props =>
    props['aria-disabled'] ? CURSOR_DEFAULT : CURSOR_POINTER};
  color: ${props => {
    if (props['aria-disabled']) return COLORS.grey40
    return props.isDangerous ? COLORS.red50 : COLORS.blue50
  }};
  border: ${BORDERS.lineBorder};
  border-color: ${props => {
    if (props['aria-disabled']) return COLORS.grey30
    return props.isDangerous ? COLORS.red50 : 'initial'
  }};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  background-color: ${COLORS.transparent};
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};

  &:hover {
    color: ${props => {
      if (props['aria-disabled']) return COLORS.grey40
      return props.isDangerous ? COLORS.red55 : COLORS.blue55
    }};
    border-color: ${props => {
      if (props['aria-disabled']) return COLORS.grey30
      return props.isDangerous ? COLORS.red50 : COLORS.blue55
    }};
    box-shadow: ${props => (props['aria-disabled'] ? 'none' : '0 0 0')};
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.blue50};
    outline-offset: 0.125rem;
  }

  &:active {
    box-shadow: none;
    color: ${props => {
      if (props['aria-disabled']) return COLORS.grey40
      return props.isDangerous ? COLORS.red60 : COLORS.blue60
    }};
    border-color: ${props => {
      if (props['aria-disabled']) return COLORS.grey30
      return props.isDangerous ? COLORS.red60 : COLORS.blue60
    }};
  }

  &:disabled,
  &.disabled {
    box-shadow: none;
    border-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
    cursor: ${CURSOR_DEFAULT};
  }

  ${styleProps as any}
`

SecondaryButton.defaultProps = {
  'aria-disabled': false,
}
