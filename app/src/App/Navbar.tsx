import * as React from 'react'
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

import { NavbarLink } from '../molecules/NavbarLink'
import { useNavLocations } from './hooks'

export function Navbar(): JSX.Element {
  const navLocations = useNavLocations()

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      flex={FLEX_NONE}
      width={SIZE_3}
      borderRight={BORDER_SOLID_LIGHT}
    >
      {navLocations.map((loc, i) => {
        // move last item to the bottom and adjust its border and padding
        const isLast = i === navLocations.length - 1
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
