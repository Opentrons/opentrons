import { useTranslation } from 'react-i18next'

import type { ErrorKind } from '../types'

// The generalized error message shown to the user in select locations.
export function useErrorMessage(errorKind: ErrorKind): string {
  const { t } = useTranslation('error_recovery')

  switch (errorKind) {
    default:
      return t('general_error_message')
  }
}
