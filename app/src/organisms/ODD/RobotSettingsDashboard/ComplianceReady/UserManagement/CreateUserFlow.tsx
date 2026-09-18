import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  isDocumentedMutationError,
  useCreateUserMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'

import { AddLegalName } from './AddLegalName'
import { AddUsername } from './AddUsername'
import { ChooseRole } from './ChooseRole'
import { ShareOneTimePassword } from './ShareOneTimePassword'

import type { ReactNode } from 'react'

interface CreateUserFlowState {
  step: number
  username?: string
  legalName?: string
  role?: 'admin' | 'user' | 'service'
  oneTimePassword?: string
}

export function CreateUserFlow({
  onCancel,
  usernames,
}: {
  onCancel: () => void
  usernames: string[]
}): ReactNode {
  const { t } = useTranslation('device_settings')

  const [flowState, setFlowState] = useState<CreateUserFlowState>({ step: 0 })
  const documentationState = useDocumentationState()
  const { createUser, isLoading } = useCreateUserMutation(documentationState)

  const { makeToast } = useToaster()

  const handleSubmit = async (
    role: 'admin' | 'user' | 'service'
  ): Promise<void> => {
    if (flowState.step === 2 && !!flowState.legalName && !!flowState.username) {
      setFlowState(prevState => ({
        ...prevState,
        step: 3,
        role,
      }))
      createUser({
        data: {
          username: flowState.username,
          fullName: flowState.legalName,
          accountType: role,
        },
      })
        .then(response => {
          if (!!response.data.temporaryPassword) {
            setFlowState(prevState => ({
              ...prevState,
              step: 3,
              role,
              oneTimePassword: response.data.temporaryPassword,
            }))
          } else {
            makeToast('' + t('odd_create_user_error'), 'error', {
              duration: 5000,
            })
            onCancel()
          }
        })
        .catch(error => {
          if (isDocumentedMutationError(error)) {
            setFlowState(prevState => ({ ...prevState, step: 2, role }))
          } else {
            makeToast('' + t('odd_create_user_error'), 'error', {
              duration: 5000,
            })
            onCancel()
          }
        })
    }
  }

  const handleConfirm = (): void => {
    makeToast('' + t('odd_create_user_success'), 'success', { duration: 5000 })
    onCancel()
  }

  const userFlowPhases = [
    {
      title: t('odd_add_username_title'),
      content: (
        <AddUsername
          onClickBack={onCancel}
          onCancel={onCancel}
          onContinue={(username: string) => {
            setFlowState(prevState => ({ ...prevState, step: 1, username }))
          }}
          currentStep={1}
          totalSteps={4}
          savedUsername={flowState.username}
          takenUsernames={usernames}
        />
      ),
    },
    {
      title: t('odd_add_legal_name_title'),
      content: (
        <AddLegalName
          onClickBack={(legalName?: string) => {
            setFlowState(prevState => ({ ...prevState, step: 0, legalName }))
          }}
          onCancel={onCancel}
          onContinue={(legalName: string) => {
            setFlowState(prevState => ({ ...prevState, step: 2, legalName }))
          }}
          currentStep={2}
          totalSteps={4}
          savedLegalName={flowState.legalName}
        />
      ),
    },
    {
      title: t('odd_choose_role_title'),
      content: (
        <ChooseRole
          onClickBack={(role?: 'admin' | 'user' | 'service') => {
            setFlowState(prevState => ({ ...prevState, step: 1, role }))
          }}
          onCancel={onCancel}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          currentStep={3}
          totalSteps={4}
          savedRole={flowState.role}
        />
      ),
    },
    {
      content: (
        <ShareOneTimePassword
          onConfirm={handleConfirm}
          totalSteps={4}
          currentStep={4}
          oneTimePassword={flowState.oneTimePassword ?? ''}
        />
      ),
    },
    // { title: t('odd_share_one_time_password_title') },
    // { title: t('odd_choose_role_title') },
  ]
  return userFlowPhases[flowState.step].content
}
