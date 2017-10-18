import React from 'react'
import {Link} from 'react-router-dom'
import styles from './App.css'

export default function Header (props) {
  const {sessionName} = props
  return (
    <header className={styles.task_header}>
      <Link to='/upload'>{sessionName}</Link>
    </header>
  )
}
