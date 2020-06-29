// @flow
// nav bar component
import { VerticalNavBar } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getNavbarLocations } from '../../nav'
import { NavButton } from './NavButton'

export function NavBar(): React.Node {
  const locations = useSelector(getNavbarLocations)

  return (
    <VerticalNavBar>
      {locations.map((location, i) => (
        <NavButton
          key={location.id}
          {...location}
          isBottom={i >= locations.length - 1}
        />
      ))}
    </VerticalNavBar>
  )
}
