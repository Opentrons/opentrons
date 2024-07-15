import * as React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'

export function Landing(): JSX.Element {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING.spacing24}>
      Create Opentrons protocol
      <Flex
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing24}
        gridGap={SPACING.spacing16}
      >
        <NavLink to={'/createNewProtocol'}>Create new</NavLink>
        Import
      </Flex>
    </Flex>
  )
}
