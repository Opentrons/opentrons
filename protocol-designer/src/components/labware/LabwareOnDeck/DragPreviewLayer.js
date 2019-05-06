// @flow
import * as React from 'react'
import { DragLayer } from 'react-dnd'
import { LabwareWrapper, type DeckSlot } from '@opentrons/components'
import HighlightableLabware from '../../../containers/HighlightableLabware'
import { DND_TYPES } from './constants'

type DragPreviewProps = {
  getXY: (rawX: number, rawY: number) => { scaledX?: number, scaledY?: number },
  isDragging: boolean,
  currentOffset?: { x: number, y: number },
  item: { slot: DeckSlot, labwareOrSlot: React.Node, containerId: string },
  itemType: string,
  containerType: string,
  children: React.Node,
}

const DragPreview = (props: DragPreviewProps) => {
  const { item, itemType, isDragging, currentOffset, getXY } = props
  if (itemType !== DND_TYPES.LABWARE || !isDragging || !currentOffset)
    return null
  const { scaledX, scaledY } = getXY(
    currentOffset && currentOffset.x,
    currentOffset && currentOffset.y
  )
  const containerId = item && item.containerId
  return (
    <g>
      <LabwareWrapper x={scaledX} y={scaledY}>
        <HighlightableLabware containerId={containerId} />
      </LabwareWrapper>
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
