import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useSelector } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getSelfQueryKey, useHost } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import { OnDeviceLogin } from './index'
import styles from './OnDeviceLogin.module.css'

import type { AuthUser, OAuth2TokenResponse } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { LoginStep } from './index'

type LoginModalPhase = 'login' | 'chooseNewPassword'

const LoginModalImpl = NiceModal.create((): JSX.Element => {
  const modal = useModal()
  const host = useHost()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<LoginModalPhase>('login')
  const [step, setStep] = useState<LoginStep>('username')
  const [loginError, setLoginError] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()
  const loggedInUsernameRef = useRef<string | null>(null)
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )

  const isChoosingNewPassword = phase === 'chooseNewPassword'

  const invalidateSelfQuery = useCallback((): void => {
    if (host != null) {
      void queryClient.invalidateQueries(getSelfQueryKey(host))
    }
  }, [host, queryClient])

  const finishModal = useCallback(
    (username: string): void => {
      modal.resolve({ username })
      modal.remove()
    },
    [modal]
  )

  const handleLoginSuccess = useCallback(
    (username: string, user: AuthUser, response: OAuth2TokenResponse): void => {
      setLoginError(null)
      storeLoginState(
        localRobotName,
        {
          username,
          fullName: user.fullName,
          accountType: user.accountType,
        },
        response
      )
      invalidateSelfQuery()

      if (user.resetPassword) {
        loggedInUsernameRef.current = username
        setPhase('chooseNewPassword')
        setStep('password')
      } else {
        finishModal(username)
      }
    },
    [finishModal, invalidateSelfQuery, storeLoginState, localRobotName]
  )

  const dismissModal = useCallback((): void => {
    modal.resolve(null)
    modal.remove()
  }, [modal])

  const handleNewPasswordSuccess = useCallback(
    (username: string) => {
      setLoginError(null)
      invalidateSelfQuery()
      finishModal(username)
    },
    [finishModal, invalidateSelfQuery]
  )

  const { submitPassword, isAuthLoading: isLoginAuthLoading } =
    useOAuth2PasswordLogin({
      onSuccess: handleLoginSuccess,
      onError: message => {
        setLoginError(message)
      },
    })

  const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
    useSetNewPasswordAndSignIn({
      onSuccess: handleNewPasswordSuccess,
      onError: message => {
        setLoginError(message)
      },
    })

  const handleCancel = (): void => {
    dismissModal()
  }

  const initialUsername =
    phase === 'chooseNewPassword'
      ? (loggedInUsernameRef.current ?? undefined)
      : undefined

  return (
    <div className={styles.overlay}>
      <OnDeviceLogin
        key={phase}
        step={step}
        onStepChange={setStep}
        submitPassword={
          isChoosingNewPassword ? submitNewPassword : submitPassword
        }
        isAuthLoading={
          isChoosingNewPassword ? isSetNewPasswordLoading : isLoginAuthLoading
        }
        isPasswordResetRequired={isChoosingNewPassword}
        initialUsername={initialUsername}
        loginError={loginError}
        onClearLoginError={() => {
          setLoginError(null)
        }}
        onCancel={handleCancel}
      />
    </div>
  )
})

/**
 * Open the login modal and await the result.
 */
export function showLoginModal(): Promise<{ username: string } | null> {
  return NiceModal.show(LoginModalImpl)
}

/**
 * Returns whether the login modal is currently visible.
 */
export function useIsLoginModalOpen(): boolean {
  return useModal(LoginModalImpl).visible
}
