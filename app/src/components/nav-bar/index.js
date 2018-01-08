// nav bar component
import React from 'react'
import {VerticalNavBar} from '@opentrons/components'
import NavButton from './NavButton'

import {PANELS} from '../../interface'

export default function NavBar (props) {
  return (
    <VerticalNavBar>
      {PANELS.map((panel) => <NavButton key={panel.name} {...panel} />)}
    </VerticalNavBar>
  )
}
