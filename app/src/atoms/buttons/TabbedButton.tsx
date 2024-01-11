import styled, { css } from 'styled-components'
import {
  Btn,
  BORDERS,
  COLORS,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

const SELECTED_STYLE = css`
  background-color: ${COLORS.highlightPurple1};
  color: ${COLORS.white};

  &:focus,
  &:hover {
    background-color: ${COLORS.highlightPurple1};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.highlightPurple1Pressed};
  }
`

const UNSELECTED_STYLE = css`
  background-color: ${COLORS.highlightPurple2};
  color: ${COLORS.darkBlack100};

  &:focus,
  &:hover {
    background-color: ${COLORS.highlightPurple2};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.highlightPurple2Pressed};
  }
`

interface TabbedButtonProps extends React.ComponentProps<typeof Btn> {
  isSelected?: boolean
}

export const TabbedButton = styled(Btn)<TabbedButtonProps>`
  ${props =>
    css`
      border-radius: ${BORDERS.borderRadiusSize4};
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
        background-color: ${COLORS.darkBlack20};
        color: ${COLORS.darkBlack60};
      }
    `}
`
