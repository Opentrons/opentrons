import  {type LabwareDefinition2, getAllDefinitions } from '@opentrons/shared-data'


export function getAllDefs(): LabwareDefinition2[] {
  return Object.values(getAllDefinitions())
}
