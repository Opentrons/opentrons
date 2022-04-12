import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  getCustomLabware,
  getAddLabwareFailure,
  clearAddCustomLabwareFailure,
  getAddNewLabwareName,
  clearNewLabwareName,
} from '../../redux/custom-labware'
import { getAllDefinitions } from './helpers/definitions'
import type { Dispatch } from '../../redux/types'

import type { LabwareDefinition2 as LabwareDefinition } from '@opentrons/shared-data'

export interface LabwareDefAndDate {
  definition: LabwareDefinition
  modified?: number
  filename?: string
}

export function useGetAllLabware(
  sortBy: 'alphabetical' | 'reverse',
  filterBy:
    | 'all'
    | 'wellPlate'
    | 'tipRack'
    | 'tubeRack'
    | 'reservoir'
    | 'aluminumBlock'
): LabwareDefAndDate[] {
  const fullLabwareList: LabwareDefAndDate[] = []
  const labwareDefinitions = getAllDefinitions()
  labwareDefinitions.map(def => fullLabwareList.push({ definition: def }))
  const customLabwareList = useSelector(getCustomLabware)

  customLabwareList.map(customLabware =>
    'definition' in customLabware
      ? fullLabwareList.push({
          modified: customLabware.modified,
          definition: customLabware.definition,
          filename: customLabware.filename,
        })
      : null
  )
  fullLabwareList.sort(function (a, b) {
    if (a.definition.metadata.displayName < b.definition.metadata.displayName) {
      return sortBy === 'alphabetical' ? -1 : 1
    }
    if (a.definition.metadata.displayName > b.definition.metadata.displayName) {
      return sortBy === 'alphabetical' ? 1 : -1
    }
    return 0
  })
  if (filterBy !== 'all') {
    return fullLabwareList.filter(
      labwareItem =>
        labwareItem.definition.metadata.displayCategory === filterBy
    )
  }
  return fullLabwareList
}

export function useLabwareFailure(): {
  labwareFailureMessage: string | null
  clearLabwareFailure: () => unknown
} {
  const { t } = useTranslation('labware_landing')
  const dispatch = useDispatch<Dispatch>()
  const labwareFailure = useSelector(getAddLabwareFailure)

  let labwareFailureMessage = null
  if (labwareFailure.file != null || labwareFailure.errorMessage != null) {
    const failedFile = labwareFailure.file
    let errorMessage = t('unable_to_upload')
    if (failedFile?.type === 'INVALID_LABWARE_FILE') {
      errorMessage = t('invalid_labware_def')
    } else if (failedFile?.type === 'DUPLICATE_LABWARE_FILE') {
      errorMessage = t('duplicate_labware_def')
    } else if (failedFile?.type === 'OPENTRONS_LABWARE_FILE') {
      errorMessage = t('opentrons_labware_def')
    }
    labwareFailureMessage =
      failedFile != null
        ? `${t('error_importing_file', {
            filename: failedFile.filename,
          })} ${errorMessage}`
        : errorMessage
  }
  const clearLabwareFailure = (): unknown =>
    dispatch(clearAddCustomLabwareFailure())

  return { labwareFailureMessage, clearLabwareFailure }
}

export function useNewLabwareName(): {
  newLabwareName: string | null
  clearLabwareName: () => unknown
} {
  const dispatch = useDispatch<Dispatch>()
  const newLabwareName = useSelector(getAddNewLabwareName).filename
  const clearLabwareName = (): unknown => dispatch(clearNewLabwareName())

  return { newLabwareName, clearLabwareName }
}

export function useCloseOnOutsideClick(
  ref: React.RefObject<HTMLInputElement>,
  onClose: () => void
): void {
  const handleClick = (e: MouseEvent): void => {
    // @ts-expect-error node and event target types are mismatched
    if (ref.current != null && !ref.current.contains(e.target)) {
      onClose()
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  })
}
