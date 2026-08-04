import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  EmptySelectorButton,
  StyledText,
  SUCCESS_TOAST,
} from '@opentrons/components'
import { useUsersQuery } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { useUsernameForRobot } from '/app/redux/robot-auth'

import { Accordion } from './Accordion'
import { AddUserModal } from './AddUserModal'
import styles from './usermanagement.module.css'

import type { JSX } from 'react'
import type { AuthUser, AuthUserAccountType } from '@opentrons/api-client'

const ROLE_LABEL_KEYS: Record<AuthUserAccountType, string> = {
  admin: 'desktop_user_role_admin',
  user: 'desktop_user_role_user',
  auditor: 'desktop_user_role_auditor',
  service: 'desktop_user_role_service',
}

export interface UserManagementProps {
  robotName: string
}

interface UserManagementTableProps {
  users: AuthUser[]
}

function UserManagementTable({ users }: UserManagementTableProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.header_cell}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('desktop_username')}
            </StyledText>
          </th>
          <th className={styles.header_cell}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('desktop_legal_name')}
            </StyledText>
          </th>
          <th className={styles.header_cell}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('desktop_role')}
            </StyledText>
          </th>
          <th className={styles.header_cell}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('desktop_status')}
            </StyledText>
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.username}>
            <td className={styles.body_cell}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.body_cell_text}
              >
                {user.username}
              </StyledText>
            </td>
            <td className={styles.body_cell}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.body_cell_text}
              >
                {user.fullName}
              </StyledText>
            </td>
            <td className={styles.body_cell}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.body_cell_text}
              >
                {t(ROLE_LABEL_KEYS[user.accountType])}
              </StyledText>
            </td>
            <td className={styles.body_cell}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.body_cell_text}
              >
                {user.locked
                  ? t('desktop_user_status_locked')
                  : t('desktop_user_status_active')}
              </StyledText>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function UserManagement({
  robotName,
}: UserManagementProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const username = useUsernameForRobot(robotName)
  const usersQuery = useUsersQuery({ enabled: username != null })
  const users = usersQuery?.data?.data ?? []
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const { makeToast } = useToaster()

  return (
    <Accordion id="user-management" title={t('desktop_user_management')}>
      <UserManagementTable users={users} />
      <div className={styles.add_user_button}>
        <EmptySelectorButton
          iconName="plus"
          onClick={() => {
            setShowAddUserModal(true)
          }}
          text={t('desktop_add_user')}
          textAlignment="left"
        />
      </div>
      {showAddUserModal ? (
        <AddUserModal
          robotName={robotName}
          onUserCreated={() => {
            makeToast(
              t('desktop_add_user_created_banner') as string,
              SUCCESS_TOAST,
              { closeButton: true }
            )
          }}
          onClose={() => {
            setShowAddUserModal(false)
          }}
        />
      ) : null}
    </Accordion>
  )
}
