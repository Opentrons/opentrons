import React from 'react'

import styles from './App.css'
import Connection from './Connection'
import Button from './Button'
import RunControl from './RunControl'

export default function App (props) {
  const {
    // state
    isConnected,
    isRunning,
    isPaused,
    errors,
    runCommands,
    // handlers
    onRunButtonClick
  } = props

  let runButton
  let runControl
  if (!isRunning) {
    runButton = (
      <Button
        onClick={onRunButtonClick}
        disabled={!isConnected}
        style={styles.run}
      >
        Run Job
      </Button>
    )

    runControl = (
      <section className={styles.run_progress} />
    )
  } else {
    runControl = (
      <RunControl
        style={styles.run_progress}
        isRunning={isRunning}
        isPaused={isPaused}
        errors={errors}
        commands={runCommands}
      />
    )
  }

  return (
    <div className={styles.run_wrapper}>
      <header className={styles.menu}>
        {runButton}
      </header>
      <aside className={styles.sidebar} />
      <div className={styles.connect}>
        <Connection {...props} />
      </div>
      {runControl}
      <main className={styles.task} />
    </div>
  )
}
