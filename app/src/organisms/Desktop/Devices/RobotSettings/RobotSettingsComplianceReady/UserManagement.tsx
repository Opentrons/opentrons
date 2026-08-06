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
  useUpdateUserMutation,
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
  onActivate: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDeactivate: (user: AuthUser) => void
}

function UserManagementTable({
  users,
  onEdit,
  onDelete,
  onActivate,
  onResetPassword,
  onDeactivate,
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
            onActivate={onActivate}
            onResetPassword={onResetPassword}
            onDeactivate={onDeactivate}
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
  const { updateUser, isLoading: isDeactivatingUser } =
    useUpdateUserMutation(documentationState)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userToEdit, setUserToEdit] = useState<AuthUser | null>(null)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)
  const [userToActivate, setUserToActivate] = useState<AuthUser | null>(null)
  const [userToResetPassword, setUserToResetPassword] =
    useState<AuthUser | null>(null)
  const [userToDeactivate, setUserToDeactivate] = useState<AuthUser | null>(
    null
  )
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

  const handleActivateConfirm = (): void => {
    if (userToActivate == null) {
      return
    }

    void resetUserPassword(userToActivate.username)
      .then(response => {
        setUserToActivate(null)
        const { temporaryPassword } = response.data
        if (temporaryPassword != null) {
          setResetPasswordTemporaryPassword(temporaryPassword)
        }
      })
      .catch(() => {
        setUserToActivate(null)
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

  const handleDeactivateConfirm = (): void => {
    if (userToDeactivate == null) {
      return
    }

    void updateUser({
      username: userToDeactivate.username,
      request: { data: { locked: true } },
    })
      .then(() => {
        makeToast(
          t('desktop_lock_user_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
        setUserToDeactivate(null)
      })
      .catch(() => {
        setUserToDeactivate(null)
      })
  }

  return (
    <Accordion id="user-management" title={t('desktop_user_management')}>
      <UserManagementTable
        users={users}
        onEdit={setUserToEdit}
        onDelete={setUserToDelete}
        onActivate={setUserToActivate}
        onResetPassword={setUserToResetPassword}
        onDeactivate={setUserToDeactivate}
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
      {userToActivate != null ? (
        <UserAccountConfirmModal
          title={t('desktop_activate_user_modal_title') as string}
          heading={t('desktop_activate_user_modal_heading') as string}
          description={t('desktop_activate_user_modal_description') as string}
          confirmLabel={t('desktop_unlock_user') as string}
          isConfirmDisabled={isResettingPassword}
          onConfirm={handleActivateConfirm}
          onCancel={() => {
            setUserToActivate(null)
          }}
        />
      ) : null}
      {userToDeactivate != null ? (
        <UserAccountConfirmModal
          title={t('desktop_lock_user_modal_title') as string}
          heading={t('desktop_lock_user_modal_heading') as string}
          description={t('desktop_lock_user_modal_description') as string}
          confirmLabel={t('desktop_lock_user') as string}
          isConfirmDisabled={isDeactivatingUser}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => {
            setUserToDeactivate(null)
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
