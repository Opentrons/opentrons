// @flow
import * as React from 'react'
import { Icon, PrimaryButton } from '@opentrons/components'
import styles from './styles.css'
import type { CalibrateTipLengthChildProps } from './types'
import * as Sessions from '../../sessions'

const COMPLETE_HEADER = 'Tip length calibration complete'
const RETURN_TIP = 'Return tip to tip rack'

export function CompleteConfirmation(
  props: CalibrateTipLengthChildProps
): React.Node {
  const exitSession = () => {
    props.sendSessionCommand(Sessions.tipCalCommands.EXIT)
    props.deleteSession()
  }
  return (
    <>
      <div className={styles.modal_icon_wrapper}>
        <Icon name="check-circle" className={styles.success_status_icon} />
        <h3>{COMPLETE_HEADER}</h3>
      </div>
      <PrimaryButton onClick={exitSession}>{RETURN_TIP}</PrimaryButton>
    </>
  )
}
