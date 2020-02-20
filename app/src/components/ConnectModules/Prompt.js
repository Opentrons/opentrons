// @flow
// prompt for ReviewModulesModal of labware calibration page
import * as React from 'react'

import { OutlineButton, AlertItem } from '@opentrons/components'

import styles from './styles.css'

export type PromptProps = {|
  modulesMissing: boolean,
  onClick: () => mixed,
|}

const missingAlertProps = {
  type: 'warning',
  title: 'Module Missing',
  className: styles.alert,
}

const connectedAlertProps = {
  type: 'success',
  title: 'Module succesfully detected.',
  className: styles.alert,
}

export function Prompt(props: PromptProps) {
  const { modulesMissing, onClick } = props

  const alert = modulesMissing ? (
    <AlertItem {...missingAlertProps} />
  ) : (
    <AlertItem {...connectedAlertProps} />
  )

  const message = modulesMissing
    ? 'Plug in and power up the required module(s) via USB to your robot.'
    : 'Module(s) successfully detected.'

  const buttonText = modulesMissing
    ? 'try searching for missing module(s)'
    : 'continue to labware setup'

  return (
    <div className={styles.prompt}>
      {alert}
      <p className={styles.prompt_text}>{message}</p>
      <OutlineButton
        className={styles.prompt_button}
        onClick={onClick}
        inverted
      >
        {buttonText}
      </OutlineButton>
    </div>
  )
}
