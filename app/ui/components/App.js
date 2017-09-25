import React from 'react'
import PropTypes from 'prop-types'
import {Route} from 'react-router'

import Nav from '../containers/Nav'

import Button from './Button'
import RunControl from './RunControl'
import RunLog from './RunLog'
import grid from './Grid.css'

export default function App (props) {
  const {
    isReadyToRun,
    isRunning,
    isDone,
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
  if (isReadyToRun || isRunning || isDone) {
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
      <Nav />
      // TODO(mc, 2017-09-25): replace render prop with component prop per page
      <Route exact path='/' render={() => (
        <main className={grid.task}>
          <header className={grid.header}>
            {runButton}
          </header>
          {runControl}
          {runLog}
        </main>
      )} />
    </div>
  )
}

App.propTypes = {
  isReadyToRun: PropTypes.bool.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isPaused: PropTypes.bool.isRequired,
  isDone: PropTypes.bool.isRequired,
  onRunClick: PropTypes.func.isRequired
}
