import { useSelector } from 'react-redux'
import { getAllDefinitions } from '@opentrons/shared-data'
import {
  getCustomLabware,
} from '../../redux/custom-labware'

import type { LabwareDefinition2 as LabwareDefiniton } from '@opentrons/shared-data'


export interface LabwareDefAndDate {
  definition: LabwareDefiniton
  modified?: number
}

export function useGetAllLabware(): LabwareDefAndDate[] {
  const fullLabwareList: LabwareDefAndDate[] = []
  const labwareDefinitons = getAllDefinitions()
  labwareDefinitons.map(def => fullLabwareList.push({ definition: def }))
  const customLabwareList = useSelector(getCustomLabware)

  customLabwareList.map(customLabware =>
    'definition' in customLabware
      ? fullLabwareList.push({
          modified: customLabware.modified,
          definition: customLabware.definition,
        })
      : null
  )

  return fullLabwareList
}
