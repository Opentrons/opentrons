import React from 'react'
import classnames from 'classnames'
import styles from './App.css'
import ConnectionPanel from './ConnectionPanel'

import Button from './Button'
import RunControl from './RunControl'

export default function App (props) {
  const {
    // state
    isNavPanelOpen,
    isConnected,
    isRunning,
    isPaused,
    errors,
    runCommands,
    // handlers
    onRunButtonClick,
    onNavButtonClick
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

  // TODO (ka) convert aside to sidebar component
  return (
    <div className={classnames(styles.run_wrapper, { [styles.open]: isNavPanelOpen })}>
      <header className={styles.menu}>
        <button
          className={styles.toggle_nav}
          onClick={onNavButtonClick}
        >
          &#9776;
        </button>
        {runButton}
      </header>
      <aside className={styles.sidebar} >
        <ConnectionPanel {...props} />
      </aside>
      {runControl}
      <main className={styles.task} />
    </div>
  )
}
