import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

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
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { logOut, useUsernameForRobot } from '/app/redux/robot-auth'

import { Accordion } from '../Accordion'
import { SettingsConfirmationModal } from '../SettingsConfirmationModal'
import { OneTimePasswordModal } from '../userAccount/OneTimePasswordModal'
import { AddUserModal } from './AddUserModal'
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
  onActivate: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDeactivate: (user: AuthUser) => void
}

const USER_REFETCH_TIME = 10000

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
    <div className={styles.list}>
      <div className={styles.header_row}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('username')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('legal_name')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('role')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('status')}
        </StyledText>
        <span className={styles.overflow_cell_inner} aria-hidden />
      </div>
      <div className={styles.rows}>
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
      </div>
    </div>
  )
}

export function UserManagement({
  robotName,
}: UserManagementProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const dispatch = useDispatch()
  const username = useUsernameForRobot(robotName)
  const usersQuery = useUsersQuery({
    enabled: username != null,
    refetchInterval: USER_REFETCH_TIME,
  })
  const users = usersQuery?.data?.data ?? []

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

  const documentationState = useDocumentationState(undefined, robotName)
  const { documentationState: linkedDocumentationState } =
    useLinkedDocumentationState(
      ['unlock_user', 'reset_user_password'],
      userToActivate?.username ?? null
    )

  const { deleteUser } = useDeleteUserMutation(documentationState)
  const { resetUserPassword, isLoading: isResettingPassword } =
    useResetUserPasswordMutation(documentationState)
  const { updateUser, isLoading: isUpdatingUser } =
    useUpdateUserMutation(documentationState)

  const {
    resetUserPassword: resetPasswordAfterUnlock,
    isLoading: isResettingPasswordAfterUnlock,
  } = useResetUserPasswordMutation(linkedDocumentationState)
  const { updateUser: unlockUser, isLoading: isUnlockingUser } =
    useUpdateUserMutation(linkedDocumentationState)

  const { makeToast } = useToaster()

  const handleDeleteConfirm = (): void => {
    if (userToDelete == null) {
      return
    }

    const deletedUsername = userToDelete.username

    void deleteUser(deletedUsername)
      .then(() => {
        makeToast(
          t('delete_user_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
        setUserToDelete(null)
        if (username === deletedUsername) {
          dispatch(logOut({ robotName }))
        }
      })
      .catch(() => {
        setUserToDelete(null)
      })
  }

  const handleActivateConfirm = (): void => {
    if (userToActivate == null) {
      return
    }

    const { username } = userToActivate

    void unlockUser({
      username,
      request: { data: { locked: false } },
    })
      .then(() => resetPasswordAfterUnlock(username))
      .then(response => {
        setUserToActivate(null)
        makeToast(
          t('activate_user_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
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

    const resetUsername = userToResetPassword.username

    void resetUserPassword(resetUsername)
      .then(response => {
        makeToast(
          t('reset_password_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
        const { temporaryPassword } = response.data
        if (temporaryPassword != null) {
          setResetPasswordTemporaryPassword(temporaryPassword)
        } else {
          setUserToResetPassword(null)
        }
        if (username === resetUsername) {
          dispatch(logOut({ robotName }))
        }
      })
      .catch(() => {
        setUserToResetPassword(null)
      })
  }

  const handleResetPasswordCancel = (): void => {
    setResetPasswordTemporaryPassword(null)
    setUserToResetPassword(null)
  }

  const handleDeactivateConfirm = (): void => {
    if (userToDeactivate == null) {
      return
    }

    const lockedUsername = userToDeactivate.username

    void updateUser({
      username: lockedUsername,
      request: { data: { locked: true } },
    })
      .then(() => {
        makeToast(
          t('lock_user_success_banner') as string,
          SUCCESS_TOAST,
          { closeButton: true }
        )
        setUserToDeactivate(null)
        if (username === lockedUsername) {
          dispatch(logOut({ robotName }))
        }
      })
      .catch(() => {
        setUserToDeactivate(null)
      })
  }

  return (
    <Accordion id="user-management" title={t('user_management')}>
      <div className={styles.content}>
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
            text={t('add_user')}
            textAlignment="left"
          />
        </div>
      </div>
      {showAddUserModal ? (
        <AddUserModal
          robotName={robotName}
          onUserCreated={() => {
            makeToast(
              t('add_user_created_banner') as string,
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
              t('edit_user_success_banner') as string,
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
        <SettingsConfirmationModal
          title={t('delete_user_modal_title') as string}
          heading={t('delete_user_modal_heading') as string}
          description={t('delete_user_modal_description') as string}
          confirmLabel={t('shared:delete') as string}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setUserToDelete(null)
          }}
        />
      ) : null}
      {userToActivate != null ? (
        <SettingsConfirmationModal
          title={t('activate_user_modal_title') as string}
          heading={t('activate_user_modal_heading') as string}
          description={t('activate_user_modal_description') as string}
          confirmLabel={t('unlock_user') as string}
          isConfirmDisabled={isUnlockingUser || isResettingPasswordAfterUnlock}
          onConfirm={handleActivateConfirm}
          onCancel={() => {
            setUserToActivate(null)
          }}
        />
      ) : null}
      {userToDeactivate != null ? (
        <SettingsConfirmationModal
          title={t('lock_user_modal_title') as string}
          heading={t('lock_user_modal_heading') as string}
          description={t('lock_user_modal_description') as string}
          confirmLabel={t('lock_user') as string}
          isConfirmDisabled={isUpdatingUser}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => {
            setUserToDeactivate(null)
          }}
        />
      ) : null}
      {userToResetPassword != null && resetPasswordTemporaryPassword == null ? (
        <SettingsConfirmationModal
          title={t('reset_password') as string}
          heading={t('reset_password_modal_heading') as string}
          description={t('reset_password_modal_description') as string}
          confirmLabel={t('reset_password') as string}
          isConfirmDisabled={isResettingPassword}
          onConfirm={handleResetPasswordConfirm}
          onCancel={handleResetPasswordCancel}
        />
      ) : null}
      {resetPasswordTemporaryPassword != null ? (
        <OneTimePasswordModal
          password={resetPasswordTemporaryPassword}
          message={
            t('reset_password_one_time_password_message') as string
          }
          onConfirm={handleResetPasswordCancel}
          onClose={handleResetPasswordCancel}
        />
      ) : null}
    </Accordion>
  )
}
