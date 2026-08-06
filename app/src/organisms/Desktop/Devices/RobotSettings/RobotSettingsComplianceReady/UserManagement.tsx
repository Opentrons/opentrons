import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  EmptySelectorButton,
  StyledText,
  SUCCESS_TOAST,
} from '@opentrons/components'
import {
  useDeleteUserMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { useUsernameForRobot } from '/app/redux/robot-auth'

import { Accordion } from './Accordion'
import { AddUserModal } from './AddUserModal'
import { DeleteUserConfirmModal } from './DeleteUserConfirmModal'
import { EditUserModal } from './EditUserModal'
import styles from './usermanagement.module.css'
import { UserManagementTableRow } from './UserManagementTableRow'

import type { JSX } from 'react'
import type { AuthUser } from '@opentrons/api-client'

export interface UserManagementProps {
  robotName: string
}

interface UserManagementTableProps {
  users: AuthUser[]
  onEdit: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

function UserManagementTable({
  users,
  onEdit,
  onDelete,
}: UserManagementTableProps): JSX.Element {
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
          <th className={styles.header_cell} aria-hidden />
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <UserManagementTableRow
            key={user.username}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
          />
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
  const documentationState = useDocumentationState(undefined, robotName)
  const { deleteUser } = useDeleteUserMutation(documentationState)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)
  const { makeToast } = useToaster()

  const handleDeleteConfirm = (): void => {
    if (userToDelete == null) {
      return
    }

    void deleteUser(userToDelete.username)
      .then(() => {
        makeToast(
          t('desktop_delete_user_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
        setUserToDelete(null)
      })
      .catch(() => {
        setUserToDelete(null)
      })
  }

  return (
    <Accordion id="user-management" title={t('desktop_user_management')}>
      <UserManagementTable
        users={users}
        onEdit={setUserToEdit}
        onDelete={setUserToDelete}
      />
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
      {userToEdit != null ? (
        <EditUserModal
          robotName={robotName}
          user={userToEdit}
          onUserUpdated={() => {
            makeToast(
              t('desktop_edit_user_success_banner') as string,
              SUCCESS_TOAST,
              { closeButton: true }
            )
          }}
          onClose={() => {
            setUserToEdit(null)
          }}
        />
      ) : null}
      {userToDelete != null ? (
        <DeleteUserConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setUserToDelete(null)
          }}
        />
      ) : null}
    </Accordion>
  )
}
