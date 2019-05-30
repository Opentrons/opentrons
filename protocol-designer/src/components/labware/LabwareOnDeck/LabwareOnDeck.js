// @flow
import * as React from 'react'
import cx from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'
import {
  LabwareWrapper,
  ContainerNameOverlay,
  EmptyDeckSlot,
  humanizeLabwareType,
} from '@opentrons/components'
import {
  type DeckSlotId,
  SLOT_RENDER_WIDTH,
  SLOT_RENDER_HEIGHT,
} from '@opentrons/shared-data'
import styles from '../labware.css'

import type { StepIdType } from '../../../form-types'
import HighlightableLabware from '../../../containers/HighlightableLabware'
import ClickableText from '../ClickableText'
import OverlayPanel from '../OverlayPanel'
import DisabledSelectSlotOverlay from '../DisabledSelectSlotOverlay'
import BrowseLabwareOverlay from '../BrowseLabwareOverlay'
import {
  type TerminalItemId,
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID,
} from '../../../steplist'
import { DND_TYPES } from '../../DeckSetup/LabwareOverlays/constants'

// TODO: BC 2019-05-22 this component is no longer used and should be remove once
// its functionality reaches parity with the new components in /DeckSetup/*

// TODO: BC 2019-05-22 this component is no longer used and should be remove once
// its functionality reaches parity with the new components in /DeckSetup/*

type DragDropLabwareProps = React.ElementProps<typeof LabwareWrapper> & {
  connectDragSource: mixed => React.Element<any>,
  connectDropTarget: mixed => React.Element<any>,
  draggedItem?: { slot: DeckSlotId },
  isOver: boolean,
  swapSlotContents: (DeckSlotId, DeckSlotId) => void,
  render: (args: {
    isOver: boolean,
    draggedItem?: { slot: DeckSlotId },
  }) => React.Node,
}
const DragSourceLabware = (props: DragDropLabwareProps) => {
  const { draggedItem, isOver } = props
  return props.connectDragSource(
    props.connectDropTarget(props.render({ draggedItem, isOver }))
  )
}

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

function LabwareDeckSlotOverlay({
  canAddIngreds,
  deleteLabware,
  editLiquids,
  duplicateLabware,
}: {
  canAddIngreds: boolean,
  deleteLabware: () => mixed,
  editLiquids: () => mixed,
  duplicateLabware: () => mixed,
}) {
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <OverlayPanel />
      {canAddIngreds && (
        <ClickableText
          onClick={editLiquids}
          iconName="pencil"
          y="15%"
          text="Name & Liquids"
        />
      )}
      <ClickableText
        onClick={duplicateLabware}
        iconName="content-copy"
        y="40%"
        text="Duplicate"
      />
      <ClickableText
        onClick={deleteLabware}
        iconName="close"
        y="65%"
        text="Delete"
      />
    </g>
  )
}

// Including a labware type in `labwareImages` will use that image instead of an SVG
const IMG_TRASH = require('../../../images/labware/Trash.png')
const labwareImages = {
  'trash-box': IMG_TRASH,
}

type SlotWithLabwareProps = {
  containerType: string,
  displayName: string,
  containerId: string,
}

function SlotWithLabware(props: SlotWithLabwareProps) {
  const { containerType, displayName, containerId } = props

  return (
    <g>
      {labwareImages[containerType] ? (
        <image
          href={labwareImages[containerType]}
          width={SLOT_RENDER_WIDTH}
          height={SLOT_RENDER_HEIGHT}
        />
      ) : (
        <HighlightableLabware containerId={containerId} />
      )}
      <ContainerNameOverlay
        title={displayName || humanizeLabwareType(containerType)}
      />
    </g>
  )
}

const EmptyDestinationSlotOverlay = () => (
  <g className={cx(styles.slot_overlay)}>
    <OverlayPanel />
    <g className={styles.clickable_text}>
      <text x="0" y="40%">
        Place Here
      </text>
    </g>
  </g>
)

type EmptyDeckSlotOverlayProps = {
  addLabware: (e: SyntheticEvent<*>) => mixed,
}
function EmptyDeckSlotOverlay(props: EmptyDeckSlotOverlayProps) {
  const { addLabware } = props
  return (
    <g
      className={cx(
        styles.slot_overlay,
        styles.appear_on_mouseover,
        styles.add_labware
      )}
    >
      <OverlayPanel />
      <ClickableText
        onClick={addLabware}
        iconName="plus"
        y="40%"
        text="Add Labware"
      />
    </g>
  )
}

type LabwareOnDeckProps = {
  slot: DeckSlotId,
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

  drillDown: () => mixed,
  drillUp: () => mixed,

  addLabware: () => mixed,
  deleteLabware: () => mixed,
  duplicateLabware: StepIdType => mixed,
  editLiquids: () => mixed,
  swapSlotContents: (DeckSlotId, DeckSlotId) => mixed,

  setLabwareName: (name: ?string) => mixed,
  setDefaultLabwareName: () => mixed,
}

const LabwareOnDeck = (props: LabwareOnDeckProps) => {
  const {
    slot,
    containerId,
    // containerName,
    // containerType,

    // showNameOverlay,
    // slotHasLabware,
    highlighted,

    // addLabwareMode,
    // canAddIngreds,
    // isTiprack,
    // selectedTerminalItem,

    // drillDown,
    // drillUp,

    // addLabware,
    // deleteLabware,
    // duplicateLabware,
    // editLiquids,
    swapSlotContents,

    // setDefaultLabwareName,
    // setLabwareName,
  } = props

  // determine what overlay to show
  let overlay = null
  let isManualInterventionStep = false
  // if (selectedTerminalItem === START_TERMINAL_ITEM_ID && !addLabwareMode) {
  //   isManualInterventionStep = true
  //   if (showNameOverlay) {
  //     overlay = null
  //     // <NameThisLabwareOverlay
  //     //   {...{ setLabwareName, editLiquids }}
  //     //   onClickOutside={setDefaultLabwareName}
  //     // />
  //   } else {
  //     overlay = slotHasLabware ? (
  //       <LabwareDeckSlotOverlay
  //         duplicateLabware={() => duplicateLabware(containerId)}
  //         {...{ canAddIngreds, deleteLabware, editLiquids }}
  //       />
  //     ) : (
  //       <EmptyDeckSlotOverlay {...{ addLabware }} />
  //     )
  //   }
  // } else if (
  //   selectedTerminalItem === END_TERMINAL_ITEM_ID &&
  //   slotHasLabware &&
  //   !isTiprack
  // ) {
  //   overlay = <BrowseLabwareOverlay drillDown={drillDown} drillUp={drillUp} />
  // }

  // const labwareOrSlot = slotHasLabware ? (
  //   <SlotWithLabware
  //     key={`${containerType}`}
  //     {...{ containerType, containerId }}
  //     displayName={containerName || containerType}
  //   />
  // ) : (
  //   <EmptyDeckSlot slot={slot} />
  // )

  return (
    <DragDropLabware
      {...{ isManualInterventionStep, containerId, swapSlotContents, slot }}
      render={({ draggedItem, isOver }) => {
        let finalOverlay = overlay // default
        if (draggedItem) {
          if (draggedItem.slot === slot) {
            // this labware is being dragged, disable it
            finalOverlay = <DisabledSelectSlotOverlay />
          } else if (isOver) {
            finalOverlay = <EmptyDestinationSlotOverlay />
          }
        }
        return (
          <g>
            <LabwareWrapper {...{ highlighted }}>
              {/* {labwareOrSlot} */}
              {finalOverlay}
            </LabwareWrapper>
          </g>
        )
      }}
    />
  )
}

export default LabwareOnDeck
