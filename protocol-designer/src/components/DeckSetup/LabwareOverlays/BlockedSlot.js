// @flow
import { RobotCoordsForeignDiv } from '@opentrons/components'
import * as React from 'react'

import { i18n } from '../../../localization'
import styles from './LabwareOverlays.css'

type BlockedSlotMessage =
  | 'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
  | 'MODULE_INCOMPATIBLE_LABWARE_SWAP'

type Props = {|
  x: number,
  y: number,
  width: number,
  height: number,
  message: BlockedSlotMessage,
|}

export const BlockedSlot = (props: Props): React.Node => {
  const { x, y, width, height, message } = props
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        className={styles.blocked_slot_background}
      />
      <RobotCoordsForeignDiv
        x={x}
        y={y}
        width={width}
        height={height}
        innerDivProps={{
          className: styles.blocked_slot_content,
        }}
      >
        {i18n.t(`deck.blocked_slot.${message}`)}
      </RobotCoordsForeignDiv>
    </g>
  )
}
