import { useRef, useState } from 'react'

import { Btn, InputField } from '@opentrons/components'

import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './login.module.css'

export function Login(): JSX.Element {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef(null)
  return (
    <>
      <div className={styles.nav_container}>
        <ChildNavigation
          header="Login"
          buttonText="next"
          secondaryButtonProps={{
            buttonText: 'cancel',
            buttonType: 'tertiaryLowLight',
            onClick: () => {
              // navigate(-1)
            },
          }}
          onClickButton={() => {}}
        />
      </div>
      <div className={styles.form_container}>
        <h4 className={styles.field_label}>Username</h4>
        <InputField
          type="text"
          size="medium"
          onFocus={() => setShowKeyboard(true)}
        />
      </div>
      {showKeyboard && (
        <div className={styles.keyboard_container}>
          <FullKeyboard
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        </div>
      )}
    </>
  )
}
