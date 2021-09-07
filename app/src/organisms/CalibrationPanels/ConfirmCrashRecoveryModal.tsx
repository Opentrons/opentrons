import * as React from 'react'

import {
  AlertModal,
  FONT_WEIGHT_SEMIBOLD,
  Text,
  SecondaryBtn,
} from '@opentrons/components'
import styles from './styles.css'

export interface ConfirmCrashRecoveryModalProps {
  back: () => unknown
  confirm: () => unknown
  tipRackDisplayName: string
  tipRackSlot: string
  requiresNewTip: boolean
}

const HEADING = 'Start Over?'
const MAIN_BODY =
  "Starting over will cancel your calibration progress. It's important to use an undamaged tip while you calibrate your robot."
const CANCEL = 'cancel'
const START_OVER = 'yes, start over'
const CONFIRM_AND_START_OVER = 'tip placed in a1, start over'
const buildTiprackRequest = (displayName: string, slot: string): string =>
  `Please put an undamaged tip in position A1 of the ${displayName} in slot ${slot}.`

export function ConfirmCrashRecoveryModal(
  props: ConfirmCrashRecoveryModalProps
): JSX.Element {
  const {
    back,
    confirm,
    tipRackDisplayName,
    tipRackSlot,
    requiresNewTip,
  } = props

  return (
    <AlertModal
      heading={HEADING}
      className={styles.confirm_crash_modal}
      buttons={[
        { Component: SecondaryBtn, children: CANCEL, onClick: back },
        {
          Component: SecondaryBtn,
          children: requiresNewTip ? CONFIRM_AND_START_OVER : START_OVER,
          onClick: confirm,
          width: '17rem',
        },
      ]}
      alertOverlay
      iconName={null}
    >
      <Text>{MAIN_BODY}</Text>
      {requiresNewTip && (
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>
          {buildTiprackRequest(tipRackDisplayName, tipRackSlot)}
        </Text>
      )}
    </AlertModal>
  )
}
