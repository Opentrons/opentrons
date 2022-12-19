import * as React from 'react'
import { Link } from 'react-router-dom'

import { Flex } from '@opentrons/components'

import { TertiaryButton } from '../../../atoms/buttons'
import { onDeviceDisplayRoutes } from '../../../App/OnDeviceDisplayApp'

import type { RouteProps } from '../../../App/types'

export function TempODDMenu(): JSX.Element {
  return (
    <>
      <Flex marginBottom="2rem">Temp ODDMenu</Flex>
      {/* TODO(bh, 2022-12-7): TEMP links to all routes to allow development throughout the app */}
      {onDeviceDisplayRoutes.map((route: RouteProps) => (
        <Flex key={route.path} margin="0.5rem">
          <Link to={route.path}>
            <TertiaryButton>{route.name}</TertiaryButton>
          </Link>
        </Flex>
      ))}
    </>
  )
}
