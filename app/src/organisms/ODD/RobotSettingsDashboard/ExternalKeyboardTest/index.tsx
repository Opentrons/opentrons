import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { TouchTextAreaField } from '/app/molecules/TouchTextAreaField'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './externalkeyboardtest.module.css'

import type { SetSettingOption } from '../types'

interface ExternalKeyboardTestProps {
  robotName: string
  setCurrentOption: SetSettingOption
}
// Note
// this component is to test TouchTextAreaField with FullKeyboard and external keyboard
// + AccordionKeyboard
export function ExternalKeyboardTest({
  robotName,
  setCurrentOption,
}: ExternalKeyboardTestProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const [inputText, setInputText] = useState<string>('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true)
  const keyboardRef = useRef(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  return (
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
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <div className={styles.content_container}>
        <div className={styles.text_area_container}>
          <TouchTextAreaField
            autoFocus
            value={inputText}
            ref={textAreaRef}
            label="Note for robot audit log by '<user>'"
            onChange={e => {
              setInputText(e.target.value)
            }}
            onBlur={e => {
              e.target.focus()
            }}
            height={isKeyboardOpen ? '11.3rem' : '22.5rem'}
          />
        </div>
      </div>
      <div className={styles.keyboard_container}>
        <AccordionKeyboard
          isOpen={isKeyboardOpen}
          onToggle={() => {
            setIsKeyboardOpen(prev => !prev)
          }}
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
    </div>
  )
}
