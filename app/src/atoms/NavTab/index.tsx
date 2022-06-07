import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

interface NavTabProps {
  to: string
  tabName: string
  disabled?: boolean
}

const StyledNavLink = styled(NavLink)<
  React.ComponentProps<typeof NavLink> & { disabled: boolean }
>`
  padding: 0 ${SPACING.spacing2} ${SPACING.spacing3};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.darkGreyEnabled};

  &.active {
    color: ${COLORS.darkBlackEnabled};
    ${BORDERS.tabBorder}
  }
`

export function NavTab({
  to,
  tabName,
  disabled = false,
}: NavTabProps): JSX.Element {
  return (
    <StyledNavLink to={to} replace disabled={disabled}>
      {tabName}
    </StyledNavLink>
  )
}
