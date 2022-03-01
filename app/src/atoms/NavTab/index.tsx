import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Box,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

interface NavTabProps {
  to: string
  tabName: string
}

const StyledNavLink = styled(NavLink)`
  color: ${COLORS.darkGreyEnabled};
  &.active {
    color: ${COLORS.darkBlack};
    ${BORDERS.tabBorder}
  }
`

export function NavTab({ to, tabName }: NavTabProps): JSX.Element {
  return (
    <StyledNavLink to={to} replace>
      <Box
        css={TYPOGRAPHY.labelSemiBold}
        paddingBottom={SPACING.spacing3}
        paddingX={SPACING.spacing2}
      >
        {tabName}
      </Box>
    </StyledNavLink>
  )
}
