import { NavLink } from 'react-router-dom'
import styled, { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  LegacyStyledText,
  POSITION_RELATIVE,
  SPACING,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'

const baseRoundTabStyling = css`
  ${TYPOGRAPHY.pSemiBold}
  color: ${COLORS.black90};
  background-color: ${COLORS.purple30};
  border: 0px ${BORDERS.styleSolid} ${COLORS.purple30};
  border-radius: ${BORDERS.borderRadius8};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  position: ${POSITION_RELATIVE};

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &:focus-visible {
    outline: 2px ${BORDERS.styleSolid} ${COLORS.yellow50};
  }
`
const disabledRoundTabStyling = css`
  ${baseRoundTabStyling}
  color: ${COLORS.grey40};
  background-color: ${COLORS.grey30};

  &:hover {
    background-color: ${COLORS.grey30};
  }
`

interface RoundNavLinkProps {
  minWidth?: string
}

const RoundNavLink = styled(NavLink)<RoundNavLinkProps>`
  ${baseRoundTabStyling}
  color: ${COLORS.black90};
  ${({ minWidth }) =>
    minWidth != null &&
    css`
      min-width: ${minWidth};
    `}

  &:hover {
    background-color: ${COLORS.purple35};
  }

  &.active {
    background-color: ${COLORS.purple50};
    color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.purple55};
    }
  }
`

interface RoundTabProps {
  disabled: boolean
  tabDisabledReason?: string
  to: string
  tabName: string
  end?: boolean
  minWidth?: string
}

export function RoundTab({
  disabled,
  tabDisabledReason,
  to,
  tabName,
  end,
  minWidth,
}: RoundTabProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()
  return disabled ? (
    <>
      <LegacyStyledText css={disabledRoundTabStyling} {...targetProps}>
        {tabName}
      </LegacyStyledText>
      {tabDisabledReason != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tabDisabledReason}</Tooltip>
      ) : null}
    </>
  ) : (
    <RoundNavLink to={to} replace end={end} minWidth={minWidth}>
      {tabName}
    </RoundNavLink>
  )
}
