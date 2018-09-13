// @flow
import * as React from 'react'
import i18n from '../../localization'
import {START_TERMINAL_ITEM_ID} from '../../steplist'
import type AlertLevel from './types'
import TerminalItemLink from './TerminalItemLink'

type ErrorContentsProps = {
  errorType: string,
  level: AlertLevel
}
const ErrorContents = (props: ErrorContentsProps) => {
  if (props.level === 'timeline') {
    switch (props.errorType) {
      case 'INSUFFICIENT_TIPS':
        return (
          <React.Fragment>
            {i18n.t(`alert.timeline.error.${props.errorType}.body`, {defaultValue: ''})}
            <TerminalItemLink terminalId={START_TERMINAL_ITEM_ID} />
          </React.Fragment>
        )
      default:
        return (
          <React.Fragment>
            {i18n.t(`alert.timeline.error.${props.errorType}.body`, {defaultValue: ''})}
          </React.Fragment>
        )
    }
  } else if (props.level === 'form') {
    return (
      <React.Fragment>
        {i18n.t(`alert.form.error.${props.errorType}.body`, {defaultValue: ''})}
      </React.Fragment>
    )
  } else {
    return null
  }
}

export default ErrorContents
