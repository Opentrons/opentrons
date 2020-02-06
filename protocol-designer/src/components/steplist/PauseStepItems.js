// @flow
import * as React from 'react'
import type { PauseArgs } from '../../step-generation'
import { PDListItem } from '../lists'

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
    <React.Fragment>
      {message && <PDListItem>{message}</PDListItem>}
      {wait !== true && (
        <PDListItem>
          <span>{hours} hr</span>
          <span>{minutes} m</span>
          <span>{seconds} s</span>
          <span />
          <span />
        </PDListItem>
      )}
    </React.Fragment>
  )
}
