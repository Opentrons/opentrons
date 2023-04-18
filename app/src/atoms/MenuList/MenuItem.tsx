import styled from 'styled-components'
import {
  SPACING,
  COLORS,
  TYPOGRAPHY,
  ALIGN_CENTER,
} from '@opentrons/components'

import type { PrimitiveComponent } from '@opentrons/components'

type BtnComponent = PrimitiveComponent<'button'>
interface ButtonProps {
  isAlert?: boolean
  isOnDevice?: boolean
}

export const MenuItem: BtnComponent = styled.button<ButtonProps>`
  align-items: ${({ isOnDevice }) => (isOnDevice ? ALIGN_CENTER : 'auto')};
  text-align: ${({ isOnDevice }) =>
    isOnDevice ? TYPOGRAPHY.textAlignCenter : TYPOGRAPHY.textAlignLeft};
  font-size: ${({ isOnDevice }) =>
    isOnDevice ? TYPOGRAPHY.fontSize28 : TYPOGRAPHY.fontSizeP};
  background-color: ${({ isAlert }) =>
    isAlert ? COLORS.errorEnabled : COLORS.transparent};
  color: ${({ isAlert }) => (isAlert ? COLORS.white : COLORS.darkBlackEnabled)};
  padding: ${({ isOnDevice }) =>
    isOnDevice
      ? `1.625rem 1.5rem`
      : `${SPACING.spacing3} 0.75rem ${SPACING.spacing3} 0.75rem`};
  height: ${({ isOnDevice }) => (isOnDevice ? '4.875rem' : 'auto')};
  line-height: ${({ isOnDevice }) =>
    isOnDevice ? TYPOGRAPHY.lineHeight36 : 'auto'};

  &:hover,
  &:active {
    background-color: ${({ isOnDevice }) =>
      isOnDevice ? COLORS.darkBlack_twenty : COLORS.lightBlue};
  }

  &:disabled {
    background-color: ${COLORS.transparent};
    color: ${({ isOnDevice }) =>
      isOnDevice
        ? COLORS.darkBlack_sixty
        : `${COLORS.black}${COLORS.opacity50HexCode}`};
  }
`
