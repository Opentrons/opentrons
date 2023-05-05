import * as React from 'react'
import {
  Icon,
  Flex,
  Box,
  COLORS,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import type { RouteProps } from '../../../App/types'
import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons/constants'
import { getLocalRobot } from '../../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setShowNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        height="124px"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
          gridGap={SPACING.spacing3}
        >
          <NavigationLink to="/dashboard" name={robotName} />
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing6}>
          {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
            <NavigationLink key={name} to={navLinkTo as string} name={name} />
          ))}
        </Flex>
        <IconButton
          aria-label="overflow menu button"
          onClick={() => setShowNavMenu(true)}
        >
          <Icon
            name="overflow-btn-touchscreen"
            height="60px"
            width="48px"
            color={COLORS.darkBlack70}
          />
        </IconButton>
      </Flex>
      {showNavMenu && (
        <NavigationMenu
          onClick={() => setShowNavMenu(false)}
          robotName={robotName}
        />
      )}
    </>
  )
}

const NavigationLink = (props: { to: string; name: string }): JSX.Element => (
  <TouchNavLink to={props.to}>
    {props.name}
    <Box width="2.5rem" height="5px" borderRadius="2px" />
  </TouchNavLink>
)

const TouchNavLink = styled(NavLink)`
  ${TYPOGRAPHY.level3HeaderSemiBold}
  color: ${COLORS.darkBlack70};
  height: 3.5rem;
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  &.active {
    color: ${COLORS.black};
  }
  &.active > div {
    background-color: ${COLORS.highlightPurple1};
  }
`

const IconButton = styled('button')`
  border-radius: ${SPACING.spacing2};
  max-height: 100%;
  background-color: ${COLORS.white};

  &:hover {
    background-color: ${COLORS.darkBlack20};
  }
  &:active,
  &:focus {
    background-color: ${COLORS.darkBlack20};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.darkBlack20};
  }
  &:disabled {
    background-color: transparent;
  }
`
