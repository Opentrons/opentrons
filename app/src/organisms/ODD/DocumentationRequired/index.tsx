import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { TouchTextAreaField } from '/app/molecules/TouchTextAreaField'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './documentationrequired.module.css'

import type { SetSettingOption } from '/app/organisms/ODD/RobotSettingsDashboard/types'

interface DocumentationRequiredProps {}

export function DocumentationRequired({}: DocumentationRequiredProps): JSX.Element {
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
          onClickBack={() => {}}
        />
        <div className={styles.content_container}>
          <div className={styles.text_area_container}>
            <TouchTextAreaField
              autoFocus
              value={inputText}
              ref={textAreaRef}
              label={t('access_control_note', { user: 'John Doe' })}
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
