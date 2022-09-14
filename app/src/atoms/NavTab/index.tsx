import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { BORDERS, COLORS, SPACING, TYPOGRAPHY } from '@opentrons/components'

interface NavTabProps {
  to: string
  tabName: string
  disabled?: boolean
  as?: React.ElementType
}

const StyledNavLink = styled(NavLink)<
  React.ComponentProps<typeof NavLink> /* & { disabled: boolean } */
>`
  padding: 0 ${SPACING.spacing2} ${SPACING.spacing3};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.darkGreyEnabled};

  &.active {
    color: ${COLORS.darkBlackEnabled};
    ${BORDERS.tabBorder}
  }
`
const DisabledNavLink = styled.span`
  padding: 0 ${SPACING.spacing2} ${SPACING.spacing3};
  ${TYPOGRAPHY.labelSemiBold}
  color: ${COLORS.darkGreyEnabled};
`

export function NavTab({
  to,
  tabName,
  disabled = false,
  as: DisabledLink = DisabledNavLink,
}: NavTabProps): JSX.Element {
  return (
    <>
      {disabled ? (
        <DisabledLink>{tabName}</DisabledLink>
      ) : (
        <StyledNavLink to={to} replace>
          {tabName}
        </StyledNavLink>
      )}
    </>
  )
}
