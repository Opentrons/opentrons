// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'
import styles from './styles.css'

export type ConfirmStartDeckCalModalProps = {|
  cancel: () => mixed,
  confirm: () => mixed,
|}

const HEADING = 'Are you sure you want to recalibrate your deck?'
const CANCEL = 'cancel'
const EXIT = 'continue'
const WARNING =
  'Performing a deck calibration will clear all of your pipette offset and tip length calibrations. You will need to recalibrate your pipette offset and tip length after completing a deck calibration.'

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
