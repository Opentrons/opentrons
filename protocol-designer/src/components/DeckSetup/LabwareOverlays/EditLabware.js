// @flow
import React, { type Node } from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getLabwareDisplayName, type DeckSlotId } from '@opentrons/shared-data'
import { DragSource, DropTarget } from 'react-dnd'
import { DND_TYPES } from './constants'
import type { BaseState, ThunkDispatch } from '../../../types'
import {
  openIngredientSelector,
  deleteContainer,
  duplicateLabware,
  swapSlotContents,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import i18n from '../../../localization'
import type { LabwareOnDeck } from '../../../step-forms'
import NameThisLabware from './NameThisLabware'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareOnDeck: LabwareOnDeck,
|}
type SP = {|
  isYetUnnamed: boolean,
|}
type DP = {|
  editLiquids: () => mixed,
  duplicateLabware: () => mixed,
  deleteLabware: () => mixed,
  swapSlotContents: (DeckSlotId, DeckSlotId) => mixed,
|}

type DNDP = {|
  draggedItem: any,
  isOver: boolean,
  connectDragSource: Node => Node,
  connectDropTarget: Node => Node,
|}

type Props = {| ...OP, ...SP, ...DP, ...DNDP |}

const EditLabware = (props: Props) => {
  const {
    labwareOnDeck,
    isYetUnnamed,
    editLiquids,
    deleteLabware,
    duplicateLabware,
    draggedItem,
    isOver,
    connectDragSource,
    connectDropTarget,
  } = props

  const { isTiprack } = labwareOnDeck.def.parameters
  if (isYetUnnamed && !isTiprack) {
    return (
      <NameThisLabware
        labwareOnDeck={labwareOnDeck}
        editLiquids={editLiquids}
      />
    )
  } else {
    const isBeingDragged =
      draggedItem &&
      draggedItem.labwareOnDeck &&
      draggedItem.labwareOnDeck.slot === labwareOnDeck.slot

    const contents = draggedItem ? (
      <div
        className={cx(styles.overlay_button, {
          [styles.drag_text]: isBeingDragged,
        })}
      >
        {i18n.t(
          `deck.overlay.slot.${
            isBeingDragged ? 'drag_to_new_slot' : 'place_here'
          }`
        )}
      </div>
    ) : (
      <>
        {!isTiprack ? (
          <a className={styles.overlay_button} onClick={editLiquids}>
            <Icon className={styles.overlay_icon} name="pencil" />
            {i18n.t('deck.overlay.edit.name_and_liquids')}
          </a>
        ) : (
          <div className={styles.button_spacer} />
        )}
        <a className={styles.overlay_button} onClick={duplicateLabware}>
          <Icon className={styles.overlay_icon} name="content-copy" />
          {i18n.t('deck.overlay.edit.duplicate')}
        </a>
        <a className={styles.overlay_button} onClick={deleteLabware}>
          <Icon className={styles.overlay_icon} name="close" />
          {i18n.t('deck.overlay.edit.delete')}
        </a>
      </>
    )
    return connectDragSource(
      connectDropTarget(
        <div
          className={cx(styles.slot_overlay, {
            [styles.appear_on_mouseover]: !isBeingDragged && !isYetUnnamed,
            [styles.appear]: isOver,
            [styles.disabled]: isBeingDragged,
          })}
        >
          {contents}
        </div>
      )
    )
  }
}

const labwareSource = {
  beginDrag: props => ({ labwareOnDeck: props.labwareOnDeck }),
}
const collectLabwareSource = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
  draggedItem: monitor.getItem(),
})
const DragEditLabware = DragSource(
  DND_TYPES.LABWARE,
  labwareSource,
  collectLabwareSource
)(EditLabware)

const labwareTarget = {
  canDrop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    return (
      draggedItem && draggedItem.labwareOnDeck.slot !== props.labwareOnDeck.slot
    )
  },
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.swapSlotContents(
        draggedItem.labwareOnDeck.slot,
        props.labwareOnDeck.slot
      )
    }
  },
}
const collectLabwareTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
})
export const DragDropEditLabware = DropTarget(
  DND_TYPES.LABWARE,
  labwareTarget,
  collectLabwareTarget
)(DragEditLabware)

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { id } = ownProps.labwareOnDeck
  const hasName = labwareIngredSelectors.getSavedLabware(state)[id]
  return {
    isYetUnnamed: !ownProps.labwareOnDeck.def.parameters.isTiprack && !hasName,
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<*>, ownProps: OP): DP => ({
  editLiquids: () =>
    dispatch(openIngredientSelector(ownProps.labwareOnDeck.id)),
  duplicateLabware: () => dispatch(duplicateLabware(ownProps.labwareOnDeck.id)),
  deleteLabware: () => {
    window.confirm(
      `Are you sure you want to permanently delete this ${getLabwareDisplayName(
        ownProps.labwareOnDeck.def
      )}?`
    ) && dispatch(deleteContainer({ labwareId: ownProps.labwareOnDeck.id }))
  },
  swapSlotContents: (sourceSlot, destSlot) =>
    dispatch(swapSlotContents(sourceSlot, destSlot)),
})

export default connect<
  {| ...OP, ...SP, ...DP |},
  OP,
  SP,
  DP,
  BaseState,
  ThunkDispatch<*>
>(
  mapStateToProps,
  mapDispatchToProps
)(DragDropEditLabware)
