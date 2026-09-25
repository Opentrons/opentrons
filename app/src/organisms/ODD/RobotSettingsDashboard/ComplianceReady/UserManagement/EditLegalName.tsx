import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import { TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function EditLegalName({
  onCancel,
  onSave,
  isLoading,
}: {
  onCancel: () => void
  onSave: (legalName: string) => void
  isLoading?: boolean
}): ReactNode {
  const [legalName, setLegalName] = useState<string | undefined>(undefined)
  const { t } = useTranslation('device_settings')
  const keyboardRef = useRef(null)
  const inputElementRef = useRef(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLegalName(e.target.value)
  }

  const handleConfirm = useCallback((): void => {
    if (!!legalName?.trim()) {
      onSave(legalName.trim())
    }
  }, [legalName, onSave])

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
        header={t('odd_edit_legal_name_title')}
        onClickButton={handleConfirm}
        buttonText={t('odd_create_user_continue_button')}
        buttonType="primary"
        secondaryButtonProps={{
          buttonText: t('odd_create_user_cancel_button'),
          buttonType: 'tertiaryLowLight',
          onClick: onCancel,
        }}
        iconName={isLoading ? 'ot-spinner' : undefined}
        buttonIsDisabled={isLoading}
        onClickBack={onCancel}
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
            label={t('odd_add_legal_name_label')}
            value={legalName}
            onChange={handleChange}
            ref={inputElementRef}
            borderRadius="8px"
            autoFocus
          />
        </div>
        <div className={styles.keyboard_container}>
          <AccordionKeyboard
            inputRef={inputElementRef}
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
