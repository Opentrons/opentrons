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

import type { DocumentedAction } from '@opentrons/react-api-client'

interface DocumentationRequiredProps {
  username: string
  actionsToDocument: DocumentedAction[]
  onConfirm: (note: string) => void
  onBack: () => void
}

export function DocumentationRequired({
  username,
  actionsToDocument,
  onConfirm,
  onBack,
}: DocumentationRequiredProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const [inputText, setInputText] = useState<string>('')
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyboardToggle = (): void => {
    setKeyboardExpanded(prev => !prev)
  }

  const trimmedNote = inputText.trim()
  const handleConfirm = (): void => {
    if (trimmedNote === '') return
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
          buttonIsDisabled={trimmedNote === ''}
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
                onChange={e => {
                  setInputText(e.target.value)
                }}
                onBlur={e => {
                  e.target.focus()
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
            onChange={(input: string) => {
              setInputText(input)
              textAreaRef.current?.focus()
            }}
            keyboardRef={keyboardRef}
          />
        </AccordionKeyboard>
      </div>
    </>
  )
}
