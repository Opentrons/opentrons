// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  modules?: any
}

export default function ModulesCardContents (props: Props) {
  return (
    <React.Fragment>
    <p className={styles.modules_description}>No modules detected.</p>

    <p className={styles.modules_description}>Connect a module to your robot via USB, then power it on.
    Press the refresh icon to the top to detect your module.</p>
    </React.Fragment>
  )
}
