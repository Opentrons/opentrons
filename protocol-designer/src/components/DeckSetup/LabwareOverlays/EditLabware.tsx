import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  DragSource,
  DragSourceConnector,
  DragSourceMonitor,
  DropTarget,
  DropTargetConnector,
  DropTargetMonitor,
  DropTargetSpec,
} from 'react-dnd'
import { NameThisLabware } from './NameThisLabware'
import { DND_TYPES } from '../../../constants'
import {
  deleteContainer,
  duplicateLabware,
  moveDeckItem,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { BaseState, DeckSlot, ThunkDispatch } from '../../../types'
import { LabwareOnDeck } from '../../../step-forms'
import styles from './LabwareOverlays.module.css'

interface OP {
  labwareOnDeck: LabwareOnDeck
  setHoveredLabware: (val?: LabwareOnDeck | null) => unknown
  setDraggedLabware: (val?: LabwareOnDeck | null) => unknown
  swapBlocked: boolean
}
interface SP {
  isYetUnnamed: boolean
}
interface DP {
  editLiquids: () => unknown
  duplicateLabware: () => unknown
  deleteLabware: () => unknown
  moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown
}

interface DNDP {
  draggedLabware?: LabwareOnDeck | null
  isOver: boolean
  connectDragSource: (val: JSX.Element) => JSX.Element
  connectDropTarget: (val: JSX.Element) => JSX.Element
}

type Props = OP & SP & DP & DNDP

const EditLabwareComponent = (props: Props): JSX.Element => {
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
  const { t } = useTranslation('deck')
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

    let contents: React.ReactNode | null = null

    if (swapBlocked) {
      contents = null
    } else if (draggedLabware) {
      contents = (
        <div
          className={cx(styles.overlay_button, {
            [styles.drag_text]: isBeingDragged,
          })}
        >
          {t(
            `overlay.slot.${isBeingDragged ? 'drag_to_new_slot' : 'place_here'}`
          )}
        </div>
      )
    } else {
      contents = (
        <>
          {!isTiprack ? (
            <a className={styles.overlay_button} onClick={editLiquids}>
              <Icon className={styles.overlay_icon} name="pencil" />
              {t('overlay.edit.name_and_liquids')}
            </a>
          ) : (
            <div className={styles.button_spacer} />
          )}
          <a className={styles.overlay_button} onClick={duplicateLabware}>
            <Icon className={styles.overlay_icon} name="content-copy" />
            {t('overlay.edit.duplicate')}
          </a>
          <a className={styles.overlay_button} onClick={deleteLabware}>
            <Icon className={styles.overlay_icon} name="close" />
            {t('overlay.edit.delete')}
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
  beginDrag: (props: Props, monitor: DragSourceMonitor, component: any) => {
    const { labwareOnDeck } = props
    props.setDraggedLabware(labwareOnDeck)
    return { labwareOnDeck }
  },
  endDrag: (props: Props, monitor: DragSourceMonitor, component: any) => {
    props.setHoveredLabware(null)
    props.setDraggedLabware(null)
  },
}
const collectLabwareSource = (
  connect: DragSourceConnector,
  monitor: DragSourceMonitor
): React.ReactNode => ({
  // @ts-expect-error(BC, 12-13-2023): react dnd needs to be updated or removed to include proper type
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
  canDrop: (props: Props, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    const draggedLabware = draggedItem?.labwareOnDeck
    const isDifferentSlot =
      draggedLabware && draggedLabware.slot !== props.labwareOnDeck.slot
    return isDifferentSlot && !props.swapBlocked
  },
  hover: (props: Props, monitor: DropTargetSpec<Props>, component: any) => {
    if (monitor.canDrop) {
      props.setHoveredLabware(component.props.labwareOnDeck)
    }
  },
  drop: (props: Props, monitor: DropTargetMonitor) => {
    const draggedItem = monitor.getItem()
    if (draggedItem) {
      props.moveDeckItem(
        draggedItem.labwareOnDeck.slot,
        props.labwareOnDeck.slot
      )
    }
  },
}
const collectLabwareDropTarget = (
  connect: DropTargetConnector,
  monitor: DropTargetMonitor
): React.ReactNode => ({
  // @ts-expect-error(BC, 12-13-2023): react dnd needs to be updated or removed to include proper type
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

const mapDispatchToProps = (
  dispatch: ThunkDispatch<any>,
  ownProps: OP
): DP => ({
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

export const EditLabware = connect(
  mapStateToProps,
  mapDispatchToProps
)(DragDropEditLabware)
