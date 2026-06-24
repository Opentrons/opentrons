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

import type { ComponentProps, Dispatch, SetStateAction } from 'react'

interface LoginFormState {
  username: string
  logInPassword: string
  error: string | null
}

interface SetNewPasswordFormState {
  username: string
  newPassword: string
  confirmPassword: string
  confirmPasswordError: string | null
  error: string | null
}

type LoginModalScreen =
  | { kind: 'login'; formData: LoginFormState }
  | { kind: 'forgotPassword'; formData: LoginFormState }
  | { kind: 'setNewPassword'; formData: SetNewPasswordFormState }

const INITIAL_LOGIN_FORM: LoginFormState = {
  username: '',
  logInPassword: '',
  error: null,
}

function setNewPasswordStateForm(username: string): SetNewPasswordFormState {
  return {
    username,
    newPassword: '',
    confirmPassword: '',
    confirmPasswordError: null,
    error: null,
  }
}

function updateLoginFormData(
  setScreen: Dispatch<SetStateAction<LoginModalScreen>>,
  updates: Partial<LoginFormState>
): void {
  setScreen(prev => {
    if (prev.kind !== 'login') return prev
    return { kind: 'login', formData: { ...prev.formData, ...updates } }
  })
}

function updateSetNewPasswordFormData(
  setScreen: Dispatch<SetStateAction<LoginModalScreen>>,
  updates: Partial<SetNewPasswordFormState>
): void {
  setScreen(prev => {
    if (prev.kind !== 'setNewPassword') return prev
    return {
      kind: 'setNewPassword',
      formData: { ...prev.formData, ...updates },
    }
  })
}

interface LoginModalProps {
  robotName: string /** Which robot to log in to. */
}

/** Open the desktop login modal in the appropriate React portal. */
export const showLoginModal = async (
  props: LoginModalProps
): Promise<{ username: string } | null> => {
  return await NiceModal.show(LoginModal, props)
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
  const [screen, setScreen] = useState<LoginModalScreen>({
    kind: 'login',
    formData: INITIAL_LOGIN_FORM,
  })
  const storeLoginState = useStoreLoginState()

  const loginFormId = useId()

  const handleClose = (): void => {
    modal.resolve(null)
    modal.remove()
  }

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (successfulUsername, user, response) => {
      storeLoginState(robotName, successfulUsername, response)

      if (user.resetPassword) {
        setScreen({
          kind: 'setNewPassword',
          formData: setNewPasswordStateForm(successfulUsername),
        })
        return
      }

      storeLoginState(robotName, successfulUsername, response)
      modal.resolve({ username: successfulUsername })
      modal.remove()
    },
    onError: message => {
      updateLoginFormData(setScreen, { error: message })
    },
  })

  const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
    useSetNewPasswordAndSignIn({
      onSuccess: (successfulUsername, response) => {
        storeLoginState(robotName, successfulUsername, response)
        modal.resolve({ username: successfulUsername })
        modal.remove()
      },
      onError: message => {
        updateSetNewPasswordFormData(setScreen, { error: message })
      },
    })

  const handleLoginSubmit: ComponentProps<'form'>['onSubmit'] = event => {
    event.preventDefault()
    if (screen.kind !== 'login') return
    const { username, logInPassword } = screen.formData
    submitPassword(username, logInPassword)
  }

  const validateConfirmPasswordMatch = (
    formData: SetNewPasswordFormState
  ): boolean => {
    if (formData.newPassword !== formData.confirmPassword) {
      updateSetNewPasswordFormData(setScreen, {
        confirmPasswordError: t(
          'access_control:desktop_password_expired_mismatch'
        ) as string,
      })
      return false
    }
    updateSetNewPasswordFormData(setScreen, { confirmPasswordError: null })
    return true
  }

  const footer = (() => {
    switch (screen.kind) {
      case 'login': {
        const { username, logInPassword } = screen.formData
        const isLoginDisabled =
          username === '' || logInPassword === '' || isAuthLoading
        return (
          <PrimaryButton
            type="submit"
            form={loginFormId}
            // todo(mm, 2026-06-02): Instead of outright disabling the submit button
            // when any fields are missing, we should show errors on those fields.
            disabled={isLoginDisabled}
          >
            {t('access_control:log_in_link')}
          </PrimaryButton>
        )
      }
      case 'forgotPassword':
        return (
          <SecondaryButton
            onClick={() => {
              setScreen({ kind: 'login', formData: screen.formData })
            }}
          >
            {t('shared:back')}
          </SecondaryButton>
        )
      case 'setNewPassword': {
        const { newPassword, confirmPassword } = screen.formData
        const isSetNewPasswordDisabled =
          newPassword === '' ||
          confirmPassword === '' ||
          isSetNewPasswordLoading
        return (
          <PrimaryButton
            onClick={() => {
              if (!validateConfirmPasswordMatch(screen.formData)) return
              submitNewPassword(
                screen.formData.username,
                screen.formData.newPassword
              )
            }}
            disabled={isSetNewPasswordDisabled}
          >
            {t('shared:confirm')}
          </PrimaryButton>
        )
      }
    }
  })()

  return createPortal(
    <Modal
      title={t('access_control:desktop_login_modal_header')}
      onClose={handleClose}
      footer={<div className={styles.modal_footer_container}>{footer}</div>}
    >
      <div className={styles.content_container}>
        {screen.kind === 'login' ? (
          <LoginView
            formId={loginFormId}
            formData={screen.formData}
            onSubmit={handleLoginSubmit}
            onUsernameChange={value => {
              updateLoginFormData(setScreen, { username: value, error: null })
            }}
            onLogInPasswordChange={value => {
              updateLoginFormData(setScreen, {
                logInPassword: value,
                error: null,
              })
            }}
            onForgotPasswordClick={() => {
              setScreen({ kind: 'forgotPassword', formData: screen.formData })
            }}
          />
        ) : screen.kind === 'forgotPassword' ? (
          <ForgotPasswordView />
        ) : (
          <SetNewPasswordView
            formData={screen.formData}
            onNewPasswordChange={value => {
              updateSetNewPasswordFormData(setScreen, {
                newPassword: value,
                error: null,
                confirmPasswordError: null,
              })
            }}
            onConfirmPasswordChange={value => {
              updateSetNewPasswordFormData(setScreen, {
                confirmPassword: value,
                error: null,
                confirmPasswordError: null,
              })
            }}
            onPasswordFieldBlur={() => {
              const { newPassword, confirmPassword } = screen.formData
              if (newPassword !== '' && confirmPassword !== '') {
                validateConfirmPasswordMatch(screen.formData)
              }
            }}
          />
        )}
      </div>
    </Modal>,
    getTopPortalEl()
  )
}

interface LoginViewProps {
  formId: string
  formData: LoginFormState
  onSubmit: ComponentProps<'form'>['onSubmit']
  onUsernameChange: (value: string) => void
  onLogInPasswordChange: (value: string) => void
  onForgotPasswordClick: () => void
}

function LoginView(props: LoginViewProps): JSX.Element {
  const {
    formId,
    formData,
    onSubmit,
    onUsernameChange,
    onLogInPasswordChange,
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
          value={formData.username}
          onChange={event => {
            onUsernameChange(event.target.value)
          }}
        />
        <InputField
          name="password"
          title={t('access_control:login_form_password_field')}
          type="password"
          value={formData.logInPassword}
          error={formData.error ?? undefined}
          onChange={event => {
            onLogInPasswordChange(event.target.value)
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

interface SetNewPasswordViewProps {
  formData: SetNewPasswordFormState
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onPasswordFieldBlur: () => void
}

function SetNewPasswordView(props: SetNewPasswordViewProps): JSX.Element {
  const {
    formData,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onPasswordFieldBlur,
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
          value={formData.newPassword}
          error={formData.error ?? undefined}
          onChange={event => {
            onNewPasswordChange(event.target.value)
          }}
          onBlur={() => {
            onPasswordFieldBlur()
          }}
        />
        <InputField
          name="confirmPassword"
          title={t(
            'access_control:desktop_password_expired_confirm_password_field'
          )}
          type="password"
          value={formData.confirmPassword}
          error={formData.confirmPasswordError ?? undefined}
          onChange={event => {
            onConfirmPasswordChange(event.target.value)
          }}
          onBlur={() => {
            onPasswordFieldBlur()
          }}
        />
      </div>
    </>
  )
}
