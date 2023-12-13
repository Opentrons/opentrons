import * as React from 'react'
import { DragLayer } from 'react-dnd'
import { LabwareOnDeck } from '../LabwareOnDeck'
import { DND_TYPES } from '../../../constants'
import { LabwareOnDeck as LabwareOnDeckType } from '../../../step-forms'
import { RobotWorkSpaceRenderProps } from '@opentrons/components'
import styles from './DragPreview.module.css'

interface DragPreviewProps {
  isDragging: boolean
  currentOffset?: { x: number; y: number }
  item: { labwareOnDeck: LabwareOnDeckType }
  itemType: string
  getRobotCoordsFromDOMCoords: RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords']
}

const LabwareDragPreview = (props: DragPreviewProps): JSX.Element | null => {
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

export const DragPreview = DragLayer<
  Omit<DragPreviewProps, 'currentOffset' | 'isDragging' | 'itemType' | 'item'>
>(monitor => ({
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
  itemType: monitor.getItemType(),
  item: monitor.getItem(),
}))(LabwareDragPreview)
