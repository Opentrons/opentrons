// @flow
import { AlertItem } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'

import type { SessionStatus, SessionStatusInfo } from '../../robot'
import { getSessionError } from '../../robot/selectors'
import styles from './styles.css'

const buildPauseMessage = (message: ?string): string =>
  message ? `: ${message}` : ''

const buildPause = (message: ?string): string =>
  `Run paused${buildPauseMessage(message)}`

const buildPauseUserMessage = (message: ?string) =>
  message && <div className={styles.pause_user_message}>{message}</div>

export type SessionAlertProps = {|
  sessionStatus: SessionStatus,
  sessionStatusInfo: SessionStatusInfo,
  className?: string,
  onResetClick: () => mixed,
|}

export function SessionAlert(props: SessionAlertProps): React.Node {
  const { sessionStatus, sessionStatusInfo, className, onResetClick } = props
  const sessionError = useSelector(getSessionError)

  switch (sessionStatus) {
    case 'finished':
      return (
        <AlertItem
          className={className}
          type="success"
          title={
            <p>
              Run complete! <a onClick={onResetClick}>Reset run</a> to run
              protocol again.
            </p>
          }
        />
      )

    case 'paused':
      return (
        <AlertItem
          className={className}
          type="info"
          icon={{ name: 'pause-circle' }}
          title={buildPause(sessionStatusInfo.message)}
        >
          {buildPauseUserMessage(sessionStatusInfo.userMessage)}
        </AlertItem>
      )

    case 'stopped':
      return (
        <AlertItem
          className={className}
          type="warning"
          title={
            <p>
              Run canceled. <a onClick={onResetClick}>Reset run</a> to run
              protocol again.
            </p>
          }
        />
      )

    case 'error':
      return (
        <AlertItem
          className={className}
          type="error"
          title={
            <p>
              Run encountered an error. <a onClick={onResetClick}>Reset run</a>{' '}
              to run protocol again. Please contact support if you need help
              resolving this issue.
            </p>
          }
        >
          {sessionError !== null && <p>{sessionError}</p>}
        </AlertItem>
      )

    default:
      return null
  }
}
