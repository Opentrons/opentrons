import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import { StyledText, TouchInputField } from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { PasswordVisibilityToggle } from '/app/molecules/PasswordVisibilityToggle'
import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'

import styles from './wifipasswordinput.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

interface WifiPasswordInputProps {
  password: string
  setPassword: (password: string) => void
}

export function WifiPasswordInput({
  password,
  setPassword,
}: WifiPasswordInputProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const mainWrapperClasses = clsx(
    styles.main_wrapper,
    !isUnboxingFlowOngoing && styles.main_wrapper_with_top_margin
  )

  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.focus()
    }
    keyboardRef.current?.setInput(password)
  }, [password])

  return (
    <>
      <div className={mainWrapperClasses}>
        <div className={styles.form_content}>
          <StyledText oddStyle="bodyTextRegular">
            {t('enter_password')}
          </StyledText>
          <div className={styles.input_row}>
            <div className={styles.input_field_wrapper}>
              <TouchInputField
                aria-label="wifi_password"
                value={password}
                type={showPassword ? 'text' : 'password'}
                ref={inputRef}
                autoFocus
                onChange={e => {
                  setPassword(e.target.value)
                }}
              />
            </div>
            <PasswordVisibilityToggle
              isVisible={showPassword}
              onToggle={() => {
                setShowPassword(currentState => !currentState)
                inputRef?.current?.focus()
              }}
            />
          </div>
        </div>
      </div>
      <div className={styles.keyboard_wrapper}>
        <FullKeyboard
          onChange={e => {
            e != null && setPassword(String(e))
            inputRef?.current?.focus()
          }}
          keyboardRef={keyboardRef}
        />
      </div>
    </>
  )
}
