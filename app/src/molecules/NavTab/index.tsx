import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

interface NavTabProps {
  to: string
  tabName: string
  disabled?: boolean
}

const StyledNavLink = styled(NavLink)<React.ComponentProps<typeof NavLink>>`
  padding: 0 ${SPACING.spacing4} ${SPACING.spacing8};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.grey50};

  &.active {
    color: ${COLORS.black90};
    ${BORDERS.tabBorder}
  }
`
const DisabledNavLink = styled.span`
  padding: 0 ${SPACING.spacing4} ${SPACING.spacing8};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.grey40};
`

export function NavTab({
  to,
  tabName,
  disabled = false,
}: NavTabProps): JSX.Element {
  return (
    <StyledNavLink as={disabled ? DisabledNavLink : undefined} to={to} replace>
      {tabName}
    </StyledNavLink>
  )
}
