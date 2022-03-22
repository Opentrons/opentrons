import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

interface NavTabProps {
  to: string
  tabName: string
}

const StyledNavLink = styled(NavLink)`
  padding: 0 ${SPACING.spacing2} ${SPACING.spacing3};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.darkGreyEnabled};

  &.active {
    color: ${COLORS.darkBlack};
    ${BORDERS.tabBorder}
  }
`

export function NavTab({ to, tabName }: NavTabProps): JSX.Element {
  return (
    <StyledNavLink to={to} replace>
      {tabName}
    </StyledNavLink>
  )
}
