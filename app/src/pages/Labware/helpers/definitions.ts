import groupBy from 'lodash/groupBy'
import { LABWAREV2_DO_NOT_LIST } from '@opentrons/shared-data'
import { getAllDefs } from './getAllDefs'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

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

export function getAllDefinitions(): LabwareDefinition2[] {
  const allDefs = getAllDefs().filter(
    (d: LabwareDefinition2) =>
      // eslint-disable-next-line @typescript-eslint/prefer-includes
      LABWAREV2_DO_NOT_LIST.indexOf(d.parameters.loadName) === -1
  )
  const definitions = getOnlyLatestDefs(allDefs)

  return definitions
}
