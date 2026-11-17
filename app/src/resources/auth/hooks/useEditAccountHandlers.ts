import {
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'

import type {
  AuthUserAccountType,
  AuthUserResponse,
} from '@opentrons/api-client'

export function useEditAccountHandlers({
  onNewUsername,
}: {
  onNewUsername: (response: AuthUserResponse) => void
}): (username: string) => {
  onSaveNewUsername: (newUsername: string) => Promise<void>
  onSaveNewLegalName: (legalName: string) => Promise<void>
  onSaveNewRole: (role: AuthUserAccountType) => Promise<void>
  onLockAccount: () => Promise<void>
  onDeleteAccount: () => Promise<void>
  onResetPassword: () => Promise<string | undefined>
  onUnlockAccount: () => Promise<string | undefined>
  isLoading: boolean
} {
  const documentationState = useDocumentationState()
  const { updateUser, isLoading: updateIsLoading } =
    useUpdateUserMutation(documentationState)
  const { deleteUser, isLoading: deleteIsLoading } =
    useDeleteUserMutation(documentationState)
  const { resetUserPassword, isLoading: resetPasswordIsLoading } =
    useResetUserPasswordMutation(documentationState)

  const { documentationState: unlockUserDocumentationState, clearDocreport } =
    useLinkedDocumentationState(
      ['unlock_user', 'reset_user_password'],
      'no reset key sorry'
    )
  const { updateUser: unlockUser, isLoading: unlockIsLoading } =
    useUpdateUserMutation(unlockUserDocumentationState)
  const {
    resetUserPassword: resetPasswordAfterUnlock,
    isLoading: resetPasswordAfterUnlockIsLoading,
  } = useResetUserPasswordMutation(unlockUserDocumentationState)

  return (username: string) => {
    const onSaveNewUsername = (newUsername: string): Promise<void> => {
      return updateUser(
        {
          username,
          request: { data: { username: newUsername } },
        },
        {
          onSuccess: onNewUsername,
        }
      ).then(() => {})
    }
    const onSaveNewLegalName = (legalName: string): Promise<void> => {
      return updateUser({
        username,
        request: { data: { fullName: legalName } },
      }).then(() => {})
    }
    const onLockAccount = (): Promise<void> => {
      return updateUser({
        username,
        request: { data: { locked: true } },
      }).then(() => {})
    }
    const onSaveNewRole = (role: AuthUserAccountType): Promise<void> => {
      return updateUser({
        username,
        request: { data: { accountType: role } },
      }).then(() => {})
    }
    const onDeleteAccount = (): Promise<void> => {
      return deleteUser(username).then(() => {})
    }

    const onResetPassword = (): Promise<string | undefined> => {
      return resetUserPassword(username).then(response => {
        return response.data.temporaryPassword
      })
    }

    const onUnlockAccount = (): Promise<string | undefined> => {
      return unlockUser({
        username,
        request: { data: { locked: false } },
      }).then(() =>
        resetPasswordAfterUnlock(username).then(response => {
          clearDocreport()
          return response.data.temporaryPassword
        })
      )
    }

    return {
      onSaveNewUsername,
      onSaveNewLegalName,
      onSaveNewRole,
      onLockAccount,
      onDeleteAccount,
      onResetPassword,
      onUnlockAccount,
      isLoading:
        updateIsLoading ||
        deleteIsLoading ||
        resetPasswordIsLoading ||
        unlockIsLoading ||
        resetPasswordAfterUnlockIsLoading,
    }
  }
}
