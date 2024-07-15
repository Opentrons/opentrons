import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { Flex, SPACING } from '@opentrons/components'

export function Landing(): JSX.Element {
  return (
    <Flex flexDirection="column" margin={SPACING.spacing24}>
      Create Opentrons protocol
      <Flex
        alignItems="center"
        marginTop={SPACING.spacing24}
        gridGap={SPACING.spacing16}
      >
        <NavLink to={'/createNewProtocol'}>Create new</NavLink>
        Import
      </Flex>
    </Flex>
  )
}
