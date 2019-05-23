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

const EmptyDestinationSlot = (props: Props) => {
  console.table(props)
  return (
    <RobotCoordsForeignDiv
      width={props.slot.boundingBox.xDimension}
      height={props.slot.boundingBox.yDimension}
      innerDivProps={{
        className: cx(styles.slot_overlay, styles.appear_on_mouseover),
      }}
    >
      <a className={styles.overlay_button}>
        {i18n.t('deck.overlay.slot.place_here')}
      </a>
    </RobotCoordsForeignDiv>
  )
}

export default EmptyDestinationSlot
