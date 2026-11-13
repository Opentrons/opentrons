import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { WARNING_TOAST, Z_INDEX } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'

export interface InsufficientPermissionsToast {
  popToast: () => void
  eatToast: () => void
}

/**
 * Shows at most one "Additional permissions required" toast at a time.
 */
export function useInsufficientPermissionsToast(): InsufficientPermissionsToast {
  const { t, i18n } = useTranslation(['access_control', 'shared'])
  const { makeToast, eatToast: eatToasterToast } = useToaster()
  const toastIdRef = useRef<string | null>(null)

  const eatToast = useCallback((): void => {
    if (toastIdRef.current != null) {
      eatToasterToast(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [eatToasterToast])

  const popToast = useCallback((): void => {
    eatToast()
    toastIdRef.current = makeToast(
      '' + t('additional_permissions_required_description'),
      WARNING_TOAST,
      {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
        heading: '' + t('additional_permissions_required'),
        zIndex: Z_INDEX.LOGIN_TOASTS,
      }
    )
  }, [eatToast, i18n, makeToast, t])

  return { popToast, eatToast }
}
