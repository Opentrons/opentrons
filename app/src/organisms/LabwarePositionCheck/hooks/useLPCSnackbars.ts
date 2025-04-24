import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useToaster } from '/app/organisms/ToasterOven'
import { clearSnackbarStatus } from '/app/redux/protocol-runs'

import type { LPCSnackbarType } from '/app/redux/protocol-runs/types/lpc/ui'

export interface UseLPCSnackbarsResult {
  makeSuccessSnackbar: (status: LPCSnackbarType) => void
  makeHardCodedSnackbar: () => void
}

export function useLPCSnackbars(runId: string): UseLPCSnackbarsResult {
  const { t } = useTranslation('labware_position_check')
  const dispatch = useDispatch()
  const { makeSnackbar } = useToaster()

  const successText = (status: LPCSnackbarType): string | null => {
    switch (status) {
      case 'defaultAdded':
        return t('default_location_offset_added')
      case 'defaultAdjusted':
        return t('default_location_offset_adjusted')
      case 'locationSpecificAdjusted':
        return t('applied_location_offset_adjusted')
      default:
        return null
    }
  }

  const makeSuccessSnackbar = (status: LPCSnackbarType): void => {
    const copy = successText(status)

    if (copy != null) {
      makeSnackbar(copy)
      dispatch(clearSnackbarStatus(runId))
    }
  }

  const makeHardCodedSnackbar = (): void => {
    makeSnackbar(t('modify_hardcoded_offsets_in_protocol') as string)
  }

  return { makeSuccessSnackbar, makeHardCodedSnackbar }
}
