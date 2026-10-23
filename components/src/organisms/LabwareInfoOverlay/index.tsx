import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { RobotCoordsForeignDiv } from '../../hardware-sim'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { DIRECTION_COLUMN, DISPLAY_FLEX, JUSTIFY_FLEX_END } from '../../styles'
import styles from './labwareinfooverlay.module.css'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

interface LabwareInfoProps {
  displayName: string
  labwareId: string
  labwareHasLiquid?: boolean
  hover?: boolean
}

const LabwareInfo = (props: LabwareInfoProps): JSX.Element | null => {
  const { displayName, labwareId, hover } = props

  return (
    <div
      className={styles.labware_info_container}
      style={{ backgroundColor: hover ? COLORS.blue50 : '#000000B3' }}
      id={`LabwareInfoOverlay_slot_${labwareId}_offsetBox`}
    >
      <div className={styles.labware_info_text_container}>
        {displayName}
        {props.labwareHasLiquid && (
          <Icon name="water" color={COLORS.white} width="0" minWidth="1rem" />
        )}
      </div>
    </div>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition
  labwareId: string
  displayName: string
  labwareHasLiquid?: boolean
  hover?: boolean
  xOffset?: number
  yOffset?: number
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): ReactNode => {
  const {
    definition,
    labwareId,
    displayName,
    labwareHasLiquid,
    xOffset,
    yOffset,
  } = props

  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)
  const dimensions = getSchema2Dimensions(definition)

  return (
    <RobotCoordsForeignDiv
      x={cornerOffsetFromSlot.x + (xOffset ?? 0)}
      y={cornerOffsetFromSlot.y + (yOffset ?? 0)}
      width={dimensions.xDimension}
      height={dimensions.yDimension}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
        transform: 'rotate(180deg) scaleX(-1)',
      }}
    >
      <LabwareInfo
        displayName={displayName}
        labwareId={labwareId}
        hover={props.hover}
        labwareHasLiquid={labwareHasLiquid}
      />
    </RobotCoordsForeignDiv>
  )
}
