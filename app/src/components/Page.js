// task component
import React from 'react'

import styles from './Page.css'
import LostConnectionAlert from '../components/LostConnectionAlert'

export default function Page (props) {
  return (
    <main className={styles.task}>
      {props.children}
      <LostConnectionAlert />
    </main>
  )
}
