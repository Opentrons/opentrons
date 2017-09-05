import React from 'react'
import PropTypes from 'prop-types'
import Button from './Button'
import SideBar from './SideBar'
import RunControl from './RunControl'
import RunLog from './RunLog'
import grid from './Grid.css'

export default function App (props) {
  const {
    // state
    isRunning,
    isReadyToRun,
    onRunClick
  } = props
  let runControl
  let runLog

  // mock prop for styling
  const startTime = Date.now()
  const timeRemaining = '00:03:25' // swap out for timer
  let runButton
  if (!isRunning) {
    runButton = (
      <Button
        onClick={onRunClick}
        disabled={!isReadyToRun}
        style={grid.run}
      >
        Run Job
      </Button>
    )
  }
  if (isReadyToRun) {
    runControl = (
      <RunControl
        style={grid.controls}
        {...{startTime, timeRemaining}}
        {...props}
      />
    )
    runLog = <RunLog style={grid.maintask} {...props} />
  }

  return (
    <div className={grid.wrapper}>
      <SideBar {...props} />
      <main className={grid.task}>
        <header className={grid.header}>
          {runButton}
        </header>
        {runControl}
        {runLog}
      </main>
    </div>
  )
}

App.propTypes = {
  onRunClick: PropTypes.func.isRequired
}
