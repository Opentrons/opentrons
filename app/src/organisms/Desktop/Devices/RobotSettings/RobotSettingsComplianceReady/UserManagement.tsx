import { useTranslation } from 'react-i18next'

import { Accordion } from '/app/molecules/Accordion'

import type { JSX } from 'react'

export interface UserManagementProps {
  robotName: string
}

export function UserManagement({
  robotName: _robotName,
}: UserManagementProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return <Accordion title={t('desktop_user_management')} />
}
