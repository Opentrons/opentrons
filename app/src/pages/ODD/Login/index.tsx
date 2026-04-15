import {
  Btn,
  InputField,
} from '@opentrons/components'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './login.module.css'

export function Login(): JSX.Element {
  return (
    <>
      <div className={styles.nav_container}>
        <ChildNavigation
          header="Login"
          buttonText="Login"
          onClickButton={() => {}}
        />
      </div>
      <div className={styles.form_container}>
        <h4>username</h4>
        <InputField type="text" size="medium" />
        <Btn onClick={() => {}}>Login</Btn>
      </div>
    </>
  )
}
