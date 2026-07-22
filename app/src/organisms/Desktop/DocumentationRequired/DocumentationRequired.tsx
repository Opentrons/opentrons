import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StyledText,
  TextAreaField,
} from '@opentrons/components'

import { ActionList } from '/app/organisms/ActionItems/ActionList'

import styles from './documentationrequired.module.css'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

interface DocumentationRequiredProps {
  username: string
  actionsToDocument: DocumentedAction[]
  onConfirm: (note: string) => void
  onClose: () => void
  minReportLength: number
  initialDocreport?: DocumentationReport
}

export function DocumentationRequired({
  username,
  actionsToDocument,
  onConfirm,
  onClose,
  minReportLength,
  initialDocreport,
}: DocumentationRequiredProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const [inputText, setInputText] = useState<string>(initialDocreport ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (value: string): void => {
    setInputText(value)
    setError(null)
  }

  const trimmedNote = inputText.trim()
  const handleConfirm = (): void => {
    if (trimmedNote === '') return
    if (trimmedNote.length < minReportLength) {
      setError(t('must_be_at_least_characters', { minLength: minReportLength }))
      return
    }
    onConfirm(trimmedNote)
  }

  const footer = (
    <div className={styles.button_container}>
      <SecondaryButton onClick={onClose}>{t('cancel_action')}</SecondaryButton>
      <PrimaryButton onClick={handleConfirm} disabled={trimmedNote === ''}>
        {t('shared:confirm')}
      </PrimaryButton>
    </div>
  )

  return (
    <Modal
      title={t('documentation_required')}
      onClose={onClose}
      closeOnOutsideClick={false}
      zIndexOverlay={1000}
      width="47rem"
      height="30rem"
      overflowY="hidden"
      footer={footer}
    >
      <div className={styles.container}>
        <div className={styles.text_area_container}>
          <div className={styles.text_area_field_fill}>
            <TextAreaField
              multiline
              value={inputText}
              error={error}
              // reserve space for the error line so the textarea height
              // doesn't shift when an error appears; text only shows on error
              caption={minReportLength > 0 ? '\u00A0' : undefined}
              onChange={e => {
                handleInputChange(e.target.value)
              }}
              label={t('access_control_note', { user: username })}
            />
          </div>
        </div>
        <div className={styles.action_list_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('action_list')}
          </StyledText>
          <ActionList
            actionsToDocument={actionsToDocument}
            className={styles.action_list}
          />
        </div>
      </div>
    </Modal>
  )
}
