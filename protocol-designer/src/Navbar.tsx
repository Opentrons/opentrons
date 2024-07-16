import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  COLORS,
  DIRECTION_COLUMN,
  FLEX_NONE,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { RouteProps } from './types'

export function Navbar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  return (
    <Flex
      css={TYPOGRAPHY.h3Regular}
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection="row"
        flex={FLEX_NONE}
        alignItems={ALIGN_FLEX_START}
        alignSelf={ALIGN_STRETCH}
      >
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavbarLink key={name} to={navLinkTo}>
            <LegacyStyledText
              as="h3"
              margin={`${SPACING.spacing8} 0 ${SPACING.spacing8} ${SPACING.spacing12}`}
            >
              {name}
            </LegacyStyledText>
          </NavbarLink>
        ))}
      </Flex>
    </Flex>
  )
}

const NavbarLink = styled(NavLink)`
  color: ${COLORS.black90};
  text-decoration: none;
  align-self: ${ALIGN_STRETCH};
  &:hover {
    color: ${COLORS.black70};
  }
`
