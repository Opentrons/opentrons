import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import styles from './LabwareOverlays.module.css'

type BlockedSlotMessage =
  | 'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
  | 'MODULE_INCOMPATIBLE_LABWARE_SWAP'
  | 'LABWARE_INCOMPATIBLE_WITH_ADAPTER'

interface Props {
  x: number
  y: number
  width: number
  height: number
  message: BlockedSlotMessage
}

export const BlockedSlot = (props: Props): JSX.Element => {
  const { t } = useTranslation('deck')
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
        {t(`blocked_slot.${message}`)}
      </RobotCoordsForeignDiv>
    </g>
  )
}
