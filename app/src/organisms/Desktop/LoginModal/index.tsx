import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  BasicButton,
  COLORS,
  InputField,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { useRobot } from '/app/redux-resources/robots'
import { OPENTRONS_USB } from '/app/redux/discovery'
import { useAccessTokenForRobot } from '/app/redux/robot-auth'
import { appShellUSBRequestor } from '/app/redux/shell/remote'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'

import styles from './loginmodal.module.css'

import type { ComponentProps } from 'react'

interface LoginModalProps {
  robotName: string /** Which robot to log in to. */
}

/** Open the desktop login modal in the appropriate React portal. */
export const showLoginModal = (props: LoginModalProps): void => {
  void NiceModal.show(LoginModal, props)
}

const LoginModal = NiceModal.create((props: LoginModalProps) => {
  const { robotName } = props
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)
  return (
    <ApiHostProvider
      hostname={robot?.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined}
      token={token}
    >
      <LoginModalImpl robotName={robotName} />
    </ApiHostProvider>
  )
})

interface LoginModalImplProps {
  robotName: string
}

function LoginModalImpl(props: LoginModalImplProps): JSX.Element {
  const { robotName } = props
  const modal = useModal()
  const { t } = useTranslation()
  const [view, setView] = useState<
    'login' | 'forgotPassword' | 'passwordExpired'
  >('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()

  const loginFormId = useId()

  const handleClose = (): void => {
    modal.remove()
  }

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (successfulUsername, user, response) => {
      setLoginError(null)
      storeLoginState(robotName, successfulUsername, response)

      if (user.resetPassword) {
        setLoggedInUsername(successfulUsername)
        setPassword('')
        setConfirmPasswordError(null)
        setView('passwordExpired')
        return
      }

      storeLoginState(robotName, successfulUsername, response)
      modal.remove()
    },
    onError: message => {
      setLoginError(message)
    },
  })

  const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
    useSetNewPasswordAndSignIn({
      onSuccess: (successfulUsername, response) => {
        setLoginError(null)
        storeLoginState(robotName, successfulUsername, response)
        modal.remove()
      },
      onError: message => {
        setLoginError(message)
      },
    })

  const isLoginDisabled = username === '' || password === '' || isAuthLoading
  const isPasswordExpiredDisabled =
    newPassword === '' ||
    confirmPassword === '' ||
    isSetNewPasswordLoading ||
    loggedInUsername == null

  const handleSubmit: ComponentProps<'form'>['onSubmit'] = event => {
    event.preventDefault()
    submitPassword(username, password)
  }

  const handleSetNewPassword = (submit = true): void => {
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(
        t('access_control:desktop_password_expired_mismatch') as string
      )
      return
    }
    setConfirmPasswordError(null)
    if (!submit || loggedInUsername == null) {
      return
    }
    submitNewPassword(loggedInUsername, newPassword)
  }

  const handleConfirmPasswordBlur = (): void => {
    if (newPassword.trim() === '' || confirmPassword.trim() === '') {
      return
    }
    handleSetNewPassword(false)
  }

  const handleUsernameChange = (value: string): void => {
    setLoginError(null)
    setUsername(value)
  }

  const handlePasswordChange = (value: string): void => {
    setLoginError(null)
    setPassword(value)
  }

  const handleNewPasswordChange = (value: string): void => {
    setLoginError(null)
    setConfirmPasswordError(null)
    setNewPassword(value)
  }

  const handleConfirmPasswordChange = (value: string): void => {
    setLoginError(null)
    setConfirmPasswordError(null)
    setConfirmPassword(value)
  }

  const footer = (
    <div className={styles.modal_footer_container}>
      {view === 'login' ? (
        <PrimaryButton
          type="submit"
          form={loginFormId}
          // todo(mm, 2026-06-02): Instead of outright disabling the submit button
          // when any fields are missing, we should show errors on those fields.
          disabled={isLoginDisabled}
        >
          {t('access_control:log_in_link')}
        </PrimaryButton>
      ) : view === 'forgotPassword' ? (
        <SecondaryButton
          onClick={() => {
            setView('login')
          }}
        >
          {t('shared:back')}
        </SecondaryButton>
      ) : (
        <PrimaryButton
          onClick={handleSetNewPassword}
          disabled={isPasswordExpiredDisabled}
        >
          {t('shared:confirm')}
        </PrimaryButton>
      )}
    </div>
  )

  return createPortal(
    <Modal
      title={t('access_control:desktop_login_modal_header')}
      onClose={handleClose}
      footer={footer}
    >
      <div className={styles.content_container}>
        {view === 'login' ? (
          <LoginView
            formId={loginFormId}
            onSubmit={handleSubmit}
            username={username}
            password={password}
            loginError={loginError}
            onUsernameChange={handleUsernameChange}
            onPasswordChange={handlePasswordChange}
            onForgotPasswordClick={() => {
              setView('forgotPassword')
            }}
          />
        ) : view === 'forgotPassword' ? (
          <ForgotPasswordView />
        ) : (
          <PasswordExpiredView
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            newPasswordError={loginError}
            confirmPasswordError={confirmPasswordError}
            onNewPasswordChange={handleNewPasswordChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
            onConfirmPasswordBlur={handleConfirmPasswordBlur}
          />
        )}
      </div>
    </Modal>,
    getTopPortalEl()
  )
}

interface LoginViewProps {
  formId: string
  onSubmit: ComponentProps<'form'>['onSubmit']
  username: string
  password: string
  loginError: string | null
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onForgotPasswordClick: () => void
}

function LoginView(props: LoginViewProps): JSX.Element {
  const {
    formId,
    onSubmit,
    username,
    password,
    loginError,
    onUsernameChange,
    onPasswordChange,
    onForgotPasswordClick,
  } = props
  const { t } = useTranslation()

  return (
    <>
      <div className={styles.text_container}>
        <StyledText desktopStyle="headingSmallBold">
          {t('access_control:desktop_login_form_heading')}
        </StyledText>
        <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
          {t('access_control:desktop_login_form_subheading')}
        </StyledText>
      </div>

      <form id={formId} onSubmit={onSubmit} className={styles.fields_container}>
        <InputField
          name="username"
          title={t('access_control:login_form_username_field')}
          type="text"
          value={username}
          onChange={event => {
            onUsernameChange(event.target.value)
          }}
        />
        <InputField
          name="password"
          title={t('access_control:login_form_password_field')}
          type="password"
          value={password}
          error={loginError ?? undefined}
          onChange={event => {
            onPasswordChange(event.target.value)
          }}
        />
        <div>
          <BasicButton type="button" underLine onClick={onForgotPasswordClick}>
            {t('access_control:forgot_password_link')}
          </BasicButton>
        </div>
      </form>
    </>
  )
}

function ForgotPasswordView(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className={styles.text_container}>
      <StyledText desktopStyle="headingSmallBold">
        {t('access_control:forgot_password_heading')}
      </StyledText>
      <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
        {t('access_control:forgot_password_subheading')}
      </StyledText>
    </div>
  )
}

interface PasswordExpiredViewProps {
  newPassword: string
  confirmPassword: string
  newPasswordError: string | null
  confirmPasswordError: string | null
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onConfirmPasswordBlur: () => void
}

function PasswordExpiredView(props: PasswordExpiredViewProps): JSX.Element {
  const {
    newPassword,
    confirmPassword,
    newPasswordError,
    confirmPasswordError,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onConfirmPasswordBlur,
  } = props
  const { t } = useTranslation()

  return (
    <>
      <div className={styles.text_container}>
        <StyledText desktopStyle="headingSmallBold">
          {t('access_control:desktop_password_expired_heading')}
        </StyledText>
        <StyledText color={COLORS.grey60} desktopStyle="bodyDefaultRegular">
          {t('access_control:desktop_password_expired_subheading')}
        </StyledText>
      </div>

      <div className={styles.fields_container}>
        <InputField
          name="newPassword"
          title={t(
            'access_control:desktop_password_expired_new_password_field'
          )}
          type="password"
          value={newPassword}
          error={newPasswordError ?? undefined}
          onChange={event => {
            onNewPasswordChange(event.target.value)
          }}
        />
        <InputField
          name="confirmPassword"
          title={t(
            'access_control:desktop_password_expired_confirm_password_field'
          )}
          type="password"
          value={confirmPassword}
          error={confirmPasswordError ?? undefined}
          onChange={event => {
            onConfirmPasswordChange(event.target.value)
          }}
          onBlur={() => {
            onConfirmPasswordBlur()
          }}
        />
      </div>
    </>
  )
}
