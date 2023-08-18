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
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  Link,
  SIZE_2,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import logoSvg from '../assets/images/logo_nav.svg'
import logoSvgThree from '../assets/images/logo_nav_three.svg'

import { NAV_BAR_WIDTH } from './constants'
import { StyledText } from '../atoms/text'

import type { RouteProps } from './types'

const SALESFORCE_HELP_LINK = 'https://support.opentrons.com/s/'

const NavbarLink = styled(NavLink)`
  color: ${COLORS.white};
  align-self: ${ALIGN_STRETCH};
  background-color: ${COLORS.darkBlackEnabled};

  &:hover {
    background-color: ${COLORS.darkBlackHover};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.fundamentalsFocus};
    outline: none;
    background-color: ${COLORS.darkGreyHover};
  }

  &:focus-visible.active {
    box-shadow: none;
    outline: none;
  }

  &:active {
    background-color: ${COLORS.darkBlackEnabled};
  }

  &.active {
    background-color: ${COLORS.darkBlackSelected};
  }
  &.active:has(svg) {
    background-color: ${COLORS.darkBlackEnabled};
  }
`
const NavIconLink = styled(NavLink)`
  &.active > svg {
    color: ${COLORS.medGreyEnabled};
    background-color: ${COLORS.darkBlackSelected};
  }
`
const IconLink = styled(Link)`
  &.active > svg {
    color: ${COLORS.medGreyEnabled};
    background-color: ${COLORS.darkBlackSelected};
  }
`

const NavbarIcon = styled(Icon)`
  width: ${SIZE_2};
  height: ${SIZE_2};
  padding: ${SPACING.spacing6};
  border-radius: 50%;
  color: ${COLORS.medGreyEnabled};
  background-color: ${COLORS.transparent};

  &:hover {
    background-color: ${COLORS.darkBlackHover};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 3px ${COLORS.fundamentalsFocus};
    outline: none;
    background-color: ${COLORS.darkGreyHover};
  }

  &:active {
    color: ${COLORS.medGreyEnabled};
    background-color: ${COLORS.darkBlackEnabled};
  }

  &.active {
    color: ${COLORS.medGreyEnabled};
    background-color: ${COLORS.darkBlackSelected};
  }
`

const LogoImg = styled('img')`
  align-self: ${ALIGN_CENTER};
  margin: ${SPACING.spacing24} 0;
`

export function Navbar({ routes }: { routes: RouteProps[] }): JSX.Element {
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  return (
    <Flex
      backgroundColor={COLORS.darkBlackEnabled}
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
        <LogoImg
          src={_OPENTRONS_PROJECT_ === 'ot3' ? logoSvgThree : logoSvg}
          alt="opentrons logo"
        />
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavbarLink key={name} to={navLinkTo as string}>
            <StyledText
              as="h3"
              margin={`${SPACING.spacing8} 0 ${SPACING.spacing8} ${SPACING.spacing12}`}
            >
              {name}
            </StyledText>
          </NavbarLink>
        ))}
      </Flex>
      <Flex
        marginBottom={SPACING.spacing8}
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
