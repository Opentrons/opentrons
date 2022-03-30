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
