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
  align-items: ${props => (props.isOnDevice ? ALIGN_CENTER : 'auto')};
  text-align: ${props =>
    props.isOnDevice ? TYPOGRAPHY.textAlignCenter : TYPOGRAPHY.textAlignLeft};
  font-size: ${props =>
    props.isOnDevice ? TYPOGRAPHY.fontSize28 : TYPOGRAPHY.fontSizeP};
  background-color: ${props =>
    props.isAlert ? COLORS.errorEnabled : COLORS.transparent};
  color: ${props => (props.isAlert ? COLORS.white : COLORS.darkBlackEnabled)};
  padding: ${props =>
    props.isOnDevice
      ? `1.625rem 1.5rem`
      : `${SPACING.spacing3} 0.75rem ${SPACING.spacing3} 0.75rem`};
  height: ${props => (props.isOnDevice ? '4.875rem' : 'auto')};
  line-height: ${props =>
    props.isOnDevice ? TYPOGRAPHY.lineHeight36 : 'auto'};

  &:hover,
  &:active {
    background-color: ${props =>
      props.isOnDevice ? COLORS.darkBlack_twenty : COLORS.lightBlue};
  }


  &:disabled,
  &.disabled {
    background-color: ${COLORS.transparent};
    color: ${props =>
      props.isOnDevice
        ? COLORS.darkBlack_sixty
        : `${COLORS.black} ${COLORS.opacity50HexCode}`};
`
