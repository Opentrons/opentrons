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
  Box,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../../atoms/text'
import { getLocalRobot } from '../../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'

import type { RouteProps } from '../../../App/types'

const NavigationLink = styled(NavLink)`
  color: ${COLORS.black};
  display: flex;
  grid-gap: ${SPACING.spacing3};

  &.active {
    color: ${COLORS.blueEnabled};
  }
`
type NavRoutes = 'dashboard' | 'All Protocols' | 'Instruments' | 'Settings'

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )
  const [currentNav, setCurrentNav] = React.useState<NavRoutes>('dashboard')

  return (
    <>
      {showNavMenu ? (
        <NavigationMenu
          onClick={() => setNavMenu(false)}
          robotName={robotName}
        />
      ) : (
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
            <NavigationLink
              to="/dashboard"
              onClick={() => setCurrentNav('dashboard')}
            >
              <Flex flexDirection={DIRECTION_COLUMN}>
                <StyledText
                  fontSize={TYPOGRAPHY.fontSize32}
                  fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
                  lineHeight={TYPOGRAPHY.lineHeight42}
                  color={COLORS.darkBlackEnabled}
                >
                  {robotName}
                </StyledText>
                {currentNav === 'dashboard' ? (
                  <Box
                    borderBottom={`0.3125rem solid ${COLORS.highlightPurple_one}`}
                    width={SPACING.spacingXXL}
                    alignSelf={ALIGN_CENTER}
                    aria-label="NavLink_dashboard"
                  />
                ) : null}
              </Flex>
            </NavigationLink>
          </Flex>
          <Flex flexDirection={DIRECTION_ROW}>
            {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
              <NavigationLink
                key={name}
                to={navLinkTo as string}
                onClick={() => setCurrentNav(name as NavRoutes)}
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  marginRight={TYPOGRAPHY.fontSize32}
                >
                  <StyledText
                    fontSize={TYPOGRAPHY.fontSize32}
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    lineHeight={TYPOGRAPHY.lineHeight42}
                    color={COLORS.darkBlack_seventy}
                  >
                    {name}
                  </StyledText>
                  {currentNav === name ? (
                    <Box
                      borderBottom={`0.3125rem solid ${COLORS.highlightPurple_one}`}
                      width={SPACING.spacingXXL}
                      alignSelf={ALIGN_CENTER}
                      aria-label={`NavLink_${name}`}
                    />
                  ) : null}
                </Flex>
              </NavigationLink>
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
      )}
    </>
  )
}
