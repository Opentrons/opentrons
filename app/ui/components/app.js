import React from 'react'
import styles from './app.css'

export default function App () {
  return (
    <div className={styles.run_wrapper}>
      <header className={styles.menu} />
      <aside className={styles.sidebar} />
      <div className={styles.connect} />
      <section className={styles.run_progress} />
      <main className={styles.task} />
    </div>
  )
}
