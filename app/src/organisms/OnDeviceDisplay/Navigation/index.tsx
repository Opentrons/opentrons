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
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { getLocalRobot } from '../../../redux/discovery'

import type { RouteProps } from '../../../App/types'

const NavigationLink = styled(NavLink)`
  color: ${COLORS.black};

  &:active {
    color: ${COLORS.blueEnabled};
  }
`

export function Navigation({ routes }: { routes: RouteProps[] }): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const navRoutes = routes.filter(
    ({ navLinkTo }: RouteProps) => navLinkTo != null
  )

  const sortNavRoutesByName = navRoutes.slice(0)
  sortNavRoutesByName.sort(function (a, b) {
    const x = a.name.toLowerCase()
    const y = b.name.toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  })

  const truncateString = (text: string, maxLength = 10): string => {
    const dots = '...'
    if (text.length > maxLength)
      return `${text.substring(0, maxLength - dots.length)}${dots}`
    else return text
  }

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing4} ${SPACING.spacing1}`}
      height="7rem"
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_FLEX_START}
        justifyContent={JUSTIFY_CENTER}
        gridGap="0.625rem"
      >
        <NavLink to="/dashboard">
          <StyledText
            color={COLORS.black}
            fontSize="1.625rem"
            fontWeight="700"
            lineHeight="1.9375rem"
          >
            {truncateString(robotName)}
          </StyledText>
        </NavLink>
        <Icon name="wifi" size="2rem" />
      </Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        {sortNavRoutesByName.map(({ name, navLinkTo }: RouteProps) => (
          <NavigationLink key={name} to={navLinkTo as string}>
            <StyledText
              color={COLORS.black}
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
        <Icon name="radiobox-blank" size="3rem" />
      </Flex>
    </Flex>
  )
}
