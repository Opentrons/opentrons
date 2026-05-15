import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { TouchTextAreaField } from '/app/molecules/TouchTextAreaField'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './documentationrequired.module.css'

interface DocumentationRequiredProps {
  username: string
  onConfirm: (note: string) => void
  onBack: () => void
}

export function DocumentationRequired({
  username,
  onConfirm,
  onBack,
}: DocumentationRequiredProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const [inputText, setInputText] = useState<string>('')
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const textAreaHeight = keyboardExpanded ? '13.5625rem' : '24.75rem'

  const handleKeyboardToggle = (): void => {
    setKeyboardExpanded(prev => !prev)
  }

  const trimmedNote = inputText.trim()
  const handleConfirm = (): void => {
    if (trimmedNote === '') return
    onConfirm(trimmedNote)
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
            onClick: () => {},
          }}
          onClickBack={onBack}
        />
        <div className={styles.content_container}>
          <div className={styles.text_area_container}>
            <TouchTextAreaField
              height={textAreaHeight}
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
