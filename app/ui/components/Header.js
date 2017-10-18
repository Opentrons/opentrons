import React from 'react'
import styles from './App.css'

export default function Header (props) {
  const {sessionName} = props
  return (
    <header className={styles.task_header}>
      {sessionName}
    </header>
  )
}
