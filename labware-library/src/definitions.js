// @flow
// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import * as React from 'react'
import { Route } from 'react-router-dom'
import find from 'lodash/find'
import flatten from 'lodash/flatten'
import round from 'lodash/round'
import { getPublicPath } from './public-path'

import type { ContextRouter } from 'react-router-dom'
import type {
  LabwareList,
  LabwareWellGroupProperties,
  LabwareDefinition,
} from './types'

// require all definitions in the definitions2 directory
// require.context is webpack-specific method
const definitionsContext = (require: any).context(
  '@opentrons/shared-data/definitions2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

let definitions = null

export function getAllDefinitions(): LabwareList {
  // TODO(mc, 2019-03-28): revisit decision to hide trash labware
  if (!definitions) {
    definitions = definitionsContext
      .keys()
      .map(name => definitionsContext(name))
      .filter(d => d.metadata.displayCategory !== 'trash')
  }

  return definitions
}

export function getDefinition(loadName: ?string): LabwareDefinition | null {
  const def = getAllDefinitions().find(d => d.parameters.loadName === loadName)
  return def || null
}

// TODO(mc, 2019-03-21): move to shared data
export function getUniqueWellProperties(
  definition: LabwareDefinition
): Array<LabwareWellGroupProperties> {
  const { ordering, wells } = definition

  return flatten(ordering).reduce(
    (groups: Array<LabwareWellGroupProperties>, k: string) => {
      const { x, y, z, ...props } = wells[k]
      const groupBase = { xOffset: x, yOffset: y, xSpacing: 0, ySpacing: 0 }
      let group: ?LabwareWellGroupProperties = find(groups, props)

      // these ifs are overly specific and duplicated to make flow happy
      if (!group && props.shape === 'circular') {
        group = { ...props, ...groupBase }
        groups.push(group)
      } else if (!group && props.shape === 'rectangular') {
        group = { ...props, ...groupBase }
        groups.push(group)
      }

      if (group) {
        if (!group.xSpacing && y === group.yOffset) {
          // we've hit the first well in ordering that matches the group's
          // starting well's y position, so use its x position to set spacing
          group.xSpacing = round(x - group.xOffset, 2)
        } else if (!group.ySpacing && x === group.xOffset) {
          // same as above, but for the y spacing
          group.ySpacing = round(group.yOffset - y, 2)
        }
      }

      return groups
    },
    []
  )
}

export type DefinitionRouteRenderProps = {|
  ...ContextRouter,
  definition: LabwareDefinition | null,
|}

export type DefinitionRouteProps = {
  render: (props: DefinitionRouteRenderProps) => React.Node,
}

export function DefinitionRoute(props: DefinitionRouteProps) {
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
