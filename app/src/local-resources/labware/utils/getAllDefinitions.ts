import groupBy from 'lodash/groupBy'

import {
  getAllDefinitions,
  LABWAREV2_DO_NOT_LIST,
} from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

const getOnlyLatestDefs = (
  labwareList: LabwareDefinition[]
): LabwareDefinition[] => {
  // group by namespace + loadName
  const labwareDefGroups: {
    [groupKey: string]: LabwareDefinition[]
  } = groupBy<LabwareDefinition>(
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

export function getAllLatestDefs(): LabwareDefinition[] {
  const allDefs = Object.values(getAllDefinitions(LABWAREV2_DO_NOT_LIST))
  const definitions = getOnlyLatestDefs(allDefs)

  return definitions
}
