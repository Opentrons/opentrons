import React from 'react'
import PropTypes from 'prop-types'
import grid from './Grid.css'
import SideBar from './SideBar'
import RunControl from './RunControl'
import RunLog from './RunLog'

export default function App (props) {
  const {
    // state
    isReadyToRun
  } = props
  let runControl
  let runLog

  // mock prop for styling
  const startTime = Date.now()
  const timeRemaining = '00:03:25' // swap out for timer

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
        <header className={grid.header} />
        {runControl}
        {runLog}
      </main>
    </div>
  )
}

App.propTypes = {
  onNavClick: PropTypes.func.isRequired
}
