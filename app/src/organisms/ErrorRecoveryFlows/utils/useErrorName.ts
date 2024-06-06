import { useTranslation } from 'react-i18next'

import type { ErrorKind } from '../types'

// Returns the user-facing name of the errorKind.
export function useErrorName(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    default:
      return t('general_error')
  }
}
