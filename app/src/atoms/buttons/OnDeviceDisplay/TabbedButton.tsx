import {
  Btn,
  BORDERS,
  COLORS,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'
import styled, { css } from 'styled-components'

const SELECTED_STYLE = css`
  background-color: ${COLORS.highlightPurple_one};
  color: ${COLORS.white};

  &:focus,
  &:hover {
    background-color: ${COLORS.highlightPurple_one};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.highlightPurple_one_pressed};
  }
`

const UNSELECTED_STYLE = css`
  background-color: ${COLORS.highlightPurple_two};
  color: ${COLORS.darkBlack_hundred};

  &:focus,
  &:hover {
    background-color: ${COLORS.highlightPurple_two};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.highlightPurple_two_pressed};
  }
`

interface TabbedButtonProps extends React.ComponentProps<typeof Btn> {
  isSelected?: boolean
}

export const TabbedButton = styled(Btn)<TabbedButtonProps>`
  ${props =>
    css`
      border-radius: ${BORDERS.size_four};
      box-shadow: none;
      font-size: ${TYPOGRAPHY.fontSize22};
      font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
      line-height: ${TYPOGRAPHY.lineHeight28};
      padding: ${SPACING.spacing16} ${SPACING.spacing24};
      text-transform: ${TYPOGRAPHY.textTransformNone};

      ${props.isSelected === true ? SELECTED_STYLE : UNSELECTED_STYLE}

      ${styleProps}

      &:focus-visible {
        box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
      }
      &:disabled {
        background-color: ${COLORS.darkBlack_twenty};
        color: ${COLORS.darkBlack_sixty};
      }
    `}
`
