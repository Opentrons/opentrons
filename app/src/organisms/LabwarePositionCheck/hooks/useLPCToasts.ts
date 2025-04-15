import { useTranslation } from 'react-i18next'

import { SUCCESS_TOAST } from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'

const TOAST_DURATION_MS = 3000

export interface UseLPCToastsResult {
  makeSuccessToast: (lwName: string) => void
}

export function useLPCToasts(): UseLPCToastsResult {
  const { t } = useTranslation('labware_position_check')
  const { makeToast } = useToaster()

  const makeSuccessToast = (lwName: string): void => {
    makeToast(
      t('labware_offsets_saved', { labware: lwName }) as string,
      SUCCESS_TOAST,
      { duration: TOAST_DURATION_MS, closeButton: true }
    )
  }

  return { makeSuccessToast }
}
