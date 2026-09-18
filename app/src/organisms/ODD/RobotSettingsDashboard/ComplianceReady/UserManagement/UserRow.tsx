import { useTranslation } from 'react-i18next'

import { Icon, ListButton, StyledText } from '@opentrons/components'

import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'
import type { AuthUser } from '@opentrons/api-client'

export function UserRow({
  key,
  user,
  onClick,
}: {
  key: string
  user: AuthUser
  onClick: () => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  return (
    <ListButton
      key={key}
      type="noActive"
      onClick={onClick}
      className={styles.user_row_button}
    >
      <div className={styles.user_row_content}>
        <div className={styles.user_row_details}>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.user_row_text}
          >
            {user.username}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.user_row_text}
          >
            {user.fullName}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.user_row_text}
          >
            {t(`odd_user_account_type_${user.accountType}`)}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.user_row_locked_status}
          >
            {user.locked ? t('locked') : t('active')}
          </StyledText>
        </div>
        <Icon name="chevron-right" className={styles.user_row_chevron} />
      </div>
    </ListButton>
  )
}
