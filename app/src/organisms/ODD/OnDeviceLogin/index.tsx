import { useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  InputField,
  LEGACY_INPUT_TYPE_PASSWORD,
  setRefs,
  StyledText,
} from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './OnDeviceLoginOverlayProvider.module.css'

import type { ChangeEvent } from 'react'
import type { ControllerRenderProps } from 'react-hook-form'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

export type LoginStep = 'username' | 'password'

interface LoginFormValues {
  username: string
  password: string
}

export interface OnDeviceLoginProps {
  step: LoginStep
  onStepChange: (step: LoginStep) => void
  submitPassword: (username: string, password: string) => void
  isAuthLoading: boolean
  onCancel: () => void
  /** Shown under the password field with error styling when login fails */
  loginError?: string | null
  onClearLoginError?: () => void
}

export function OnDeviceLogin({
  step,
  onStepChange,
  submitPassword,
  isAuthLoading,
  onCancel,
  loginError = null,
  onClearLoginError,
}: OnDeviceLoginProps): JSX.Element {
  const { t } = useTranslation(['shared', 'device_settings'])
  const { control, watch, setValue, getValues } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  })
  const [showKeyboard, setShowKeyboard] = useState(false)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const username = watch('username')
  const password = watch('password')

  const handleNext = (): void => {
    const { username, password } = getValues()
    if (step === 'username') {
      if (username.trim() === '') return
      onStepChange('password')
      return
    }
    if (password.trim() === '') return
    submitPassword(username, password)
  }

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : password.trim() === '' || isAuthLoading

  const activeFieldName = step === 'username' ? 'username' : 'password'
  const passwordLabelHasError =
    step === 'password' && loginError != null && loginError !== ''

  return (
    <>
      <div className={styles.container}>
        <ChildNavigation
          header={t('on_device_login', { ns: 'device_settings' })}
          buttonText={
            step === 'username'
              ? t('next', { ns: 'shared' })
              : t('confirm', { ns: 'shared' })
          }
          buttonIsDisabled={primaryDisabled}
          onClickBack={
            step === 'password'
              ? () => {
                  onClearLoginError?.()
                  onStepChange('username')
                }
              : undefined
          }
          secondaryButtonProps={{
            buttonText: t('cancel', { ns: 'shared' }),
            buttonType: 'tertiaryLowLight',
            onClick: onCancel,
          }}
          onClickButton={handleNext}
        />
        <div className={styles.content_container}>
          <div className={styles.form_inner_container}>
            <StyledText
              as="label"
              htmlFor={activeFieldName}
              oddStyle="bodyTextRegular"
              className={styles.field_label}
              color={passwordLabelHasError ? COLORS.red50 : COLORS.black90}
            >
              {step === 'username'
                ? t('device_settings:username')
                : t('device_settings:password')}
            </StyledText>
            <Controller
              key={activeFieldName}
              control={control}
              name={activeFieldName}
              render={({ field }) => (
                <LoginFieldInput
                  field={field}
                  step={step}
                  loginError={passwordLabelHasError ? loginError : null}
                  onClearLoginError={onClearLoginError}
                  onFocus={() => {
                    setShowKeyboard(true)
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>
      {showKeyboard ? (
        <div className={styles.keyboard_container}>
          <AccordionKeyboard isOpen={showKeyboard} onToggle={() => {}}>
            <FullKeyboard
              onChange={(input: string) => {
                setValue(step === 'username' ? 'username' : 'password', input, {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }}
              keyboardRef={keyboardRef}
            />
          </AccordionKeyboard>
        </div>
      ) : null}
    </>
  )
}

interface LoginFieldInputProps {
  field: ControllerRenderProps<LoginFormValues, 'username' | 'password'>
  step: LoginStep
  loginError: string | null
  onClearLoginError?: () => void
  onFocus: () => void
}

/**
 * Renders the active username/password input. Lives inside the Controller's
 * render prop so its `showPassword` state is reset automatically when the
 * Controller remounts on step change (via its `key` prop).
 */
function LoginFieldInput({
  field,
  step,
  loginError,
  onClearLoginError,
  onFocus,
}: LoginFieldInputProps): JSX.Element {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPasswordHidden = step === 'password' && !showPassword
  const inputType = isPasswordHidden ? LEGACY_INPUT_TYPE_PASSWORD : 'text'

  const togglePasswordVisibility = (): void => {
    setShowPassword(current => !current)
    inputRef.current?.focus()
  }

  const inputField = (
    <InputField
      ref={setRefs(inputRef, field.ref)}
      autoFocus={step === 'password'}
      type={inputType}
      size="medium"
      error={loginError}
      value={field.value ?? ''}
      name={field.name}
      id={field.name}
      onBlur={field.onBlur}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        field.onChange(e.target.value)
        onClearLoginError?.()
      }}
      onFocus={onFocus}
    />
  )

  if (step !== 'password') return inputField

  return (
    <div className={styles.password_field_row}>
      <div className={styles.password_field_input}>{inputField}</div>
      <PasswordVisibilityToggle
        isVisible={showPassword}
        onToggle={togglePasswordVisibility}
      />
    </div>
  )
}

export {
  OnDeviceLoginOverlayProvider,
  useOnDeviceLoginModal,
} from './OnDeviceLoginOverlayProvider'
export type { OnDeviceLoginModalContextValue } from './OnDeviceLoginOverlayProvider'
