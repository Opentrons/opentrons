import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  EmptySelectorButton,
  StyledText,
  SUCCESS_TOAST,
} from '@opentrons/components'
import {
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { useUsernameForRobot } from '/app/redux/robot-auth'

import { Accordion } from './Accordion'
import { AddUserModal } from './AddUserModal'
import { EditUserModal } from './EditUserModal'
import { OneTimePasswordModal } from './userAccount/OneTimePasswordModal'
import { UserAccountConfirmModal } from './userAccount/UserAccountConfirmModal'
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
  onResetPassword: (user: AuthUser) => void
}

function UserManagementTable({
  users,
  onEdit,
  onDelete,
  onResetPassword,
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
            onResetPassword={onResetPassword}
          />
        ))}
      </tbody>
    </table>
  )
}

export function UserManagement({
  robotName,
}: UserManagementProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const username = useUsernameForRobot(robotName)
  const usersQuery = useUsersQuery({ enabled: username != null })
  const users = usersQuery?.data?.data ?? []
  const documentationState = useDocumentationState(undefined, robotName)
  const { deleteUser } = useDeleteUserMutation(documentationState)
  const { resetUserPassword, isLoading: isResettingPassword } =
    useResetUserPasswordMutation(documentationState)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)
  const [userToResetPassword, setUserToResetPassword] =
    useState<AuthUser | null>(null)
  const [resetPasswordTemporaryPassword, setResetPasswordTemporaryPassword] =
    useState<string | null>(null)
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

  const handleResetPasswordConfirm = (): void => {
    if (userToResetPassword == null) {
      return
    }

    void resetUserPassword(userToResetPassword.username)
      .then(response => {
        const { temporaryPassword } = response.data
        if (temporaryPassword != null) {
          setResetPasswordTemporaryPassword(temporaryPassword)
        } else {
          setUserToResetPassword(null)
        }
      })
      .catch(() => {
        setUserToResetPassword(null)
      })
  }

  const handleResetPasswordDone = (): void => {
    makeToast(
      t('desktop_reset_password_success_banner') as string,
      SUCCESS_TOAST,
      { closeButton: true }
    )
    setResetPasswordTemporaryPassword(null)
    setUserToResetPassword(null)
  }

  const handleResetPasswordCancel = (): void => {
    setResetPasswordTemporaryPassword(null)
    setUserToResetPassword(null)
  }

  return (
    <Accordion id="user-management" title={t('desktop_user_management')}>
      <UserManagementTable
        users={users}
        onEdit={setUserToEdit}
        onDelete={setUserToDelete}
        onResetPassword={setUserToResetPassword}
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
        <UserAccountConfirmModal
          title={t('desktop_delete_user_modal_title') as string}
          heading={t('desktop_delete_user_modal_heading') as string}
          description={t('desktop_delete_user_modal_description') as string}
          confirmLabel={t('shared:delete') as string}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setUserToDelete(null)
          }}
        />
      ) : null}
      {userToResetPassword != null && resetPasswordTemporaryPassword == null ? (
        <UserAccountConfirmModal
          title={t('desktop_reset_password') as string}
          heading={t('desktop_reset_password_modal_heading') as string}
          description={t('desktop_reset_password_modal_description') as string}
          confirmLabel={t('desktop_reset_password') as string}
          isConfirmDisabled={isResettingPassword}
          onConfirm={handleResetPasswordConfirm}
          onCancel={handleResetPasswordCancel}
        />
      ) : null}
      {resetPasswordTemporaryPassword != null ? (
        <OneTimePasswordModal
          password={resetPasswordTemporaryPassword}
          message={t('desktop_add_user_success_message') as string}
          onConfirm={handleResetPasswordDone}
          onClose={handleResetPasswordCancel}
        />
      ) : null}
    </Accordion>
  )
}
