import styled from 'styled-components'
import { BORDERS, COLORS, CURSOR_DEFAULT, SPACING } from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'

export const TouchControlButton = styled.button<{ selected: boolean }>`
  background-color: ${({ selected }) =>
    selected ? COLORS.blue50 : COLORS.blue35};
  cursor: ${CURSOR_DEFAULT};
  border-radius: ${BORDERS.borderRadius16};
  box-shadow: none;
  padding: ${SPACING.spacing8} ${SPACING.spacing20};

  &:focus {
    background-color: ${({ selected }) =>
      selected ? COLORS.blue60 : COLORS.blue40};
    box-shadow: none;
  }
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${({ selected }) =>
      selected ? COLORS.blue50 : COLORS.blue35};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${({ selected }) =>
      selected ? COLORS.blue50 : COLORS.blue35};
  }

  &:active {
    background-color: ${({ selected }) =>
      selected ? COLORS.blue60 : COLORS.blue40};
  }
`
