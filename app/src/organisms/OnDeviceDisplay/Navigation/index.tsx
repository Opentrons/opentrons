import * as React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Icon,
  Flex,
  COLORS,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '../../../atoms/buttons/OnDeviceDisplay/constants'
import { getLocalRobot } from '../../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'

import type { RouteProps } from '../../../App/types'

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setShowNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  const NavigationLink = styled(NavLink)`
    ${TYPOGRAPHY.level3HeaderSemiBold}
    color: ${COLORS.darkBlack_seventy};
    border-bottom: 5px solid transparent;
    height: 3.5rem;

    &.active {
      color: ${COLORS.black};
      border-image: linear-gradient(
        to right,
        white 33.3%,
        ${COLORS.highlightPurple_one} 33.3%,
        ${COLORS.highlightPurple_one} 66.6%,
        white 66.6%
      );
      border-image-slice: 1;
    }
  `
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
          <NavigationLink to="/dashboard">{robotName}</NavigationLink>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing6}>
          {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
            <NavigationLink key={name} to={navLinkTo as string}>{name}</NavigationLink>
          ))}
        </Flex>
        <IconButton onClick={() => setShowNavMenu(true)}>
          <Icon
            name="overflow-btn-touchscreen"
            height="60px"
            width="48px"
            color={COLORS.darkBlack_seventy}
            aria-label="OverflowBtn_OnDeviceDisplay_icon"
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

export const IconButton = styled('button')`
    border-radius: ${SPACING.spacing2};
    max-height: 100%;
    background-color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.darkBlack_twenty};
    }
    &:active,
    &:focus {
      background-color: ${COLORS.darkBlack_twenty};
    }
    &:focus-visible {
      box-shadow: ${ODD_FOCUS_VISIBLE};
      background-color: ${COLORS.darkBlack_twenty};
    }
    &:disabled {
      background-color: transparent;
    }
`