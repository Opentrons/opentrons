import styled from 'styled-components'
import {
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
  RESPONSIVENESS,
  StyleProps,
} from '@opentrons/components'

interface ButtonProps extends StyleProps {
  /** optional isAlert boolean to turn the background red, only seen in ODD */
  isAlert?: boolean
}
export const MenuItem = styled.button<ButtonProps>`
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSizeP};
  background-color: ${COLORS.transparent};
  color: ${COLORS.darkBlackEnabled};
  padding: ${SPACING.spacing8} 0.75rem ${SPACING.spacing8} 0.75rem;

  &:hover,
  &:active {
    background-color: ${COLORS.lightBlue};
  }

  &:disabled {
    background-color: ${COLORS.transparent};
    color: ${COLORS.black}${COLORS.opacity50HexCode};
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    align-items: ${ALIGN_CENTER};
    text-align: ${TYPOGRAPHY.textAlignCenter};
    font-size: ${TYPOGRAPHY.fontSize28};
    background-color: ${({ isAlert }) =>
      isAlert ? COLORS.errorEnabled : COLORS.transparent};
    color: ${({ isAlert }) =>
      isAlert ? COLORS.white : COLORS.darkBlackEnabled};
    padding: 1.625rem 1.5rem;
    height: 4.875rem;
    line-height: ${TYPOGRAPHY.lineHeight36};
    &:hover,
    &:active {
      background-color: ${({ isAlert }) =>
        isAlert ? COLORS.errorEnabled : COLORS.darkBlack_twenty};
    }

    &:disabled {
      background-color: ${({ isAlert }) =>
        isAlert ? COLORS.errorEnabled : COLORS.transparent};
      color: ${({ isAlert }) =>
        isAlert ? COLORS.white : COLORS.darkBlack_sixty};
    }
  }
`
