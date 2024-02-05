// labware definition helpers
// TODO(mc, 2019-03-18): move to shared-data?
import * as React from 'react'
import { Route } from 'react-router-dom'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import {
  LABWAREV2_DO_NOT_LIST,
  getAllDefinitions as _getAllDefinitions,
} from '@opentrons/shared-data'
import { getPublicPath } from './public-path'

import type { RouteComponentProps } from 'react-router-dom'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareList, LabwareDefinition } from './types'

const getOnlyLatestDefs = (labwareList: LabwareList): LabwareList => {
  // group by namespace + loadName
  const labwareDefGroups: {
    [groupKey: string]: LabwareDefinition2[]
  } = groupBy<LabwareDefinition2>(
    labwareList,
    d => `${d.namespace}/${d.parameters.loadName}`
  )

  return Object.keys(labwareDefGroups).map((groupKey: string) => {
    const group = labwareDefGroups[groupKey]
    const allVersions = group.map(d => d.version)
    const highestVersionNum = Math.max(...allVersions)
    const resultIdx = group.findIndex(d => d.version === highestVersionNum)
    return group[resultIdx]
  })
}

function _getAllDefs(): LabwareDefinition2[] {
  return Object.values(_getAllDefinitions())
}

let allLoadNames: string[] | null = null
// ALL unique load names, not just the allowed ones
export function getAllLoadNames(): string[] {
  if (!allLoadNames) {
    allLoadNames = uniq(_getAllDefs().map(def => def.parameters.loadName))
  }
  return allLoadNames
}

let allDisplayNames: string[] | null = null
// ALL unique display names, not just the allowed ones
export function getAllDisplayNames(): string[] {
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
        // eslint-disable-next-line @typescript-eslint/prefer-includes
        LABWAREV2_DO_NOT_LIST.indexOf(d.parameters.loadName) === -1
    )
    definitions = getOnlyLatestDefs(allDefs)
  }

  return definitions
}

export function getDefinition(
  loadName: string | null | undefined
): LabwareDefinition | null {
  const def = getAllDefinitions().find(d => d.parameters.loadName === loadName)
  return def || null
}

export interface DefinitionRouteRenderProps extends RouteComponentProps {
  definition: LabwareDefinition | null
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

export const NEW_LABWARE_DEFS = [
  'thermoscientificnunc_96_wellplate_1300ul',
  'thermoscientificnunc_96_wellplate_2000ul',
  'appliedbiosystemsmicroamp_384_wellplate_40ul',
  'biorad_384_wellplate_50ul',
]

export function isNewLabware(definition: LabwareDefinition): boolean {
  const { loadName } = definition.parameters
  return NEW_LABWARE_DEFS.includes(loadName)
}
