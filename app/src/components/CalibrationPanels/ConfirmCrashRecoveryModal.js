// @flow
import * as React from 'react'

import { AlertModal, FONT_WEIGHT_BOLD, Text } from '@opentrons/components'

export type ConfirmCrashRecoveryModalProps = {|
  back: () => mixed,
  confirm: () => mixed,
  tipRackDisplayName: string,
  tipRackSlot: string,
  requiresNewTip: boolean,
|}

const HEADING = 'Start Over?'
const MAIN_BODY = 'Starting over will cancel your calibration progress.'
const CANCEL = 'cancel'
const START_OVER = 'yes, start over'
const CONFIRM_AND_START_OVER = 'confirm tip placement in a1 and start over'
const buildTiprackRequest: (string, string) => string = (displayName, slot) =>
  `Please put another tip in position A1 of the ${displayName} in slot ${slot}`

export function ConfirmCrashRecoveryModal(
  props: ConfirmCrashRecoveryModalProps
): React.Node {
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
      buttons={[
        { children: CANCEL, onClick: back },
        {
          children: requiresNewTip ? CONFIRM_AND_START_OVER : START_OVER,
          onClick: confirm,
        },
      ]}
      alertOverlay
      iconName={null}
    >
      <Text>{MAIN_BODY}</Text>
      {requiresNewTip && (
        <Text fontWeight={FONT_WEIGHT_BOLD}>
          {buildTiprackRequest(tipRackDisplayName, tipRackSlot)}
        </Text>
      )}
    </AlertModal>
  )
}
