import styled, { css } from 'styled-components'
import {
  Btn,
  BORDERS,
  COLORS,
  NewPrimaryBtn,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

const FOREGROUND_STYLES = css`
  &:focus,
  &:hover {
    background-color: ${COLORS.highlightPurple_one};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.highlightPurple_one_pressed};
  }
`

const BACKGROUND_STYLES = css`
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
  foreground?: boolean
}

export const TabbedButton = styled(NewPrimaryBtn)<TabbedButtonProps>`
  ${props =>
    css`
      background-color: ${COLORS.highlightPurple_one};
      border-radius: ${BORDERS.size_four};
      box-shadow: none;
      font-size: ${TYPOGRAPHY.fontSize22};
      font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
      line-height: ${TYPOGRAPHY.lineHeight28};
      padding: ${SPACING.spacing4} ${SPACING.spacing5};
      text-transform: ${TYPOGRAPHY.textTransformNone};

      ${props.foreground === true ? FOREGROUND_STYLES : BACKGROUND_STYLES}

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
