import groupBy from 'lodash/groupBy'

import { LABWAREV2_DO_NOT_LIST } from '@opentrons/shared-data'

import { getAllDefs } from './getAllDefs'

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

export function getAllDefinitions(): LabwareDefinition[] {
  const allDefs = getAllDefs().filter(
    (d: LabwareDefinition) =>
      // eslint-disable-next-line @typescript-eslint/prefer-includes
      LABWAREV2_DO_NOT_LIST.indexOf(d.parameters.loadName) === -1
  )
  const definitions = getOnlyLatestDefs(allDefs)

  return definitions
}
