// @flow
import * as React from 'react'
import { DragLayer } from 'react-dnd'
import type { DeckSlotId } from '@opentrons/shared-data'
import { LabwareRender } from '@opentrons/components'
import { DND_TYPES } from '../../labware/LabwareOnDeck/constants'
import styles from './LabwareOverlays.css'

type DragPreviewProps = {
  getXY: (rawX: number, rawY: number) => { scaledX?: number, scaledY?: number },
  isDragging: boolean,
  currentOffset?: { x: number, y: number },
  item: { slot: DeckSlotId, labwareOrSlot: React.Node, containerId: string },
  itemType: string,
  containerType: string,
  children: React.Node,
}

const DragPreview = (props: DragPreviewProps) => {
  const {
    item,
    itemType,
    isDragging,
    currentOffset,
    getRobotCoordsFromDOM,
  } = props
  if (itemType !== DND_TYPES.LABWARE || !isDragging || !currentOffset)
    return null
  const { x, y } = currentOffset

  const cursor = getRobotCoordsFromDOM(x, y)

  return (
    <g transform={`translate(${cursor.x}, ${cursor.y})`}>
      <LabwareRender definition={item && item.def} />
    </g>
  )
}

const DragPreviewLayer = DragLayer(monitor => ({
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
  itemType: monitor.getItemType(),
  item: monitor.getItem(),
}))(DragPreview)

export default DragPreviewLayer
