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
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import { useOAuth2PasswordLogin } from '/app/resources/auth'

import styles from './loginmodal.module.css'

import type { ComponentProps } from 'react'
import type { HostConfig } from '@opentrons/api-client'

interface LoginModalProps {
  host: HostConfig /** Which robot to log in to. */
}

/** Open the desktop login modal in the appropriate React portal. */
export const showLoginModal = (props: LoginModalProps): void => {
  void NiceModal.show(LoginModal, props)
}

const LoginModal = NiceModal.create((props: LoginModalProps) => {
  const { host } = props
  return (
    <ApiHostProvider {...host}>
      <LoginModalImpl />
    </ApiHostProvider>
  )
})

function LoginModalImpl(): JSX.Element {
  const modal = useModal()
  const { t } = useTranslation()
  const [view, setView] = useState<'login' | 'forgotPassword'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const storeLoginState = useStoreLoginState()

  const loginFormId = useId()

  const handleClose = (): void => {
    modal.remove()
  }

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (successfulUsername, _user, response) => {
      setLoginError(null)
      storeLoginState(successfulUsername, response)
      modal.remove()
    },
    onError: message => {
      setLoginError(message)
    },
  })

  const isLoginDisabled = username === '' || password === '' || isAuthLoading

  const handleSubmit: ComponentProps<'form'>['onSubmit'] = event => {
    event.preventDefault()
    submitPassword(username, password)
  }

  const handleUsernameChange = (value: string): void => {
    setLoginError(null)
    setUsername(value)
  }

  const handlePasswordChange = (value: string): void => {
    setLoginError(null)
    setPassword(value)
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
      ) : (
        <SecondaryButton
          onClick={() => {
            setView('login')
          }}
        >
          {t('shared:back')}
        </SecondaryButton>
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
        ) : (
          <ForgotPasswordView />
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
