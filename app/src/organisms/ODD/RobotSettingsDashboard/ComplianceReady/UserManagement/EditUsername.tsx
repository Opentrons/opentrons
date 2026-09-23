import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { USERNAME_MAX_LENGTH } from '/app/resources/auth/helpers'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function EditUsername({
  onCancel,
  onSave,
  takenUsernames,
  isLoading,
}: {
  onCancel: () => void
  onSave: (username: string) => void
  takenUsernames: string[]
  isLoading?: boolean
}): ReactNode {
  const [username, setUsername] = useState<string | undefined>(undefined)
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
    onSave(trimmedUsername)
  }, [username, onSave, t, takenUsernames])

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
      <ChildNavigation
        header={t('odd_add_username_title')}
        onClickButton={handleConfirm}
        buttonText={t('odd_create_user_continue_button')}
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: t('odd_create_user_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        onClickBack={onCancel}
        iconName={isLoading ? 'ot-spinner' : undefined}
        buttonIsDisabled={isLoading}
      />
      <div className={styles.odd_create_user_content}>
        <div className={styles.odd_create_user_input_container}>
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
