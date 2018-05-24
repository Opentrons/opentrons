// @flow
// play pause run buttons for sidepanel
import * as React from 'react'
import {Link} from 'react-router-dom'
import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type RunProps = {
  isReadyToRun: boolean,
  isPaused: boolean,
  isRunning: boolean,
  onRunClick: () => void,
  onPauseClick: () => void,
  onResumeClick: () => void,
}
export default function (props: RunProps) {
  const {isReadyToRun, isPaused, isRunning, onRunClick, onPauseClick, onResumeClick} = props
  const onPauseResumeClick = isPaused
    ? onResumeClick
    : onPauseClick

  const pauseResumeText = isPaused
    ? 'Resume'
    : 'Pause'

  let runButton
  let pauseResumeButton
  let cancelButton
  if (!isRunning) {
    runButton = (
      <OutlineButton
        onClick={onRunClick}
        className={styles.run_button}
        disabled={!isReadyToRun}
      >
        Start Run
      </OutlineButton>
    )
  } else {
    pauseResumeButton = (
      <OutlineButton
        onClick={onPauseResumeClick}
        className={styles.run_button}
        disabled={!isRunning}
      >
        {pauseResumeText}
      </OutlineButton>
    )
    cancelButton = (
      <OutlineButton
        Component={Link}
        to={'/run/cancel'}
        onClick={onPauseClick}
        className={styles.run_button}
        disabled={!isRunning}
      >
        Cancel Job
      </OutlineButton>
    )
  }
  return (
    <div>
      {runButton}
      {pauseResumeButton}
      {cancelButton}
    </div>
  )
}
