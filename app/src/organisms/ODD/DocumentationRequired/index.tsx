import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { TouchTextAreaField } from '/app/molecules/TouchTextAreaField'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './documentationrequired.module.css'

interface DocumentationRequiredProps {
  userName: string
  onBack: () => void
}

export function DocumentationRequired({
  userName,
  onBack,
}: DocumentationRequiredProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const [inputText, setInputText] = useState<string>('')
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <>
      <div className={styles.container}>
        <ChildNavigation
          header={t('documentation_required')}
          buttonText={t('shared:confirm')}
          onClickButton={() => {}}
          buttonIsDisabled={inputText.trim() === ''}
          secondaryButtonProps={{
            buttonText: 'View actions',
            buttonType: 'tertiaryHighLight',
            iconName: 'information',
            iconPlacement: 'startIcon',
            onClick: () => {},
          }}
          onClickBack={onBack}
        />
        <div className={styles.content_container}>
          <div className={styles.text_area_container}>
            <TouchTextAreaField
              autoFocus
              value={inputText}
              ref={textAreaRef}
              label={t('access_control_note', { user: userName })}
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
      <div className={styles.keyboard_container}>
        <AccordionKeyboard isOpen onToggle={() => {}}>
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

interface DocumentationRequiredModalArgs {
  userName: string
}

/**
 * Imperative opener for `DocumentationRequired` rendered as a full-screen
 * overlay via NiceModal. Use from event handlers (e.g. tapping the run play
 * button) where you don't have a render slot for the screen.
 */
export const showDocumentationRequiredModal = (
  args: DocumentationRequiredModalArgs
): Promise<unknown> => NiceModal.show(DocumentationRequiredModal, args)

const DocumentationRequiredModal = NiceModal.create(
  ({ userName }: DocumentationRequiredModalArgs): JSX.Element => {
    const modal = useModal()
    return (
      <div className={styles.overlay}>
        <DocumentationRequired userName={userName} onBack={modal.remove} />
      </div>
    )
  }
)
