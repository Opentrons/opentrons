// @flow
import * as React from 'react'
import i18n from '../../localization'
import {START_TERMINAL_ITEM_ID} from '../../steplist'
import type { AlertLevel } from './types'
import {TerminalItemLink} from '../steplist/TerminalItem'
import styles from './contents.css'

type ErrorContentsProps = {
  errorType: string,
  level: AlertLevel,
}
const getContents = (props: ErrorContentsProps) => {
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
        return i18n.t(`alert.timeline.error.${props.errorType}.body`, {defaultValue: null})
    }
  } else if (props.level === 'form') {
    return i18n.t(`alert.form.error.${props.errorType}.body`, {defaultValue: null})
  } else {
    return null
  }
}

const ErrorContents = (props: ErrorContentsProps) => {
  const contents = getContents(props)
  if (!contents) return null
  return (
    <div className={styles.message}>{contents}</div>
  )
}

export default ErrorContents
