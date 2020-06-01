// @flow
// play pause run buttons for sidepanel
import * as React from 'react'
import { Link } from 'react-router-dom'
import { OutlineButton, HoverTooltip } from '@opentrons/components'

import styles from './styles.css'

const MISSING_MODULES =
  'Please attach all required modules before running this protocol'

export type RunControlsProps = {|
  disabled: boolean,
  modulesReady: boolean,
  isReadyToRun: boolean,
  isPaused: boolean,
  isRunning: boolean,
  onRunClick: () => mixed,
  onPauseClick: () => mixed,
  onResumeClick: () => mixed,
  onResetClick: () => mixed,
|}

export function RunControls(props: RunControlsProps) {
  const {
    disabled,
    modulesReady,
    isReadyToRun,
    isPaused,
    isRunning,
    onRunClick,
    onPauseClick,
    onResumeClick,
    onResetClick,
  } = props

  const onPauseResumeClick = isPaused ? onResumeClick : onPauseClick

  const pauseResumeText = isPaused ? 'Resume' : 'Pause'

  let runButton
  let pauseResumeButton
  let cancelButton
  let resetButton

  if (isReadyToRun && !isRunning) {
    // TODO(mc, 2019-09-03): add same check for pipettes
    const runDisabled = disabled || !modulesReady
    const tooltip = modulesReady ? null : MISSING_MODULES

    runButton = (
      <HoverTooltip tooltipComponent={tooltip}>
        {hoverTooltipHandlers => (
          <div {...hoverTooltipHandlers}>
            <OutlineButton
              onClick={onRunClick}
              className={styles.run_button}
              disabled={runDisabled}
            >
              Start Run
            </OutlineButton>
          </div>
        )}
      </HoverTooltip>
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
    <>
      {runButton}
      {pauseResumeButton}
      {cancelButton}
      {resetButton}
    </>
  )
}
