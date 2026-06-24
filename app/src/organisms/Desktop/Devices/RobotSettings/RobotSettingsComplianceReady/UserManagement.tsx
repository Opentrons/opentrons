import { useTranslation } from 'react-i18next'

import { Accordion } from './Accordion'

import type { JSX } from 'react'

export function UserManagement(): JSX.Element {
  const { t } = useTranslation('device_settings')

  return <Accordion id="user-management" title={t('desktop_user_management')} />
}
