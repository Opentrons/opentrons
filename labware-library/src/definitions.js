// @flow
// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import * as React from 'react'
import { Route } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import uniqBy from 'lodash/uniqBy'
import uniqWith from 'lodash/uniqWith'
import round from 'lodash/round'
import orderBy from 'lodash/orderBy'
import { getPublicPath } from './public-path'

import type { ContextRouter } from 'react-router-dom'
import type {
  LabwareList,
  LabwareWell,
  LabwareWellShapeProperties,
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

let definitions: LabwareList | null = null

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

export function getUniqueWellProperties(
  definition: LabwareDefinition
): Array<LabwareWellGroupProperties> {
  const { groups, wells, dimensions } = definition

  return groups.map(group => {
    const wellProps = orderBy(
      group.wells.map(n => wells[n]),
      ['x', 'y'],
      ['asc', 'desc']
    )
    const wellDepths = wellProps.map<number>(w => w.depth)
    const wellVolumes = wellProps.map<number>(w => w.totalLiquidVolume)
    const wellShapes = wellProps.map<LabwareWellShapeProperties>(
      (well: LabwareWell) =>
        well.shape === 'circular'
          ? { shape: well.shape, diameter: well.diameter }
          : {
              shape: well.shape,
              xDimension: well.xDimension,
              yDimension: well.yDimension,
            }
    )

    const xStart = wellProps[0].x
    const yStart = wellProps[0].y

    return {
      metadata: group.metadata,
      brand: group.brand || null,
      xSpacing: getSpacing(wellProps, 'x'),
      ySpacing: getSpacing(wellProps, 'y'),
      xOffsetFromLeft: xStart,
      yOffsetFromTop: dimensions.yDimension - yStart,
      wellCount: wellProps.length,
      depth: getIfConsistent(wellDepths),
      totalLiquidVolume: getIfConsistent(wellVolumes),
      shape: getIfConsistent(wellShapes),
    }
  })
}

function getIfConsistent<T>(items: Array<T>): T | null {
  return uniqWith(items, isEqual).length === 1 ? items[0] : null
}

function getSpacing(wells: Array<LabwareWell>, axis: 'x' | 'y'): number | null {
  return uniqBy<LabwareWell>(wells, axis).reduce<number | null>(
    (spacing, well, index, uniqueWells) => {
      if (index > 0) {
        const prev = uniqueWells[index - 1]
        const currentSpacing = Math.abs(round(well[axis] - prev[axis], 2))

        return spacing === 0 || spacing === currentSpacing
          ? currentSpacing
          : null
      }
      return spacing
    },
    0
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
