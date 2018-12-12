// @flow
import * as React from 'react'
import {AlertModal} from '@opentrons/components'
import {Portal} from '../../portal'
import styles from './styles.css'
type Props = {
  setP10Setting: () => mixed,
  setP10WarningSeen: () => mixed,
}

export default function OptInModal (props: Props) {
  const {setP10Setting, setP10WarningSeen} = props
  const HEADING = 'Updated P10 Single Pipette Calibration'
  const buttons = [
    {onClick: setP10WarningSeen, children: 'not now'},
    {
      onClick: setP10Setting,
      children: 'Update Pipette Function',
      className: styles.width_auto,
    },
  ]
  return (
    <Portal>
      <AlertModal heading={HEADING} buttons={buttons} alertOverlay>
        <p>
          This release includes a refinement to the aspiration function of the
          P10 single-channel pipette based on an expanded data set.
        </p>

        <p>
          Note this is a small but material change to the P10&apos;s pipetting
          performance, in particular decreasing the low-volume µl-to-mm
          conversion factor to address under-aspiration issues.
        </p>

        <p>
          We recommend accepting this change, unless you are an advanced user
          who has manually modified your P10S pipette&apos;s µl-to-mm conversion
          factor
        </p>

        <p>
          To use the updated calibration, click &quot;Update P10 Pipette
          Function&quot;.
        </p>
        <p>
          To temporarily continue using your current calibration, click
          &quot;Not Now&quot;.
        </p>

        <p>
          Please note you can change your selection in the &apos;Advanced
          Settings&apos; menu. As always, please reach out to our team with any
          questions.
        </p>
      </AlertModal>
    </Portal>
  )
}
