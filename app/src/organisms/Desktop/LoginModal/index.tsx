import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  BasicButton,
  COLORS,
  InputField,
  Modal,
  POSITION_FIXED,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  SUCCESS_TOAST,
  Toast,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import { logOut } from '/app/redux/robot-auth'
import { useStoreLoginState } from '/app/resources/access-control/useStoreLoginState'
import {
  useOAuth2PasswordLogin,
  useSetNewPasswordAndSignIn,
} from '/app/resources/auth'
import { isSSLError } from '/app/resources/auth/hooks/isSSLError'

import { RobotCertImportModal } from '../RobotCertImport'
import styles from './loginmodal.module.css'

import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from 'react'

interface LoginFormState {
  username: string
  logInPassword: string
  usernameRequiredError: string | null
  passwordRequiredError: string | null
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
  | {
      kind: 'login'
      formData: LoginFormState
      passwordResetSuccess?: boolean
    }
  | { kind: 'forgotPassword'; formData: LoginFormState }
  | { kind: 'setNewPassword'; formData: SetNewPasswordFormState }

const INITIAL_LOGIN_FORM: LoginFormState = {
  username: '',
  logInPassword: '',
  usernameRequiredError: null,
  passwordRequiredError: null,
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
  uncloseable?: boolean
}

/** Open the desktop login modal in the appropriate React portal. */
export const showLoginModal = async (
  props: LoginModalProps
): Promise<{ username: string } | null> => {
  return await NiceModal.show(LoginModal, props)
}

const LoginModal = NiceModal.create((props: LoginModalProps) => {
  const { robotName, uncloseable } = props
  return (
    <ApiHostProvider robotName={robotName}>
      <LoginModalImpl robotName={robotName} uncloseable={uncloseable} />
    </ApiHostProvider>
  )
})

interface LoginModalImplProps {
  robotName: string
  uncloseable?: boolean
}

function LoginModalImpl(props: LoginModalImplProps): ReactNode {
  const { robotName, uncloseable } = props
  const modal = useModal()
  const dispatch = useDispatch()
  const host = useHost()
  const { t } = useTranslation()
  const [screen, setScreen] = useState<LoginModalScreen>({
    kind: 'login',
    formData: INITIAL_LOGIN_FORM,
  })
  const storeLoginState = useStoreLoginState()

  const loginFormId = useId()
  const passwordResetSuccessToastId = useId()
  const [showRobotCertImportModal, setShowRobotCertImportModal] =
    useState<boolean>(false)

  const handleClose = (): void => {
    if (screen.kind === 'setNewPassword') {
      dispatch(logOut({ robotName }))
    }
    modal.resolve(null)
    modal.remove()
  }

  const handleError = (message: string, error?: unknown): void => {
    if (isSSLError(error, host?.hostname)) {
      setShowRobotCertImportModal(true)
      return
    }
    updateLoginFormData(setScreen, { error: message })
  }

  const { submitPassword, isAuthLoading } = useOAuth2PasswordLogin({
    onSuccess: (successfulUsername, user, response) => {
      storeLoginState(robotName, user, response)

      if (user.resetPassword) {
        setScreen({
          kind: 'setNewPassword',
          formData: setNewPasswordStateForm(successfulUsername),
        })
      } else {
        modal.resolve({ username: successfulUsername })
        modal.remove()
      }
    },
    onError: handleError,
  })

  const documentationState = useDocumentationState(undefined, robotName)
  const { submitNewPassword, isLoading: isSetNewPasswordLoading } =
    useSetNewPasswordAndSignIn(documentationState, {
      onSuccess: (successfulUsername, _newPassword) => {
        dispatch(logOut({ robotName }))
        setScreen({
          kind: 'login',
          passwordResetSuccess: true,
          formData: {
            username: successfulUsername,
            logInPassword: '',
            usernameRequiredError: null,
            passwordRequiredError: null,
            error: null,
          },
        })
      },
      onError: message => {
        updateSetNewPasswordFormData(setScreen, { error: message })
      },
    })

  const handleLoginSubmit: ComponentProps<'form'>['onSubmit'] = event => {
    event.preventDefault()
    if (screen.kind !== 'login') return
    const { username, logInPassword } = screen.formData
    const trimmedUsername = username.trim()
    const trimmedPassword = logInPassword.trim()
    const usernameRequiredError =
      trimmedUsername === ''
        ? (t('access_control:on_device_login_username_required') as string)
        : null
    const passwordRequiredError =
      trimmedPassword === ''
        ? (t('access_control:on_device_login_password_required') as string)
        : null

    if (usernameRequiredError != null || passwordRequiredError != null) {
      updateLoginFormData(setScreen, {
        usernameRequiredError,
        passwordRequiredError,
        error: null,
      })
      return
    }

    updateLoginFormData(setScreen, {
      usernameRequiredError: null,
      passwordRequiredError: null,
    })
    submitPassword(trimmedUsername, trimmedPassword)
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
        return (
          <PrimaryButton
            type="submit"
            form={loginFormId}
            disabled={isAuthLoading}
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

  if (showRobotCertImportModal) {
    return createPortal(
      <RobotCertImportModal
        onClose={() => {
          setShowRobotCertImportModal(false)
        }}
      />,
      getTopPortalEl()
    )
  }

  return createPortal(
    <>
      <Modal
        title={t('access_control:desktop_login_modal_header')}
        onClose={uncloseable ? undefined : handleClose}
        // Login is 10001 so it sits above SignRun (1000) and documentation (10000).
        // Drop to 9999 on set-new-password so the documentation modal is visible.
        zIndexOverlay={screen.kind === 'setNewPassword' ? 9999 : 10001}
        footer={<div className={styles.modal_footer_container}>{footer}</div>}
      >
        <div className={styles.content_container}>
          {screen.kind === 'login' ? (
            <LoginView
              formId={loginFormId}
              formData={screen.formData}
              onSubmit={handleLoginSubmit}
              onUsernameChange={value => {
                updateLoginFormData(setScreen, {
                  username: value,
                  usernameRequiredError: null,
                })
              }}
              onLogInPasswordChange={value => {
                updateLoginFormData(setScreen, {
                  logInPassword: value,
                  passwordRequiredError: null,
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
      </Modal>
      {screen.kind === 'login' && screen.passwordResetSuccess === true ? (
        <Toast
          id={passwordResetSuccessToastId}
          message={
            t('access_control:set_new_password_success', {
              username: screen.formData.username,
            }) as string
          }
          type={SUCCESS_TOAST}
          closeButton
          displayType="desktop"
          position={POSITION_FIXED}
          right={SPACING.spacing32}
          bottom={SPACING.spacing32}
          onClose={() => {
            setScreen(prev =>
              prev.kind === 'login'
                ? { ...prev, passwordResetSuccess: false }
                : prev
            )
          }}
        />
      ) : null}
    </>,
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

function LoginView(props: LoginViewProps): ReactNode {
  const {
    formId,
    formData,
    onSubmit,
    onUsernameChange,
    onLogInPasswordChange,
    onForgotPasswordClick,
  } = props
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  usePlaceCaretAtEndOnToggle(passwordInputRef, showPassword, true)

  const handleTogglePasswordVisibility = (): void => {
    setShowPassword(current => !current)
  }

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
          autoFocus
          name="username"
          title={t('access_control:login_form_username_field')}
          type="text"
          value={formData.username}
          error={formData.usernameRequiredError ?? undefined}
          onChange={event => {
            onUsernameChange(event.target.value)
          }}
        />
        <InputField
          ref={passwordInputRef}
          name="password"
          title={t('access_control:login_form_password_field')}
          type={showPassword ? 'text' : 'password'}
          value={formData.logInPassword}
          error={formData.passwordRequiredError ?? formData.error ?? undefined}
          onChange={event => {
            onLogInPasswordChange(event.target.value)
          }}
          rightElement={
            <PasswordVisibilityToggle
              isVisible={showPassword}
              onToggle={handleTogglePasswordVisibility}
              iconOnly
            />
          }
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

function ForgotPasswordView(): ReactNode {
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

function SetNewPasswordView(props: SetNewPasswordViewProps): ReactNode {
  const {
    formData,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onPasswordFieldBlur,
  } = props
  const { t } = useTranslation()
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const newPasswordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)

  usePlaceCaretAtEndOnToggle(newPasswordInputRef, showNewPassword, true)
  usePlaceCaretAtEndOnToggle(confirmPasswordInputRef, showConfirmPassword, true)

  const handleToggleNewPasswordVisibility = (): void => {
    setShowNewPassword(current => !current)
  }

  const handleToggleConfirmPasswordVisibility = (): void => {
    setShowConfirmPassword(current => !current)
  }

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
          ref={newPasswordInputRef}
          autoFocus
          name="newPassword"
          title={t(
            'access_control:desktop_password_expired_new_password_field'
          )}
          type={showNewPassword ? 'text' : 'password'}
          value={formData.newPassword}
          error={formData.error ?? undefined}
          onChange={event => {
            onNewPasswordChange(event.target.value)
          }}
          onBlur={() => {
            onPasswordFieldBlur()
          }}
          rightElement={
            <PasswordVisibilityToggle
              isVisible={showNewPassword}
              onToggle={handleToggleNewPasswordVisibility}
              iconOnly
            />
          }
        />
        <InputField
          ref={confirmPasswordInputRef}
          name="confirmPassword"
          title={t(
            'access_control:desktop_password_expired_confirm_password_field'
          )}
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          error={formData.confirmPasswordError ?? undefined}
          onChange={event => {
            onConfirmPasswordChange(event.target.value)
          }}
          onBlur={() => {
            onPasswordFieldBlur()
          }}
          rightElement={
            <PasswordVisibilityToggle
              isVisible={showConfirmPassword}
              onToggle={handleToggleConfirmPasswordVisibility}
              iconOnly
            />
          }
        />
      </div>
    </>
  )
}
