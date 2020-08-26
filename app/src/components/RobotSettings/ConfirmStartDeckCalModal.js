// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import styles from './styles.css'

export type ConfirmStartDeckCalModalProps = {|
  cancel: () => mixed,
  confirm: () => mixed,
|}

const HEADING = 'Are you sure you want to continue?'
const CANCEL = 'cancel'
const EXIT = 'continue'
const WARNING =
  'Performing a deck calibration will clear your pipette offset calibrations.'

export function ConfirmStartDeckCalModal(
  props: ConfirmStartDeckCalModalProps
): React.Node {
  const { cancel, confirm } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: CANCEL, onClick: cancel },
        { children: EXIT, onClick: confirm },
      ]}
      alertOverlay
      iconName={null}
      className={styles.confirm_start_deck_cal_modal}
    >
      {WARNING}
    </AlertModal>
  )
}
