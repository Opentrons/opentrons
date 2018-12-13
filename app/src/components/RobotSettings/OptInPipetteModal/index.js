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
  const HEADING = 'Update available for P10 single-channel pipette'
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
          <strong>
            There is an updated aspiration function available for the P10
            single-channel pipette.
          </strong>
        </p>

        <p>
          This is a small but material change to the P10&apos;s pipetting
          performance based on an expanded data set. In particular, it decreases
          the low-volume µl-to-mm conversion factor to address under-aspiration
          issues.
        </p>

        <p>
          <strong>
            We strongly recommend you update your pipette function
          </strong>
          , unless you are an advanced user who has manually modified your P10S
          pipette&apos;s µl-to-mm conversion factor.
        </p>

        <p className={styles.footer}>
          * This setting can be changed in your robot&apos;s &quot;Advanced
          Settings&quot; menu. If you have any questions, please contact our
          Support Team.
        </p>
      </AlertModal>
    </Portal>
  )
}
