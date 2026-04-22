import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  Button,
  COLORS,
  Icon,
  InputField,
  LEGACY_INPUT_TYPE_PASSWORD,
  setRefs,
  StyledText,
} from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './OnDeviceLoginOverlayProvider.module.css'

import type { ChangeEvent } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

export type LoginStep = 'username' | 'password'

interface LoginFormValues {
  username: string
  password: string
}

export interface OnDeviceLoginViewProps {
  step: LoginStep
  onStepChange: (step: LoginStep) => void
  submitPassword: (username: string, password: string) => void
  isAuthLoading: boolean
  onCancel: () => void
  /** Shown under the password field with error styling when login fails */
  loginError?: string | null
  onClearLoginError?: () => void
}

export function OnDeviceLoginView({
  step,
  onStepChange,
  submitPassword,
  isAuthLoading,
  onCancel,
  loginError = null,
  onClearLoginError,
}: OnDeviceLoginViewProps): JSX.Element {
  const { t } = useTranslation(['shared', 'device_settings'])
  const { control, watch, setValue, getValues } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const username = watch('username')
  const password = watch('password')
  const fieldValue = step === 'username' ? username : password

  useEffect(() => {
    if (!showKeyboard) return
    const id = window.setTimeout(() => {
      keyboardRef.current?.setInput(fieldValue)
    }, 0)
    return () => {
      window.clearTimeout(id)
    }
  }, [showKeyboard, fieldValue, step])

  useEffect(() => {
    setShowPassword(false)
  }, [step])

  const handleNext = (): void => {
    const { username: u, password: p } = getValues()
    if (step === 'username') {
      if (u.trim() === '') return
      onStepChange('password')
      return
    }
    if (p.trim() === '') return
    submitPassword(u, p)
  }

  const primaryDisabled =
    step === 'username'
      ? username.trim() === ''
      : password.trim() === '' || isAuthLoading

  const inputType =
    step === 'username'
      ? 'text'
      : showPassword
        ? 'text'
        : LEGACY_INPUT_TYPE_PASSWORD

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
                <InputField
                  ref={setRefs(inputRef, field.ref)}
                  autoFocus={step === 'password'}
                  type={inputType}
                  size="medium"
                  error={
                    step === 'password' &&
                    loginError != null &&
                    loginError !== ''
                      ? loginError
                      : null
                  }
                  value={field.value ?? ''}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    field.onChange(e.target.value)
                    onClearLoginError?.()
                  }}
                  onFocus={() => {
                    setShowKeyboard(true)
                  }}
                  rightElement={
                    step === 'password' ? (
                      <div>
                        <Button
                          type="button"
                          title={t('toggle_password_visibility', {
                            ns: 'device_settings',
                          })}
                          onClick={() => {
                            setShowPassword(current => !current)
                            inputRef.current?.focus()
                          }}
                        >
                          <Icon
                            name={showPassword ? 'eye-slash' : 'eye'}
                            size="1.5rem"
                          />
                        </Button>
                      </div>
                    ) : null
                  }
                />
              )}
            />
          </div>
        </div>
      </div>
      {showKeyboard ? (
        <div
          className={styles.keyboard_container}
          onMouseDown={event => {
            event.preventDefault()
          }}
        >
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

export * from './onDeviceLoginRedirect'
export {
  OnDeviceLoginContext,
  OnDeviceLoginOverlayProvider,
  useOnDeviceLoginModal,
} from './OnDeviceLoginOverlayProvider'
export type {
  OnDeviceLoginModalContextValue,
  OpenOnDeviceLoginOptions,
} from './OnDeviceLoginOverlayProvider'
