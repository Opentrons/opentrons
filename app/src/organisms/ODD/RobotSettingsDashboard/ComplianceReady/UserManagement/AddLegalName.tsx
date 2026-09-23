import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StepMeter, TouchInputField } from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'

import { ChildNavigation } from '../../../ChildNavigation'
import styles from './user_management_settings.module.css'

import type { ReactNode } from 'react'

export function AddLegalName({
  onClickBack,
  onCancel,
  onContinue,
  totalSteps,
  currentStep,
  savedLegalName,
}: {
  onClickBack: (legalName?: string) => void
  onCancel: () => void
  onContinue: (username: string) => void
  totalSteps: number
  currentStep: number
  savedLegalName?: string
}): ReactNode {
  const [legalName, setLegalName] = useState<string | undefined>(savedLegalName)
  const { t } = useTranslation('device_settings')
  const keyboardRef = useRef(null)
  const inputElementRef = useRef(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setLegalName(e.target.value)
  }

  const handleConfirm = useCallback((): void => {
    if (!!legalName?.trim()) {
      onContinue(legalName.trim())
    }
  }, [legalName, onContinue])

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
        header={t('odd_add_legal_name_title')}
        onClickBack={() => {
          onClickBack(legalName)
        }}
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
      <div className={styles.odd_create_user_content}>
        <div className={styles.odd_create_user_input_container}>
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
