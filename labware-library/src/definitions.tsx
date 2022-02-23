import * as React from 'react'
import { Route } from 'react-router-dom'
import { getDefinition } from '@opentrons/shared-data'
import { getPublicPath } from './public-path'

import type { RouteComponentProps } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export interface DefinitionRouteRenderProps extends RouteComponentProps {
  definition: LabwareDefinition2 | null
}

export interface DefinitionRouteProps {
  render: (props: DefinitionRouteRenderProps) => React.ReactNode
}

export function DefinitionRoute(props: DefinitionRouteProps): JSX.Element {
  return (
    <Route
      path={`${getPublicPath()}:loadName?`}
      render={routeProps => {
        const { loadName } = routeProps.match.params
        const definition = getDefinition(loadName)

        // TODO(mc, 2019-04-10): handle 404 if loadName exists but definition
        // isn't found

        return props.render({ ...routeProps, definition })
      }}
    />
  )
}
