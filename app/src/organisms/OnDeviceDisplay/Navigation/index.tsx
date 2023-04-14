import * as React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Flex,
  COLORS,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  ALIGN_END,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../../atoms/text'
import { getLocalRobot } from '../../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'

import type { RouteProps } from '../../../App/types'

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  const NavigationLink = styled(NavLink)`
    color: ${COLORS.black};
    display: flex;
    grid-gap: ${SPACING.spacing3};
    border-bottom: 0.3125rem solid transparent;
    height: 3.5rem;

    &.active {
      border-bottom: 0.3125rem solid transparent;
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
        marginBottom={SPACING.spacing5}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_FLEX_START}
          justifyContent={JUSTIFY_CENTER}
          gridGap={SPACING.spacing3}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <NavigationLink to="/dashboard">
              <StyledText
                fontSize={TYPOGRAPHY.fontSize32}
                fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
                lineHeight={TYPOGRAPHY.lineHeight42}
                color={COLORS.darkBlackEnabled}
              >
                {robotName}
              </StyledText>
            </NavigationLink>
          </Flex>
        </Flex>
        <Flex flexDirection={DIRECTION_ROW}>
          {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginRight={TYPOGRAPHY.fontSize32}
            >
              <NavigationLink key={name} to={navLinkTo as string}>
                <StyledText
                  fontSize={TYPOGRAPHY.fontSize32}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  lineHeight={TYPOGRAPHY.lineHeight42}
                  color={COLORS.darkBlack_seventy}
                >
                  {name}
                </StyledText>
              </NavigationLink>
            </Flex>
          ))}
        </Flex>
        <Flex alignItems={ALIGN_END}>
          <OverflowBtn
            isOnDevice={true}
            onClick={() => setNavMenu(true)}
            aria-label="Navigation_OverflowBtn"
          />
        </Flex>
      </Flex>
      {showNavMenu && (
        <NavigationMenu
          onClick={() => setNavMenu(false)}
          robotName={robotName}
        />
      )}
    </>
  )
}
