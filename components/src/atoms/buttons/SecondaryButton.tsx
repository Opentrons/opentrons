import styled from 'styled-components'
import {
  LEGACY_COLORS,
  BORDERS,
  TYPOGRAPHY,
  SPACING,
} from '../../ui-style-constants'
import { isntStyleProp, styleProps } from '../../primitives'
import { COLORS } from '../../helix-design-system'
import type { StyleProps } from '../../index'

interface SecondaryButtonProps extends StyleProps {
  /** button action is dangerous and may have non-reversible side-effects for user */
  isDangerous?: boolean
}
export const SecondaryButton = styled.button.withConfig<SecondaryButtonProps>({
  shouldForwardProp: p => isntStyleProp(p) && p !== 'isDangerous',
}) <SecondaryButtonProps>`
  appearance: none;
  cursor: pointer;
  color: ${props =>
    props.isDangerous ? COLORS.red60 : COLORS.blue50};
  border: ${BORDERS.lineBorder};
  border-color: ${props =>
    props.isDangerous ? COLORS.red50 : 'initial'};
  border-radius: ${BORDERS.radiusSoftCorners};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};
  background-color: ${COLORS.transparent};
  ${TYPOGRAPHY.pSemiBold}

  &:hover,
  &:focus {
    box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.23);
  }

  &:hover {
    opacity: 70%;
    box-shadow: 0 0 0;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.blue50};
  }

  &:active {
    box-shadow: none;
  }

  &:disabled,
  &.disabled {
    box-shadow: none;
    opacity: 50%;
    cursor: default;
  }

  ${styleProps}
`
