import * as React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Flex,
  COLORS,
  Icon,
  Link,
  DIRECTION_COLUMN,
  FLEX_NONE,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  JUSTIFY_SPACE_EVENLY,
  SIZE_2,
} from '@opentrons/components'

import logoSvg from '../assets/images/logo_nav.svg'
import { NAV_BAR_WIDTH } from './constants'
import { StyledText } from '../atoms/text'

import type { RouteProps } from './types'

const SALESFORCE_HELP_LINK = 'https://support.opentrons.com/s/'

const NavbarLink = styled(NavLink)`
  color: ${COLORS.white};
  align-self: ${ALIGN_STRETCH};
  background-color: ${COLORS.darkBlack};

  &:hover {
    background-color: ${COLORS.darkBlackHover};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.warning};
    outline: none;
    background-color: ${COLORS.darkGreyHover};
  }

  &:focus-visible.active {
    box-shadow: none;
    outline: none;
  }

  &:active {
    background-color: ${COLORS.darkBlackPressed};
  }

  &.active {
    background-color: ${COLORS.darkBlackSelected};
  }
  &.active:has(svg) {
    background-color: ${COLORS.darkBlack};
  }
`
const NavIconLink = styled(NavLink)`
  &.active > svg {
    color: ${COLORS.medGrey};
    background-color: ${COLORS.darkBlackSelected};
  }
`
const IconLink = styled(Link)`
  &.active > svg {
    color: ${COLORS.medGrey};
    background-color: ${COLORS.darkBlackSelected};
  }
`

const NavbarIcon = styled(Icon)`
  width: ${SIZE_2};
  height: ${SIZE_2};
  padding: 0.375rem;
  border-radius: 50%;
  color: ${COLORS.medGrey};
  background-color: ${COLORS.transparent};

  &:hover {
    background-color: ${COLORS.darkBlackHover};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.warning};
    outline: none;
    background-color: ${COLORS.darkGreyHover};
  }

  &:active {
    color: ${COLORS.medGrey};
    background-color: ${COLORS.darkBlackPressed};
  }

  &.active {
    color: ${COLORS.medGrey};
    background-color: ${COLORS.darkBlackSelected};
  }
`

const LogoImg = styled('img')`
  align-self: ${ALIGN_CENTER};
  margin: ${SPACING.spacing5} 0;
`

export function Navbar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  return (
    <Flex
      backgroundColor={COLORS.darkBlack}
      css={TYPOGRAPHY.h3Regular}
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width={NAV_BAR_WIDTH}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        flex={FLEX_NONE}
        alignItems={ALIGN_FLEX_START}
        alignSelf={ALIGN_STRETCH}
      >
        <LogoImg src={logoSvg} alt="opentrons logo" />
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavbarLink key={name} to={navLinkTo as string}>
            <StyledText
              as="h3"
              margin={`${SPACING.spacing3} 0 ${SPACING.spacing3} 0.75rem`}
            >
              {name}
            </StyledText>
          </NavbarLink>
        ))}
      </Flex>
      <Flex
        marginBottom={SPACING.spacing3}
        alignSelf={ALIGN_STRETCH}
        justifyContent={JUSTIFY_SPACE_EVENLY}
      >
        <NavIconLink data-testid="Navbar_settingsLink" to="/app-settings">
          <NavbarIcon name="gear" />
        </NavIconLink>
        <IconLink href={SALESFORCE_HELP_LINK} external>
          <NavbarIcon
            data-testid="Navbar_helpLink"
            name="question-mark-circle"
          />
        </IconLink>
      </Flex>
    </Flex>
  )
}
