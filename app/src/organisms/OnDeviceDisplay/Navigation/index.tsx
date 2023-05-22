import * as React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

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
  POSITION_STICKY,
  POSITION_STATIC,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons/constants'
import { getLocalRobot } from '../../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'

import type { RouteProps } from '../../../App/types'

interface NavigationProps {
  routes: RouteProps[]
  //  optionalProps for setting the zIndex and position between multiple sticky elements
  //  used for ProtocolDashboard
  setNavMenuIsOpened?: React.Dispatch<React.SetStateAction<boolean>>
  longPressModalIsOpened?: boolean
}
export function Navigation(props: NavigationProps): JSX.Element {
  const { routes, setNavMenuIsOpened, longPressModalIsOpened } = props
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setShowNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )

  const handleMenu = (openMenu: boolean): void => {
    if (setNavMenuIsOpened != null) {
      setNavMenuIsOpened(openMenu)
    }
    setShowNavMenu(openMenu)
  }
  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        height="7.75rem"
        zIndex={showNavMenu || Boolean(longPressModalIsOpened) ? 0 : 3}
        position={
          showNavMenu || Boolean(longPressModalIsOpened)
            ? POSITION_STATIC
            : POSITION_STICKY
        }
        top="0"
        width="100%"
        backgroundColor={COLORS.white}
        aria-label="Navigation_container"
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
          gridGap={SPACING.spacing8}
        >
          <NavigationLink to="/dashboard" name={robotName} />
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing32}>
          {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
            <NavigationLink key={name} to={navLinkTo as string} name={name} />
          ))}
        </Flex>
        <IconButton
          aria-label="overflow menu button"
          onClick={() => handleMenu(true)}
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
          onClick={() => handleMenu(false)}
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
  border-radius: ${SPACING.spacing4};
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
