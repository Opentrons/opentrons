import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal from '@ebay/nice-modal-react'
import clsx from 'clsx'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { TouchTextAreaField } from '/app/molecules/TouchTextAreaField'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ActionsView } from './ActionsView'
import styles from './documentationrequired.module.css'

import type { ReactNode } from 'react'
import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

interface DocumentationRequiredProps {
  username: string
  actionsToDocument: DocumentedAction[]
  onConfirm: (note: string) => void
  onBack: () => void
  minReportLength: number
  initialDocreport?: DocumentationReport
}

export function DocumentationRequired({
  username,
  actionsToDocument,
  onConfirm,
  onBack,
  minReportLength,
  initialDocreport,
}: DocumentationRequiredProps): ReactNode {
  const { t } = useTranslation(['access_control', 'shared'])
  const [inputText, setInputText] = useState<string>(initialDocreport ?? '')
  const [error, setError] = useState<string | null>(null)
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyboardToggle = (): void => {
    setKeyboardExpanded(prev => !prev)
  }

  const handleInputChange = (value: string): void => {
    setInputText(value)
    setError(null)
  }

  const trimmedNote = inputText.trim()
  const handleConfirm = (): void => {
    if (trimmedNote === '') {
      setError(t('documentation_is_required') as string)
      return
    }
    if (trimmedNote.length < minReportLength) {
      setError(
        t('must_be_at_least_characters', {
          minLength: minReportLength,
        }) as string
      )
      return
    }
    onConfirm(trimmedNote)
  }

  const handleViewActions = async (): Promise<void> => {
    await NiceModal.show(ActionsView, {
      actionsToDocument,
    })
  }

  return (
    <>
      <div className={styles.container}>
        <ChildNavigation
          header={t('documentation_required')}
          buttonText={t('shared:confirm')}
          onClickButton={handleConfirm}
          secondaryButtonProps={{
            buttonText: 'View actions',
            buttonType: 'tertiaryHighLight',
            iconName: 'information',
            iconPlacement: 'startIcon',
            onClick: handleViewActions,
          }}
          onClickBack={onBack}
        />
        <div className={styles.content_container}>
          <div
            className={clsx(
              styles.text_area_container,
              keyboardExpanded
                ? styles.text_area_container_keyboard_expanded
                : styles.text_area_container_keyboard_collapsed
            )}
          >
            <div className={styles.text_area_field_fill}>
              <TouchTextAreaField
                multiline
                autoFocus
                value={inputText}
                ref={textAreaRef}
                label={t('access_control_note', { user: username })}
                error={error}
                onChange={e => {
                  handleInputChange(e.target.value)
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.keyboard_container}>
        <AccordionKeyboard
          isOpen={keyboardExpanded}
          onToggle={handleKeyboardToggle}
        >
          <FullKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={textAreaRef}
          />
        </AccordionKeyboard>
      </div>
    </>
  )
}
