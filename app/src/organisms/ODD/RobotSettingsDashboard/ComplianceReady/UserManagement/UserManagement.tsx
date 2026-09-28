import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-up-the-tree-of-life
import { Account } from '/app/pages/ODD/Account'
import { useEditAccountHandlers } from '/app/resources/auth/hooks/useEditAccountHandlers'
import { usePasswordComplexity } from '/app/resources/auth/hooks/usePasswordComplexity'

import { ChildNavigation } from '../../../ChildNavigation'
import { CreateUserFlow } from './CreateUserFlow'
import styles from './user_management_settings.module.css'
import { UserRow } from './UserRow'

import type { ReactNode } from 'react'
import type { AuthUser, AuthUserResponse } from '@opentrons/api-client'

export function UserManagement({
  onClickBack,
  users,
  loggedInUser,
}: {
  onClickBack: () => void
  users: AuthUser[]
  loggedInUser: string
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [createUser, setCreateUser] = useState<boolean>(false)
  const [editUser, setEditUser] = useState<string | null>(null)
  const editAccountHandlers = useEditAccountHandlers({
    onNewUsername: (response: AuthUserResponse) => {
      setEditUser(response.data.username)
    },
  })

  const currentUserInfo = useMemo(
    () => users.find(user => user.username === editUser),
    [users, editUser]
  )

  const handleCreateUser = (): void => {
    setCreateUser(true)
  }

  const usernames = useMemo(() => {
    return users.map(user => user.username)
  }, [users])

  const { passwordComplexity } = usePasswordComplexity()

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

  if (editUser && currentUserInfo) {
    return (
      <Account
        onBack={() => {
          setEditUser(null)
        }}
        usernames={usernames}
        passwordComplexity={passwordComplexity}
        {...currentUserInfo}
        {...editAccountHandlers(editUser)}
        adminView={editUser !== loggedInUser}
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
            <UserRow
              key={user.username}
              user={user}
              onClick={() => {
                setEditUser(user.username)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
