import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { usePlaceCaretAtEndOnToggle } from '/app/local-resources/access-control/usePlaceCaretAtEndOnToggle'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import {
  getPasswordComplexityError,
  mapSetNewPasswordError,
} from '/app/resources/auth'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { PasswordComplexityRequirements } from '/app/resources/auth'

export function EditPassword({
  onCancel,
  onSave,
  passwordComplexity,
  isLoading,
}: {
  onCancel: () => void
  onSave: (legalName: string) => void
  passwordComplexity: PasswordComplexityRequirements | null
  isLoading?: boolean
}): ReactNode {
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>(
    undefined
  )
  const [error, setError] = useState<string | undefined>(undefined)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >(undefined)
  const [phase, setPhase] = useState<'password' | 'confirmPassword'>('password')
  const { t } = useTranslation(['device_settings', 'access_control']) as {
    t: TFunction
  }
  const keyboardRef = useRef(null)
  const inputElementRef = useRef<HTMLInputElement>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const inputType: 'text' | 'password' = showPassword ? 'text' : 'password'

  usePlaceCaretAtEndOnToggle(inputElementRef, showPassword, true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (phase === 'password') {
      setPassword(e.target.value)
      setError(undefined)
      setConfirmPasswordError(undefined)
    } else {
      setConfirmPassword(e.target.value)
      setConfirmPasswordError(undefined)
    }
  }

  const handleConfirm = useCallback((): void => {
    if (phase === 'password') {
      if (!password || password?.trim() === '') {
        setError(
          t('on_device_login_password_required', {
            ns: 'access_control',
          }) as string
        )
        return
      }
      if (passwordComplexity != null) {
        const complexityError = getPasswordComplexityError(
          password,
          passwordComplexity
        )
        if (complexityError) {
          setError(mapSetNewPasswordError(complexityError, t))
          return
        }

        setConfirmPasswordError(undefined)
        setError(undefined)
        setShowPassword(false)
        setPhase('confirmPassword')
      }
    } else {
      if (!confirmPassword || confirmPassword?.trim() === '') {
        setConfirmPasswordError(
          t('on_device_login_password_required', {
            ns: 'access_control',
          }) as string
        )
        return
      }
      if (confirmPassword !== password) {
        setConfirmPasswordError(
          t('on_device_login_password_mismatch', {
            ns: 'access_control',
          }) as string
        )
        return
      }
      setConfirmPasswordError(undefined)
      setError(undefined)
      onSave(password.trim())
    }
  }, [password, confirmPassword, passwordComplexity, phase, t, onSave])

  const handleEnterPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      handleConfirm()
    },
    [handleConfirm]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleEnterPress)
    return () => {
      window.removeEventListener('keydown', handleEnterPress)
    }
  }, [handleEnterPress])

  return (
    <div className={styles.container} key={phase}>
      <ChildNavigation
        header={t('odd_new_password_title')}
        onClickButton={handleConfirm}
        buttonText={
          phase === 'password'
            ? '' + t('odd_password_continue_button')
            : '' + t('odd_password_save_button')
        }
        onClickBack={
          phase === 'password'
            ? onCancel
            : () => {
                setShowPassword(false)
                setPhase('password')
              }
        }
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: '' + t('odd_password_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        iconName={isLoading ? 'ot-spinner' : undefined}
        buttonIsDisabled={isLoading}
      />
      <div className={styles.odd_create_user_content}>
        <div className={styles.odd_create_user_input_container}>
          <TouchInputField
            type={inputType}
            label={
              phase === 'password'
                ? t('odd_new_password_label')
                : t('odd_confirm_password_label')
            }
            value={phase === 'password' ? password : confirmPassword}
            onChange={handleChange}
            ref={inputElementRef}
            borderRadius="8px"
            error={phase === 'password' ? error : confirmPasswordError}
            autoFocus
            accessory={
              <PasswordVisibilityToggle
                isVisible={showPassword}
                onToggle={() => {
                  setShowPassword(prev => !prev)
                }}
              />
            }
          />
        </div>
        <AccordionKeyboard
          isOpen={isKeyboardOpen}
          onToggle={() => {
            setIsKeyboardOpen(!isKeyboardOpen)
          }}
        >
          <FullKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
          />
        </AccordionKeyboard>
      </div>
    </div>
  )
}
