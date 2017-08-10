import React from 'react'
import styles from './app.css'

export default function App () {
  return (
    <div className={styles.wrapper}>
      <header className={styles.menu} />
      <aside className={styles.sidebar} />
      <div className={styles.connect} />
      <main className={styles.task} />
    </div>
  )
}
