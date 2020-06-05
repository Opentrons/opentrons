// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { DragSource, DropTarget } from 'react-dnd'
import { i18n } from '../../../localization'
import { NameThisLabware } from './NameThisLabware'
import { DND_TYPES } from '../../../constants'
import {
  openIngredientSelector,
  deleteContainer,
  duplicateLabware,
  moveDeckItem,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import type { BaseState, ThunkDispatch, DeckSlot } from '../../../types'
import type { LabwareOnDeck } from '../../../step-forms'
import styles from './LabwareOverlays.css'

type OP = {|
  labwareOnDeck: LabwareOnDeck,
  setHoveredLabware: (?LabwareOnDeck) => mixed,
  setDraggedLabware: (?LabwareOnDeck) => mixed,
  swapBlocked: boolean,
|}
type SP = {|
  isYetUnnamed: boolean,
|}
type DP = {|
  editLiquids: () => mixed,
  duplicateLabware: () => mixed,
  deleteLabware: () => mixed,
  moveDeckItem: (DeckSlot, DeckSlot) => mixed,
|}

type DNDP = {|
  draggedLabware: ?LabwareOnDeck,
  isOver: boolean,
  connectDragSource: React.Node => React.Node,
  connectDropTarget: React.Node => React.Node,
|}

type Props = {| ...OP, ...SP, ...DP, ...DNDP |}

const EditLabwareComponent = (props: Props) => {
  const {
    labwareOnDeck,
    isYetUnnamed,
    editLiquids,
    deleteLabware,
    duplicateLabware,
    draggedLabware,
    isOver,
    connectDragSource,
    connectDropTarget,
    swapBlocked,
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
    const isBeingDragged = draggedLabware?.slot === labwareOnDeck.slot

    let contents: React.Node = null

    if (swapBlocked) {
      contents = null
    } else if (draggedLabware) {
      contents = (
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
      )
    } else {
      contents = (
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
    }

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
  beginDrag: (props, monitor, component) => {
    const { labwareOnDeck } = props
    props.setDraggedLabware(labwareOnDeck)
    return { labwareOnDeck }
  },
  endDrag: (props, monitor, component) => {
    props.setHoveredLabware(null)
    props.setDraggedLabware(null)
  },
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
)(EditLabwareComponent)

const labwareDropTarget = {
  canDrop: (props: { ...OP, ...SP, ...DP }, monitor) => {
    const draggedItem = monitor.getItem()
    const draggedLabware = draggedItem?.labwareOnDeck
    const isDifferentSlot =
      draggedLabware && draggedLabware.slot !== props.labwareOnDeck.slot
    return isDifferentSlot && !props.swapBlocked
  },
  hover: (props, monitor, component) => {
    if (monitor.canDrop) {
      props.setHoveredLabware(component.props.labwareOnDeck)
    }
  },
  drop: (props, monitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.moveDeckItem(
        draggedItem.labwareOnDeck.slot,
        props.labwareOnDeck.slot
      )
    }
  },
}
const collectLabwareDropTarget = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  draggedLabware: monitor.getItem()?.labwareOnDeck || null,
})
const DragDropEditLabware = DropTarget(
  DND_TYPES.LABWARE,
  labwareDropTarget,
  collectLabwareDropTarget
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
  moveDeckItem: (sourceSlot, destSlot) =>
    dispatch(moveDeckItem(sourceSlot, destSlot)),
})

export const EditLabware: React.AbstractComponent<OP> = connect<
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
