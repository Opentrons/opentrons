// @flow
// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import * as React from 'react'
import { Route } from 'react-router-dom'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import {
  LABWAREV2_DO_NOT_LIST,
  type LabwareDefinition2,
} from '@opentrons/shared-data'
import { getPublicPath } from './public-path'

import type { ContextRouter } from 'react-router-dom'
import type { LabwareList, LabwareDefinition } from './types'

// require all definitions in the labware/definitions/2 directory
// require.context is webpack-specific method
const definitionsContext = (require: any).context(
  '@opentrons/shared-data/labware/definitions/2',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

const getOnlyLatestDefs = (labwareList: LabwareList): LabwareList => {
  // group by namespace + loadName
  const labwareDefGroups: {
    [groupKey: string]: Array<LabwareDefinition2>,
  } = groupBy(labwareList, d => `${d.namespace}/${d.parameters.loadName}`)

  return Object.keys(labwareDefGroups).map((groupKey: string) => {
    const group = labwareDefGroups[groupKey]
    const allVersions = group.map(d => d.version)
    const highestVersionNum = Math.max(...allVersions)
    const resultIdx = group.findIndex(d => d.version === highestVersionNum)
    return group[resultIdx]
  })
}

function _getAllDefs(): Array<LabwareDefinition2> {
  return definitionsContext.keys().map(name => definitionsContext(name))
}

let allLoadNames: Array<string> | null = null
// ALL unique load names, not just the allowed ones
export function getAllLoadNames(): Array<string> {
  if (!allLoadNames) {
    allLoadNames = uniq(_getAllDefs().map(def => def.parameters.loadName))
  }
  return allLoadNames
}

let allDisplayNames: Array<string> | null = null
// ALL unique display names, not just the allowed ones
export function getAllDisplayNames(): Array<string> {
  if (!allDisplayNames) {
    allDisplayNames = uniq(_getAllDefs().map(def => def.metadata.displayName))
  }
  return allDisplayNames
}

let definitions: LabwareList | null = null

export function getAllDefinitions(): LabwareList {
  if (!definitions) {
    const allDefs = _getAllDefs().filter(
      (d: LabwareDefinition2) =>
        LABWAREV2_DO_NOT_LIST.indexOf(d.parameters.loadName) === -1
    )
    definitions = getOnlyLatestDefs(allDefs)
  }

  return definitions
}

export function getDefinition(loadName: ?string): LabwareDefinition | null {
  const def = getAllDefinitions().find(d => d.parameters.loadName === loadName)
  return def || null
}

export type DefinitionRouteRenderProps = {|
  ...ContextRouter,
  definition: LabwareDefinition | null,
|}

export type DefinitionRouteProps = {
  render: (props: DefinitionRouteRenderProps) => React.Node,
}

export function DefinitionRoute(props: DefinitionRouteProps): React.Node {
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
