import * as React from 'react'
import { useDragLayer, XYCoord } from 'react-dnd'
import { LabwareOnDeck } from '../LabwareOnDeck'
import { DND_TYPES } from '../../../constants'
import { RobotWorkSpaceRenderProps } from '@opentrons/components'
import styles from './DragPreview.css'

interface DragPreviewProps {
  getRobotCoordsFromDOMCoords: RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords']
}

export const DragPreview = (props: DragPreviewProps): JSX.Element | null => {
  const { getRobotCoordsFromDOMCoords } = props
  const { item, itemType, isDragging, currentOffset } = useDragLayer(
    monitor => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getSourceClientOffset(),
    })
  )

  if (!isDragging || !currentOffset || itemType !== DND_TYPES.LABWARE) {
    return null
  }

  const { x, y } = currentOffset
  const cursor: XYCoord = getRobotCoordsFromDOMCoords(x, -y)

  return (
    <LabwareOnDeck
      className={styles.labware_drag_preview}
      x={cursor.x}
      y={cursor.y + 475}
      labwareOnDeck={item.labwareOnDeck}
    />
  )
}
