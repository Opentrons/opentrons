import * as React from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Flex,
  Icon,
  COLORS,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_FLEX_START,
  JUSTIFY_CENTER,
  ALIGN_END,
  ALIGN_FLEX_END,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { getLocalRobot } from '../../../redux/discovery'

import type { RouteProps } from '../../../App/types'

const NavigationLink = styled(NavLink)`
  color: ${COLORS.darkBlack_seventy};
  display: flex;
  grid-gap: 0.5rem;
  position: relative;

  &.active {
    color: ${COLORS.darkBlackEnabled};

    &:after {
      position: absolute;
      content: '';
      display: block;
      width: 2.5rem;
      height: 0.3125rem;
      background: ${COLORS.highlightPurple_one};
      right: 50%;
      bottom: -0.5rem;
    }
  }
`

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )

  const handleOverflowClick = (): void => {
    console.log('this will show a modal')
  }

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing1}
      paddingBottom="0.75rem"
      height="7rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_CENTER}
        gridGap="0.5rem"
      >
        <NavigationLink to="/dashboard">
          <StyledText
            fontSize="1.625rem"
            fontWeight="700"
            lineHeight="1.9375rem"
          >
            {robotName}
          </StyledText>
        </NavigationLink>
        <Icon name="wifi" size="2rem" />
      </Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        {navRoutes.map(({ name, navLinkTo }: RouteProps) => (
          <NavigationLink key={name} to={navLinkTo as string}>
            <StyledText
              fontSize="1.625rem"
              fontWeight="600"
              lineHeight="1.9375rem"
              marginRight="2.75rem"
            >
              {name}
            </StyledText>
          </NavigationLink>
        ))}
      </Flex>
      <Flex alignItems={ALIGN_END}>
        {/* This icon is temporary since the current design is mid-fi and the icon will be varied in hi-fi */}
        <OverflowBtn
          alignSelf={ALIGN_FLEX_END}
          onClick={handleOverflowClick}
          height="3.75rem"
          data-testid="Navigation_overflowBtn"
        />
      </Flex>
    </Flex>
  )
}
