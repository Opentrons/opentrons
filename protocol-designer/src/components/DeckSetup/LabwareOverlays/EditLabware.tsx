import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { Icon } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import { NameThisLabware } from './NameThisLabware'
import { DND_TYPES } from '../../../constants'
import {
  deleteContainer,
  duplicateLabware,
  moveDeckItem,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import { ThunkDispatch } from '../../../types'
import { LabwareOnDeck } from '../../../step-forms'
import styles from './LabwareOverlays.css'

interface Props {
  labwareOnDeck: LabwareOnDeck
  setHoveredLabware: (val?: LabwareOnDeck | null) => unknown
  setDraggedLabware: (val?: LabwareOnDeck | null) => unknown
  swapBlocked: boolean
}

export const EditLabware = (props: Props): JSX.Element | null => {
  const {
    labwareOnDeck,
    swapBlocked,
    setDraggedLabware,
    setHoveredLabware,
  } = props
  const savedLabware = useSelector(labwareIngredSelectors.getSavedLabware)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation('deck')

  const { isTiprack } = labwareOnDeck.def.parameters
  const hasName = savedLabware[labwareOnDeck.id]
  const isYetUnnamed = !labwareOnDeck.def.parameters.isTiprack && !hasName

  const editLiquids = (): void => {
    dispatch(openIngredientSelector(labwareOnDeck.id))
  }

  const [, drag] = useDrag(() => ({
    type: DND_TYPES.LABWARE,
    item: { labwareOnDeck },
    beginDrag: () => {
      setDraggedLabware(labwareOnDeck)
      return { labwareOnDeck }
    },
    endDrag: () => {
      setHoveredLabware(null)
      setDraggedLabware(null)
    },
  }))

  const [{ draggedLabware, isOver }, drop] = useDrop(() => ({
    accept: DND_TYPES.LABWARE,
    canDrop: (monitor: DropTargetMonitor) => {
      const draggedItem: any = monitor.getItem()
      const draggedLabware = draggedItem?.labwareOnDeck
      const isDifferentSlot =
        draggedLabware && draggedLabware.slot !== props.labwareOnDeck.slot
      return isDifferentSlot && !props.swapBlocked
    },
    drop: (monitor: DropTargetMonitor) => {
      const draggedItem: any = monitor.getItem()
      if (draggedItem) {
        dispatch(
          moveDeckItem(draggedItem.labwareOnDeck.slot, props.labwareOnDeck.slot)
        )
      }
    },

    hover: (monitor: DropTargetMonitor) => {
      if (monitor.canDrop()) {
        props.setHoveredLabware(labwareOnDeck)
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      draggedLabware: monitor.getItem() as any,
    }),
  }))

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
          <a
            className={styles.overlay_button}
            onClick={() => dispatch(duplicateLabware(labwareOnDeck.id))}
          >
            <Icon className={styles.overlay_icon} name="content-copy" />
            {t('overlay.edit.duplicate')}
          </a>
          <a
            className={styles.overlay_button}
            onClick={() => {
              window.confirm(
                `Are you sure you want to permanently delete this ${getLabwareDisplayName(
                  labwareOnDeck.def
                )}?`
              ) && dispatch(deleteContainer({ labwareId: labwareOnDeck.id }))
            }}
          >
            <Icon className={styles.overlay_icon} name="close" />
            {t('overlay.edit.delete')}
          </a>
        </>
      )
    }

    const dragResult = drag(
      <div ref={drop}>
        <div
          className={cx(styles.slot_overlay, {
            [styles.appear_on_mouseover]: !isBeingDragged && !isYetUnnamed,
            [styles.appear]: isOver,
            [styles.disabled]: isBeingDragged,
          })}
        >
          {contents}
        </div>
      </div>
    )

    return dragResult !== null ? dragResult : null
  }
}
