// @flow
import * as React from 'react'
import {AlertItem} from '@opentrons/components'
import type {SessionStatus} from '../../robot'

type Props = {
  sessionStatus: SessionStatus,
  className?: string
}

// TODO (ka 2018-5-21): only adding text without call to action until redux work in place
const COMPLETE_MESSAGE = 'Run complete'
const PAUSE_MESSAGE = 'Run paused'
const CANCEL_MESSAGE = 'Run canceled'

export default function SessionAlert (props: Props) {
  const {sessionStatus, className} = props
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
