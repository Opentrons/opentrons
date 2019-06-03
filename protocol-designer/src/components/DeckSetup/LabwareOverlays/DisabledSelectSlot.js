// @flow
import React from 'react'
import cx from 'classnames'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'
import i18n from '../../../localization'
import styles from './LabwareOverlays.css'

type Props = {|
  slot: DeckSlot,
|}

const DisabledSelectSlot = (props: Props) => (
  <RobotCoordsForeignDiv
    width={props.slot.boundingBox.xDimension}
    height={props.slot.boundingBox.yDimension}
    innerDivProps={{
      className: cx(styles.slot_overlay, styles.disabled),
    }}
  >
    <a className={styles.overlay_button}>
      {i18n.t('deck.overlay.slot.drag_to_new_slot')}
    </a>
  </RobotCoordsForeignDiv>
)

export default DisabledSelectSlot
