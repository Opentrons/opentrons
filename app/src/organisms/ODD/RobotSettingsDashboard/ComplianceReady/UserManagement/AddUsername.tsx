import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import { StepMeter, TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { USERNAME_MAX_LENGTH } from '/app/resources/auth/helpers'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function AddUsername({
  savedUsername,
  onClickBack,
  onCancel,
  onContinue,
  totalSteps,
  currentStep,
  takenUsernames,
}: {
  savedUsername?: string
  onClickBack: () => void
  onCancel: () => void
  onContinue: (username: string) => void
  totalSteps: number
  currentStep: number
  takenUsernames: string[]
}): ReactNode {
  const [username, setUsername] = useState<string | undefined>(savedUsername)
  const [error, setError] = useState<string | undefined>(undefined)
  const { t } = useTranslation('device_settings')
  const keyboardRef = useRef(null)
  const inputElementRef = useRef(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setUsername(e.target.value)
    if (
      e.target.value.length <= USERNAME_MAX_LENGTH &&
      !takenUsernames.includes(e.target.value)
    ) {
      setError(undefined)
    }
  }

  const handleConfirm = useCallback((): void => {
    const trimmedUsername = username?.trim()
    if (!trimmedUsername) {
      setError('' + t('odd_add_username_required'))
      return
    }
    if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
      setError('' + t('odd_add_username_caption'))
      return
    }
    if (takenUsernames.includes(trimmedUsername)) {
      setError('' + t('odd_add_username_taken_caption'))
      return
    }
    setError(undefined)
    onContinue(trimmedUsername)
  }, [username, onContinue, t, takenUsernames])

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
    <div className={styles.container}>
      <StepMeter totalSteps={totalSteps} currentStep={currentStep} />
      <ChildNavigation
        header={t('odd_add_username_title')}
        onClickBack={onClickBack}
        onClickButton={handleConfirm}
        buttonText={t('odd_create_user_continue_button')}
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: t('odd_create_user_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        marginTop="12px"
      />
      <div className={styles.create_user_content}>
        <div
          className={clsx(
            styles.create_user_input_container,
            !isKeyboardOpen &&
              styles.create_user_input_container_keyboard_closed
          )}
        >
          <TouchInputField
            type="text"
            label={t('odd_add_username_label')}
            value={username}
            onChange={handleChange}
            caption={!!error ? undefined : t('odd_add_username_caption')}
            ref={inputElementRef}
            error={error}
            borderRadius="8px"
            autoFocus
          />
        </div>
        <div className={styles.keyboard_container}>
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
    </div>
  )
}
