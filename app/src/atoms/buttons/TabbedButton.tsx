import styled, { css } from 'styled-components'
import {
  Btn,
  BORDERS,
  LEGACY_COLORS,
  SPACING,
  styleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

const SELECTED_STYLE = css`
  background-color: ${COLORS.purple50};
  color: ${COLORS.white};

  &:focus,
  &:hover {
    background-color: ${COLORS.purple50};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.purple55};
  }
`

const UNSELECTED_STYLE = css`
  background-color: ${LEGACY_COLORS.highlightPurple2};
  color: ${LEGACY_COLORS.darkBlack100};

  &:focus,
  &:hover {
    background-color: ${LEGACY_COLORS.highlightPurple2};
    box-shadow: none;
  }

  &:active {
    background-color: ${COLORS.purple40};
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
        box-shadow: 0 0 0 3px ${COLORS.blue50};
      }
      &:disabled {
        background-color: ${COLORS.grey35};
        color: ${COLORS.grey50};
      }
    `}
`
