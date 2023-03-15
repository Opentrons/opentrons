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
  &:active,
  &:hover,
  &:focus {
    background-color: ${COLORS.highlightPurple_one};
  }
`

const BACKGROUND_STYLES = css`
  background-color: ${COLORS.highlightPurple_two};
  color: ${COLORS.darkBlack_hundred};

  &:active,
  &:hover,
  &:focus {
    background-color: ${COLORS.highlightPurple_two};
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
    `}
`
