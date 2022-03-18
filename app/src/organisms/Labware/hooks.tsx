import { useSelector, useDispatch } from 'react-redux'
import {
  getCustomLabware,
  addCustomLabware,
  getAddLabwareFailure,
  clearAddCustomLabwareFailure,
} from '../../redux/custom-labware'
import { getAllDefinitions } from './helpers/definitions'
import type { Dispatch } from '../../redux/types'
import type { FailedLabwareFile } from '../../redux/custom-labware/types'

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

export function useAddLabware(): () => void {
  const dispatch = useDispatch<Dispatch>()
  const handleAddLabware = (): unknown => dispatch(addCustomLabware())
  return handleAddLabware
}

export function useClearLabwareFailure(): () => void {
  const dispatch = useDispatch<Dispatch>()
  const clearLabwareFailure = (): unknown =>
    dispatch(clearAddCustomLabwareFailure())
  return clearLabwareFailure
}

export function useGetAddLabwareFailure(): FailedLabwareFile | null {
  const labwareFailure = useSelector(getAddLabwareFailure)
  return labwareFailure.file
}
