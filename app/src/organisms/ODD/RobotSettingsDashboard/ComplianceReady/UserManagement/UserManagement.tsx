import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ChildNavigation } from '../../../ChildNavigation'
import { CreateUserFlow } from './CreateUserFlow'
import styles from './user_management_settings.module.css'
import { UserRow } from './UserRow'

import type { ReactNode } from 'react'
import type { AuthUser } from '@opentrons/api-client'

export function UserManagement({
  onClickBack,
  users,
}: {
  onClickBack: () => void
  users: AuthUser[]
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [createUser, setCreateUser] = useState<boolean>(false)

  const handleCreateUser = (): void => {
    setCreateUser(true)
  }

  const usernames = useMemo(() => {
    return users.map(user => user.username)
  }, [users])

  if (createUser) {
    return (
      <CreateUserFlow
        onCancel={() => {
          setCreateUser(false)
        }}
        usernames={usernames}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_user_management_title')}
        onClickBack={onClickBack}
        onClickButton={handleCreateUser}
        buttonText={t('odd_create_user_button')}
        buttonType="primary"
      />
      <div className={styles.content}>
        <div className={styles.users_list}>
          <div className={styles.users_list_header}>
            <StyledText
              oddStyle="bodyTextSemiBold"
              className={styles.users_list_header_text}
            >
              {t('odd_header_username')}
            </StyledText>
            <StyledText
              oddStyle="bodyTextSemiBold"
              className={styles.users_list_header_text}
            >
              {t('odd_header_full_name')}
            </StyledText>
            <StyledText
              oddStyle="bodyTextSemiBold"
              className={styles.users_list_header_text}
            >
              {t('odd_header_role')}
            </StyledText>
            <StyledText
              oddStyle="bodyTextSemiBold"
              className={styles.users_list_header_text}
            >
              {t('odd_header_status')}
            </StyledText>
          </div>
          {users.map(user => (
            <UserRow key={user.username} user={user} onClick={() => {}} />
          ))}
        </div>
      </div>
    </div>
  )
}
