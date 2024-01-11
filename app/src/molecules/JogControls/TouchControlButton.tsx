import styled from 'styled-components'
import { COLORS, SPACING, BORDERS } from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

export const TouchControlButton = styled.button<{ selected: boolean }>`
  background-color: ${({ selected }) =>
    selected ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
  cursor: default;
  border-radius: ${BORDERS.borderRadiusSize4};
  box-shadow: none;
  padding: ${SPACING.spacing8} ${SPACING.spacing20};

  &:focus {
    background-color: ${({ selected }) =>
      selected ? COLORS.bluePressed : COLORS.mediumBluePressed};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${({ selected }) =>
      selected ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${({ selected }) =>
      selected ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
  }

  &:active {
    background-color: ${({ selected }) =>
      selected ? COLORS.bluePressed : COLORS.mediumBluePressed};
  }
`
