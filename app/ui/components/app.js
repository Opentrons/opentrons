import React from 'react'
import styles from './app.css'

import Connection from './Connection'
import Button from './Button'



export default function App () {
  const running = false
  return (
    <div className={styles.run_wrapper}>
      <header className={styles.menu}>
        <Button onClick= {() => { console.log('run')}} disabled={running} style={styles.run}>Run Job</Button>
      </header>
      <aside className={styles.sidebar} />
      <div className={styles.connect}>
        <Connection />
      </div>
      <section className={styles.run_progress} />
      <main className={styles.task} />
    </div>
  )
}
