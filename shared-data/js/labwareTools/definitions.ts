import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import { LABWAREV2_DO_NOT_LIST } from '../getLabware'
import type { LabwareDefinition2 } from '../types'
import { getAllDefs } from './getAllDefs'

const getOnlyLatestDefs = (
  labwareList: LabwareDefinition2[]
): LabwareDefinition2[] => {
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

let allLoadNames: string[] | null = null
// ALL unique load names, not just the allowed ones
export function getAllLoadNames(): string[] {
  if (!allLoadNames) {
    allLoadNames = uniq(getAllDefs().map(def => def.parameters.loadName))
  }
  return allLoadNames
}

let allDisplayNames: string[] | null = null
// ALL unique display names, not just the allowed ones
export function getAllDisplayNames(): string[] {
  if (!allDisplayNames) {
    allDisplayNames = uniq(getAllDefs().map(def => def.metadata.displayName))
  }
  return allDisplayNames
}

let definitions: LabwareDefinition2[] | null = null

export function getAllDefinitions(): LabwareDefinition2[] {
  if (!definitions) {
    const allDefs = getAllDefs().filter(
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
): LabwareDefinition2 | null {
  const def = getAllDefinitions().find(d => d.parameters.loadName === loadName)
  return def || null
}
