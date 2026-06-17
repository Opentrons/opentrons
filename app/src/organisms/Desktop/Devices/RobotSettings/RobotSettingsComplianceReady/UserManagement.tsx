import { useTranslation } from 'react-i18next'

import { ListAccordion, StyledText } from '@opentrons/components'

import styles from './usermanagement.module.css'

import type { JSX } from 'react'

export interface UserManagementProps {
  robotName: string
}

export function UserManagement({
  robotName: _robotName,
}: UserManagementProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return (
    <div className={styles.accordion}>
      <ListAccordion
        alertKind="default"
        headerChild={
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            className={styles.header_text}
          >
            {t('desktop_user_management')}
          </StyledText>
        }
        tableHeaders={[
          t('desktop_username'),
          t('desktop_legal_name'),
          t('desktop_account_type'),
        ]}
      >
        {null}
      </ListAccordion>
    </div>
  )
}
