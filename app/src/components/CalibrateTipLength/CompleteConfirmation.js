// @flow
import { Icon, PrimaryButton } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'

const COMPLETE_HEADER = 'Tip length calibration complete'
const COMPLETE_BODY =
  'Remove Calibration Block from the deck and select where to dispose of tip.'
const RETURN_TIP = 'Return tip to tip rack'

export function CompleteConfirmation(
  props: CalibrateTipLengthChildProps
): React.Node {
  const exitSession = () => {
    console.log('TODO: wire up command')
    // props.exitSession()
  }
  return (
    <>
      <div className={styles.modal_icon_wrapper}>
        <Icon name="check-circle" className={styles.success_status_icon} />
        <h3>{COMPLETE_HEADER}</h3>
      </div>
      <div className={styles.complete_summary}>{COMPLETE_BODY}</div>
      <PrimaryButton onClick={exitSession}>{RETURN_TIP}</PrimaryButton>
    </>
  )
}
