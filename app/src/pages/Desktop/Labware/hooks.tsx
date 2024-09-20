import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  getAddLabwareFailure,
  clearAddCustomLabwareFailure,
  getAddNewLabwareName,
  clearNewLabwareName,
} from '/app/redux/custom-labware'
import type { Dispatch } from '/app/redux/types'

export function useLabwareFailure(): {
  labwareFailureMessage: string | null
  clearLabwareFailure: () => unknown
} {
  const { t } = useTranslation(['labware_landing', 'branded'])
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
      errorMessage = t('branded:opentrons_labware_def')
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
