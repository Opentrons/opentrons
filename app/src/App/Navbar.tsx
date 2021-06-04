import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Flex,
  DIRECTION_COLUMN,
  FLEX_NONE,
  SIZE_3,
  SPACING_1,
  SPACING_3,
  SPACING_AUTO,
  BORDER_SOLID_LIGHT,
} from '@opentrons/components'

import { getNavbarLocations } from '../redux/nav'
import { NavbarLink } from '../molecules/NavbarLink'

export function Navbar(): JSX.Element {
  const locations = useSelector(getNavbarLocations)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width={SIZE_3}
      borderRight={BORDER_SOLID_LIGHT}
    >
      {locations.map((loc, i) => {
        // move last item to the bottom and adjust its border and padding
        const isLast = i === locations.length - 1
        const sx = isLast
          ? {
              borderTop: BORDER_SOLID_LIGHT,
              marginTop: SPACING_AUTO,
              paddingTop: SPACING_1,
              paddingBottom: SPACING_3,
            }
          : { borderBottom: BORDER_SOLID_LIGHT }

        return <NavbarLink key={loc.id} {...loc} {...sx} />
      })}
    </Flex>
  )
}
