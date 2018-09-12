// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import type {SessionStatus} from '../../robot'

type Props = {
  sessionStatus: SessionStatus,
  className?: string,
  onResetClick: () => mixed,
}

export default function SessionAlert (props: Props) {
  const {sessionStatus, className, onResetClick} = props

  const completeMessage = (<p>Run  complete! <a onClick={onResetClick}>Reset run</a> to run protocol again.</p>)
  const pauseMessage = 'Run paused'
  const cancelMessage = (<p>Run  canceled. <a onClick={onResetClick}>Reset run</a> to run protocol again.</p>)

  switch (sessionStatus) {
    case 'finished':
      return (
        <AlertItem
          type='success'
          title={completeMessage}
          className={className}
        />
      )
    case 'paused':
      return (
        <AlertItem
          type='info'
          title={pauseMessage}
          className={className}
          icon={{name: 'pause-circle'}}
        />
      )
    case 'stopped':
      return (
        <AlertItem
        type='warning'
        title={cancelMessage}
        className={className}
      />)
    default:
      return null
  }
}
