import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PauseArgs } from '@opentrons/step-generation'
import styles from './StepItem.module.css'
interface Props {
  pauseArgs: PauseArgs
}

export function PauseStepItems(props: Props): JSX.Element | null {
  const { pauseArgs } = props
  const { t } = useTranslation('application')
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
              {hours} {t('units.hours')}
            </span>
            <span className={styles.substep_time}>
              {minutes} {t('units.minutes')}
            </span>
            <span className={styles.substep_time}>
              {seconds} {t('units.seconds')}
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
