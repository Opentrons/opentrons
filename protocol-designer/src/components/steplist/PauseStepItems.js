// @flow
import * as React from 'react'
import { i18n } from '../../localization'
import { PDListItem } from '../lists'
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
    <React.Fragment>
      {message && <PDListItem>{message}</PDListItem>}
      {wait !== true && (
        <PDListItem>
          <span>
            {hours} {i18n.t('application.units.hours')}
          </span>
          <span>
            {minutes} {i18n.t('application.units.minutes')}
          </span>
          <span>
            {seconds} {i18n.t('application.units.seconds')}
          </span>
          <span />
          <span />
        </PDListItem>
      )}
    </React.Fragment>
  )
}
