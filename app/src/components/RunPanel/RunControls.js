// @flow
// play pause run buttons for sidepanel
import * as React from 'react'
import {Link} from 'react-router-dom'
import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type RunProps = {
  disabled: boolean,
  isReadyToRun: boolean,
  isPaused: boolean,
  isRunning: boolean,
  onRunClick: () => mixed,
  onPauseClick: () => mixed,
  onResumeClick: () => mixed,
  onResetClick: () => mixed,
}
export default function RunControls (props: RunProps) {
  const {
    disabled,
    isReadyToRun,
    isPaused,
    isRunning,
    onRunClick,
    onPauseClick,
    onResumeClick,
    onResetClick,
  } = props

  const onPauseResumeClick = isPaused
    ? onResumeClick
    : onPauseClick

  const pauseResumeText = isPaused
    ? 'Resume'
    : 'Pause'

  let runButton
  let pauseResumeButton
  let cancelButton
  let resetButton

  if (isReadyToRun && !isRunning) {
    runButton = (
      <OutlineButton
        onClick={onRunClick}
        className={styles.run_button}
        disabled={disabled}
      >
        Start Run
      </OutlineButton>
    )
  } else if (isRunning) {
    pauseResumeButton = (
      <OutlineButton
        onClick={onPauseResumeClick}
        className={styles.run_button}
        disabled={disabled}
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
        disabled={disabled}
      >
        Cancel Run
      </OutlineButton>
    )
  } else {
    resetButton = (
      <OutlineButton
        onClick={onResetClick}
        className={styles.run_button}
        disabled={disabled}
      >
        Reset Run
      </OutlineButton>
    )
  }

  return (
    <div>
      {runButton}
      {pauseResumeButton}
      {cancelButton}
      {resetButton}
    </div>
  )
}
