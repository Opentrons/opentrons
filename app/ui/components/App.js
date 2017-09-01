import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './App.css'
import grid from './Grid.css'
import SideBar from './SideBar'
// import UploadPanel from './UploadPanel'
// import ConnectionPanel from './ConnectionPanel'
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
        style={grid.controls}
        {...{startTime, timeRemaining}}
        {...props}
      />
    )

    runLog = <RunLog style={grid.maintask} {...props} />
  }

  // TODO (ka) convert aside to sidebar class based component,
  // toggle side panel content based on selected icon rather than isNavPanelOpen bool and onNavClick handler, remove hamburger
  // refactor top level component jsx and css layout accordingly
  // return (
  //   <div className={classnames(styles.run_wrapper, { [styles.open]: isNavPanelOpen })}>
  //     <header className={styles.menu}>
  //       {runButton}
  //     </header>
  //     <aside className={styles.sidebar} >
  //       <UploadPanel {...props} protocolName={'dino.py'} />
  //       <ConnectionPanel {...props} />
  //     </aside>
  //     {runControl}
  //     {runLog}
  //   </div>
  // )

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
  onNavClick: PropTypes.func.isRequired
}
