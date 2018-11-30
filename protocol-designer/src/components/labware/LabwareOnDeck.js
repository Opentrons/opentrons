// @flow
import * as React from 'react'
import cx from 'classnames'
import { DragSource, DropTarget, DragLayer } from 'react-dnd'
import {
  LabwareContainer,
  ContainerNameOverlay,
  EmptyDeckSlot,
  humanizeLabwareType,
  type DeckSlot,
} from '@opentrons/components'
import {
  SLOT_RENDER_WIDTH,
  SLOT_RENDER_HEIGHT,
} from '@opentrons/shared-data'
import styles from './labware.css'

import ClickableText from './ClickableText'
import HighlightableLabware from '../../containers/HighlightableLabware'
import NameThisLabwareOverlay from './NameThisLabwareOverlay'
import DisabledSelectSlotOverlay from './DisabledSelectSlotOverlay'
import BrowseLabwareOverlay from './BrowseLabwareOverlay'
import {type TerminalItemId, START_TERMINAL_ITEM_ID, END_TERMINAL_ITEM_ID} from '../../steplist'

// TODO: consolidate with DraggableStepItems DND_TYPES
const DND_TYPES: {LABWARE: "LABWARE"} = {
  LABWARE: 'LABWARE',
}

type DragPreviewProps = {
  getXY: (rawX: number, rawY: number) => {scaledX?: number, scaledY?: number},
  isDragging: boolean, currentOffset: ?number, itemType: string}
const DragPreview = (props: DragPreviewProps) => {
  const {itemType, isDragging, currentOffset, getXY} = props
  const {scaledX, scaledY} = getXY(currentOffset && currentOffset.x, currentOffset && currentOffset.y)
  if (itemType !== DND_TYPES.LABWARE || !isDragging || !currentOffset) return null
  return (
    <circle
      transform={`translate(${10} ${10})`}
      cx={scaledX}
      cy={scaledY}
      r={22}
      fill="red"
      stroke="black"
      strokeWidth={2}/>
  )
}

export const DragPreviewLayer = DragLayer(monitor => ({
  currentOffset: monitor.getSourceClientOffset(),
  isDragging: monitor.isDragging(),
  itemType: monitor.getItemType(),
}))(DragPreview)

type DragDropLabwareProps = React.ElementProps<typeof LabwareContainer> & {
  connectDragSource: mixed => React.Element<any>,
  connectDropTarget: mixed => React.Element<any>,
  slot: DeckSlot,
  onDrag: () => void,
  moveLabware: (DeckSlot, DeckSlot) => void,
}
class DragSourceLabware extends React.Component<DragDropLabwareProps> {
  componentDidUpdate (prevProps, nextProps) {
    if (!prevProps.isOver && nextProps.isOver) {
      nextProps.moveLabware(nextProps.draggedSlot, nextProps.slot)
    }
  }
  render () {
    return (
      this.props.connectDragSource(
        this.props.connectDropTarget(
          <g>
            <LabwareContainer slot={this.props.slot} highlighted={this.props.highlighted}>
              {this.props.labwareOrSlot}
              {this.props.overlay}
            </LabwareContainer>
          </g>
        )
      )
    )
  }
}

const labwareSource = {
  beginDrag: (props) => {
    props.onDrag()
    return {slot: props.slot}
  },
}
const collectLabwareSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
})
const DraggableLabware = DragSource(DND_TYPES.LABWARE, labwareSource, collectLabwareSource)(DragSourceLabware)

const labwareTarget = {
  canDrop: () => { return false },
}
const collectLabwareTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  draggedSlot: monitor.getItem(),
})
const DragDropLabware = DropTarget(DND_TYPES.LABWARE, labwareTarget, collectLabwareTarget)(DraggableLabware)

function LabwareDeckSlotOverlay ({
  canAddIngreds,
  deleteLabware,
  editLiquids,
  moveLabwareSource,
}: {
  canAddIngreds: boolean,
  deleteLabware: () => mixed,
  editLiquids: () => mixed,
  moveLabwareSource: () => mixed,
}) {
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <rect className={styles.overlay_panel} />
      {canAddIngreds &&
        <ClickableText
          onClick={editLiquids}
          iconName='pencil' y='15%' text='Name & Liquids' />
      }
      <ClickableText
        onClick={moveLabwareSource}
        iconName='cursor-move' y='40%' text='Move' />
      <ClickableText
        onClick={deleteLabware}
        iconName='close' y='65%' text='Delete' />
    </g>
  )
}

// Including a labware type in `labwareImages` will use that image instead of an SVG
const IMG_TRASH = require('../../images/labware/Trash.png')
const labwareImages = {
  'trash-box': IMG_TRASH,
}

type SlotWithLabwareProps = {
  containerType: string,
  displayName: string,
  containerId: string,
}

function SlotWithLabware (props: SlotWithLabwareProps) {
  const {containerType, displayName, containerId} = props

  return (
    <g>
      {labwareImages[containerType]
        ? <image
          href={labwareImages[containerType]}
          width={SLOT_RENDER_WIDTH} height={SLOT_RENDER_HEIGHT}
        />
        : <HighlightableLabware containerId={containerId} />
      }
      <ContainerNameOverlay title={displayName || humanizeLabwareType(containerType)} />
    </g>
  )
}

type EmptyDestinationSlotOverlayProps = {
  moveLabwareDestination: (e?: SyntheticEvent<*>) => mixed,
}
function EmptyDestinationSlotOverlay (props: EmptyDestinationSlotOverlayProps) {
  const {moveLabwareDestination} = props

  const handleSelectMoveDestination = (e: SyntheticEvent<*>) => {
    e.preventDefault()
    moveLabwareDestination()
  }

  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <rect className={styles.overlay_panel} onClick={moveLabwareDestination} />
      <ClickableText
        onClick={handleSelectMoveDestination}
        iconName='cursor-move'
        y='40%'
        text='Place Here'
      />
    </g>
  )
}

type EmptyDeckSlotOverlayProps = {
  addLabware: (e: SyntheticEvent<*>) => mixed,
}
function EmptyDeckSlotOverlay (props: EmptyDeckSlotOverlayProps) {
  const {addLabware} = props
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover, styles.add_labware)}>
      <rect className={styles.overlay_panel} />
      <ClickableText onClick={addLabware}
        iconName='plus' y='30%' text='Add Labware' />
      <ClickableText
        onClick={e => window.alert('NOT YET IMPLEMENTED: Add Copy') /* TODO: New Copy feature */}
        iconName='content-copy' y='55%' text='Add Copy' />
    </g>
  )
}

type LabwareOnDeckProps = {
  slot: DeckSlot,
  containerId: string,
  containerName: ?string,
  containerType: string,

  showNameOverlay: ?boolean,
  slotHasLabware: boolean,
  highlighted: boolean,

  addLabwareMode: boolean,
  canAddIngreds: boolean,
  isTiprack: boolean,
  selectedTerminalItem: ?TerminalItemId,
  moveLabwareMode: boolean,

  addLabware: () => mixed,
  editLiquids: () => mixed,
  drillDown: () => mixed,
  drillUp: () => mixed,
  deleteLabware: () => mixed,

  cancelMove: () => mixed,
  moveLabwareDestination: () => mixed,
  moveLabwareSource: () => mixed,
  slotToMoveFrom: ?DeckSlot,

  setLabwareName: (name: ?string) => mixed,
  setDefaultLabwareName: () => mixed,
}

class LabwareOnDeck extends React.Component<LabwareOnDeckProps> {
  // TODO: BC 2018-10-11 re-implement this re-render check at a lower level once this component
  // and its connected props are broken out into lower level components.

  // shouldComponentUpdate (nextProps: LabwareOnDeckProps) {
  //   const shouldAlwaysUpdate = this.props.addLabwareMode ||
  //     nextProps.addLabwareMode ||
  //     this.props.moveLabwareMode ||
  //     nextProps.moveLabwareMode

  //   const labwarePresenceChange = this.props.containerId !== nextProps.containerId
  //   const nameOverlayChange = this.props.showNameOverlay !== nextProps.showNameOverlay

  //   if (shouldAlwaysUpdate || labwarePresenceChange || nameOverlayChange) return true
  //   return this.props.highlighted !== nextProps.highlighted
  // }
  render () {
    const {
      slot,
      containerId,
      containerName,
      containerType,

      showNameOverlay,
      slotHasLabware,
      highlighted,

      addLabwareMode,
      canAddIngreds,
      isTiprack,
      selectedTerminalItem,
      moveLabwareMode,
      drillDown,
      drillUp,

      addLabware,
      editLiquids,
      deleteLabware,

      cancelMove,
      moveLabwareDestination,
      moveLabwareSource,
      slotToMoveFrom,
      swapSlotContents,

      setDefaultLabwareName,
      setLabwareName,
    } = this.props

    // determine what overlay to show
    let overlay = null
    if (selectedTerminalItem === START_TERMINAL_ITEM_ID && !addLabwareMode) {
      if (moveLabwareMode) {
        overlay = (slotToMoveFrom === slot)
          ? <DisabledSelectSlotOverlay
            onClickOutside={cancelMove}
            cancelMove={cancelMove} />
          : <EmptyDestinationSlotOverlay {...{moveLabwareDestination}}/>
      } else if (showNameOverlay) {
        overlay = <NameThisLabwareOverlay {...{
          setLabwareName,
          editLiquids,
        }}
        onClickOutside={setDefaultLabwareName} />
      } else {
        overlay = (slotHasLabware)
          ? <LabwareDeckSlotOverlay {...{
            canAddIngreds,
            deleteLabware,
            editLiquids,
            moveLabwareSource,
          }} />
          : <EmptyDeckSlotOverlay {...{addLabware}} />
      }
    } else if (selectedTerminalItem === END_TERMINAL_ITEM_ID && slotHasLabware && !isTiprack) {
      overlay = <BrowseLabwareOverlay drillDown={drillDown} drillUp={drillUp} />
    }

    const labwareOrSlot = (slotHasLabware)
      ? <SlotWithLabware
        {...{containerType, containerId}}
        displayName={containerName || containerType}
      />
      : <EmptyDeckSlot slot={slot} />

    return (
      <DragDropLabware
        onDrag={() => { console.log('DRUGged') }}
        moveLabware={swapSlotContents}
        {...{slot, highlighted, labwareOrSlot, overlay}} />
    )
  }
}

export default LabwareOnDeck
