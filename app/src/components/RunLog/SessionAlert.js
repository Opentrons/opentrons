// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import type {SessionStatus} from '../../robot'

type Props = {
  sessionStatus: SessionStatus,
  className?: string,
  onResetClick: () => mixed
}

export default function SessionAlert (props: Props) {
  const {sessionStatus, className, onResetClick} = props

  const COMPLETE_MESSAGE = (<p>Run  complete! <a onClick={onResetClick}>Reset run</a> to run protocol again.</p>)
  const PAUSE_MESSAGE = 'Run paused'
  const CANCEL_MESSAGE = (<p>Run  canceled. <a onClick={onResetClick}>Reset run</a> to run protocol again.</p>)

  switch (sessionStatus) {
    case 'finished':
      return (
        <AlertItem
          type='success'
          title={COMPLETE_MESSAGE}
          className={className}
        />
      )
    case 'paused':
      return (
        <AlertItem
          type='info'
          title={PAUSE_MESSAGE}
          className={className}
          icon={{name: 'pause-circle'}}
        />
      )
    case 'stopped':
      return (
        <AlertItem
        type='warning'
        title={CANCEL_MESSAGE}
        className={className}
      />)
    default:
      return null
  }
}
