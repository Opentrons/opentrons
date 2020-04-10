// @flow
import * as React from 'react'
import { i18n } from '../../localization'
import styles from './StepItem.css'
import type { PauseArgs } from '../../step-generation'
type Props = {
  pauseArgs: PauseArgs,
}

export function PauseStepItems(props: Props) {
  const { pauseArgs } = props
  if (!pauseArgs.meta) {
    // No message or time, show nothing
    return null
  }
  const { message, wait } = pauseArgs
  const { hours, minutes, seconds } = pauseArgs.meta
  return (
    <>
      {wait !== true ? (
        <>
          <li className={styles.substep_header}>
            <span>Pause for Time</span>
          </li>
          <li className={styles.substep_content}>
            <span className={styles.substep_time}>
              {hours} {i18n.t('application.units.hours')}
            </span>
            <span className={styles.substep_time}>
              {minutes} {i18n.t('application.units.minutes')}
            </span>
            <span className={styles.substep_time}>
              {seconds} {i18n.t('application.units.seconds')}
            </span>
          </li>
        </>
      ) : (
        <>
          <li className={styles.substep_header}>
            <span>Pause Until Told to Resume</span>
          </li>
        </>
      )}
      {message && (
        <li className={styles.substep_content}>&quot;{message}&quot;</li>
      )}
    </>
  )
}
