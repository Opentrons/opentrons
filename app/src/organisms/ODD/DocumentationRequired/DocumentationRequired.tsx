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
  const [keyboardOpen, setKeyboardOpen] = useState(true)
  const [textAreaHeight, setTextAreaHeight] = useState<string>('13.5625rem')
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  const trimmedNote = inputText.trim()
  const handleConfirm = (): void => {
    if (trimmedNote === '') return
    onConfirm(trimmedNote)
  }

  const handleKeyboardToggle = (): void => {
    setKeyboardOpen(open => !open)
    setTextAreaHeight(h => (h === '396px' ? '13.5625rem' : '396px'))
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
              height="13.5625rem"
              autoFocus
              height={textAreaHeight}
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
          isOpen={keyboardOpen}
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
