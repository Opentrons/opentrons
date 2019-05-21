// @flow
import React from 'react'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'

import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import type { LabwareEntity } from '../../../step-forms'
import styles from './LabwareOverlays.css'
import LabwareName from './LabwareName'
import EditLabware from './EditLabware'
import BrowseLabware from './BrowseLabware'

type Props = {
  labwareEntity: LabwareEntity,
  selectedTerminalItemId: ?TerminalItemId,
  slot: DeckSlot,
}

const LabwareControls = (props: Props) => {
  const { labwareEntity, slot, selectedTerminalItemId } = props
  if (
    labwareEntity.def.parameters.quirks &&
    labwareEntity.def.parameters.quirks.includes('fixedTrash')
  )
    return null
  const canEdit = selectedTerminalItemId === START_TERMINAL_ITEM_ID
  return (
    <RobotCoordsForeignDiv
      key={slot.id}
      x={slot.position[0]}
      y={slot.position[1]}
      width={slot.boundingBox.xDimension}
      height={slot.boundingBox.yDimension}
      innerDivProps={{ className: styles.slot_ui }}
    >
      {canEdit ? (
        <EditLabware labwareEntity={labwareEntity} />
      ) : (
        <BrowseLabware labwareEntity={labwareEntity} />
      )}
      <LabwareName labwareEntity={labwareEntity} />
    </RobotCoordsForeignDiv>
  )
}

export default LabwareControls
