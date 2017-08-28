import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './App.css'
import ConnectionPanel from './ConnectionPanel'
import Button from './Button'
import RunControl from './RunControl'
import RunLog from './RunLog'

export default function App (props) {
  const {
    // state
    isNavPanelOpen,
    isReadyToRun,
    isRunning,
    // handlers
    onRunClick,
    onNavClick
  } = props
  let runButton
  let runControl
  let runLog

  // mock prop for styling
  const startTime = Date.now()
  const timeRemaining = '00:03:25' // swap out for timer

  if (!isRunning) {
    runButton = (
      <Button
        onClick={onRunClick}
        disabled={!isReadyToRun}
        style={styles.run}
      >
        Run Job
      </Button>
    )
  }

  if (isReadyToRun) {
    runControl = (
      <RunControl
        style={styles.run_controls}
        {...{startTime, timeRemaining}}
        {...props}
      />
    )

    runLog = <RunLog style={styles.task} {...props} />
  }

  // TODO (ka) convert aside to sidebar component
  return (
    <div className={classnames(styles.run_wrapper, { [styles.open]: isNavPanelOpen })}>
      <header className={styles.menu}>
        <button
          className={styles.toggle_nav}
          onClick={onNavClick}
        >
          &#9776;
        </button>
        {runButton}
      </header>
      <aside className={styles.sidebar} >
        <ConnectionPanel {...props} />
      </aside>
      {runControl}
      {runLog}
    </div>
  )
}

App.propTypes = {
  onNavClick: PropTypes.func.isRequired
}
