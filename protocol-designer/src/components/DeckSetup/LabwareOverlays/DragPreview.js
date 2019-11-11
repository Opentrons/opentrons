// @flow
import * as React from 'react'
import { DragLayer } from 'react-dnd'
import LabwareOnDeck from '../LabwareOnDeck'
import { DND_TYPES } from './constants'
import type { LabwareOnDeck as LabwareOnDeckType } from '../../../step-forms'
import type { RobotWorkSpaceRenderProps } from '@opentrons/components'
import styles from './DragPreview.css'

type DragPreviewProps = {
  isDragging: boolean,
  currentOffset?: { x: number, y: number },
  item: { labwareOnDeck: LabwareOnDeckType },
  itemType: string,
  getRobotCoordsFromDOMCoords: $PropertyType<
    RobotWorkSpaceRenderProps,
    'getRobotCoordsFromDOMCoords'
  >,
}

const LabwareDragPreview = (props: DragPreviewProps) => {
  const {
    item,
    itemType,
    isDragging,
    currentOffset,
    getRobotCoordsFromDOMCoords,
  } = props
  if (itemType !== DND_TYPES.LABWARE || !isDragging || !currentOffset)
    return null
  const { x, y } = currentOffset

  const cursor = getRobotCoordsFromDOMCoords(x, y)

  return (
    <LabwareOnDeck
      className={styles.labware_drag_preview}
      x={cursor.x}
      y={cursor.y - item.labwareOnDeck.def.dimensions.yDimension}
      labwareOnDeck={item.labwareOnDeck}
    />
  )
}

const DragPreview = DragLayer(monitor => ({
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
  itemType: monitor.getItemType(),
  item: monitor.getItem(),
}))(LabwareDragPreview)

export default DragPreview
