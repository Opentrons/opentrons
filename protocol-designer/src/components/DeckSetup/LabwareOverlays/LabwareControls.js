// @flow
import React from 'react'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import type { DeckSlot } from '@opentrons/shared-data'
import { DragSource, DropTarget } from 'react-dnd'

import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../../steplist'
import type { LabwareOnDeck } from '../../../step-forms'
import { DND_TYPES } from '../../labware/LabwareOnDeck/constants'
import { EmptyDestinationSlot, DisabledSelectSlot } from './LabwareOverlays'
import styles from './LabwareOverlays.css'
import LabwareName from './LabwareName'
import EditLabware from './EditLabware'
import BrowseLabware from './BrowseLabware'

type DNDProps = {|
  draggedItem: any,
  isOver: boolean,
  connectDragSource: React.Node => React.Node,
  connectDropTarget: React.Node => React.Node,
|}
type OP = {|
  labwareOnDeck: LabwareOnDeck,
  selectedTerminalItemId: ?TerminalItemId,
  slot: DeckSlot,
|}

type Props = {| ...DNDProps, ...OP |}
const LabwareControls = (props: Props) => {
  const {
    labwareOnDeck,
    slot,
    selectedTerminalItemId,
    draggedItem,
    isOver,
    connectDragSource,
    connectDropTarget,
  } = props
  if (
    labwareOnDeck.def.parameters.quirks &&
    labwareOnDeck.def.parameters.quirks.includes('fixedTrash')
  )
    return null
  const canEdit = selectedTerminalItemId === START_TERMINAL_ITEM_ID
  let dragOverlay = null
  if (draggedItem) {
    if (draggedItem.slot === slot.id) {
      // this labware is being dragged, disable it
      dragOverlay = <DisabledSelectSlot slot={slot} />
    } else if (isOver) {
      dragOverlay = <EmptyDestinationSlot slot={slot} />
    }
    return (
      <g transform={`translate(${slot.position[0]}, ${slot.position[1]})`}>
        {dragOverlay}
      </g>
    )
  }
  return connectDragSource(
    connectDropTarget(
      <RobotCoordsForeignDiv
        key={slot.id}
        x={slot.position[0]}
        y={slot.position[1]}
        width={slot.boundingBox.xDimension}
        height={slot.boundingBox.yDimension}
        innerDivProps={{ className: styles.slot_ui }}
      >
        {canEdit ? (
          <EditLabware labwareOnDeck={labwareOnDeck} />
        ) : (
          <BrowseLabware labwareOnDeck={labwareOnDeck} />
        )}
        {dragOverlay}
        <LabwareName labwareOnDeck={labwareOnDeck} />
      </RobotCoordsForeignDiv>
    )
  )
}

const DragSourceLabware = ({
  draggedItem,
  isOver,
  connectDragSource,
  connectDropTarget,
  render,
}: DragDropLabwareProps) =>
  connectDragSource(connectDropTarget(render({ draggedItem, isOver })))

const collectLabwareSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
  draggedItem: monitor.getItem(),
})
const DraggableLabware = DragSource(
  DND_TYPES.LABWARE,
  {},
  collectLabwareSource
)(DragSourceLabware)

const labwareTarget = {
  canDrop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    return draggedItem && draggedItem.slot !== props.slot
  },
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.swapSlotContents(draggedItem.slot, props.slot)
    }
  },
}
const collectLabwareTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})
export const DragDropLabware = DropTarget(
  DND_TYPES.LABWARE,
  labwareTarget,
  collectLabwareTarget
)(DraggableLabware)

export default LabwareControls
