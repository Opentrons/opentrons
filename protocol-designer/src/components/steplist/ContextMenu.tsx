import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useConditionalConfirm } from '@opentrons/components'
import {
  ConfirmDeleteModal,
  DELETE_STEP_FORM,
} from '../modals/ConfirmDeleteModal'
import { i18n } from '../../localization'
import { actions as stepsActions, getIsMultiSelectMode } from '../../ui/steps'
import { actions as steplistActions } from '../../steplist'
import { Portal } from '../portals/TopPortal'
import styles from './StepItem.css'
import { StepIdType } from '../../form-types'
import { getSavedStepForms } from '../../step-forms/selectors'

const MENU_OFFSET_PX = 5

interface Props {
  children: (args: {
    makeStepOnContextMenu: (
      stepIdType: StepIdType
    ) => (event: MouseEvent) => unknown
  }) => React.ReactNode
}

interface Position {
  left: number | null
  top: number | null
}

export const ContextMenu = (props: Props): JSX.Element => {
  const dispatch = useDispatch()
  const deleteStep = (
    stepId: StepIdType
  ): ReturnType<typeof steplistActions.deleteStep> =>
    dispatch(steplistActions.deleteStep(stepId))
  const duplicateStep = (
    stepId: StepIdType
  ): ReturnType<typeof stepsActions.duplicateStep> =>
    dispatch(stepsActions.duplicateStep(stepId))

  const [visible, setVisible] = React.useState<boolean>(false)
  const [stepId, setStepId] = React.useState<StepIdType | null>(null)
  const [position, setPosition] = React.useState<Position>({
    left: null,
    top: null,
  })
  const menuRoot = React.useRef<HTMLDivElement | null>(null)

  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const allSavedSteps = useSelector(getSavedStepForms)
  const isMoveLabwareStepType =
    stepId != null ? allSavedSteps[stepId].stepType === 'moveLabware' : null

  React.useEffect(() => {
    global.addEventListener('click', handleClick)
    return () => global.removeEventListener('click', handleClick)
  })

  const makeHandleContextMenu = (stepId: StepIdType) => (event: MouseEvent) => {
    if (isMultiSelectMode) return
    event.preventDefault()

    const clickX = event.clientX
    const clickY = event.clientY

    const screenW = window.innerWidth
    const screenH = window.innerHeight
    const rootW = menuRoot.current ? menuRoot.current.offsetWidth : 0
    const rootH = menuRoot.current ? menuRoot.current.offsetHeight : 0

    const left =
      screenW - clickX > rootW
        ? clickX + MENU_OFFSET_PX
        : clickX - rootW - MENU_OFFSET_PX
    const top =
      screenH - clickY > rootH
        ? clickY + MENU_OFFSET_PX
        : clickY - rootH - MENU_OFFSET_PX

    setVisible(true)
    setStepId(stepId)
    setPosition({ left, top })
  }
  const handleClick = (event: MouseEvent): void => {
    const wasOutside = !(
      event.target instanceof Node && menuRoot.current?.contains(event.target)
    )

    if (wasOutside && visible) setVisible(false)
    setPosition({ left: null, top: null })
  }

  const handleDuplicate = (): void => {
    if (stepId != null) {
      duplicateStep(stepId)
      setVisible(false)
      setStepId(null)
    }
  }

  const handleDelete = (): void => {
    if (stepId != null) {
      deleteStep(stepId)
    } else {
      console.warn(
        'something went wrong, cannot delete a step without a step id'
      )
    }
    setVisible(false)
    setStepId(null)
  }

  const {
    confirm: confirmDelete,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDelete,
  } = useConditionalConfirm(handleDelete, true)

  return (
    <div>
      {showDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {props.children({
        makeStepOnContextMenu: makeHandleContextMenu,
      })}
      {!showDeleteConfirmation && visible && (
        <Portal>
          <div
            ref={menuRoot}
            // @ts-expect-error(sa, 2021-7-5): position cannot be null, cast to undefined
            style={{ left: position.left, top: position.top }}
            className={styles.context_menu}
          >
            {isMoveLabwareStepType ? null : (
              <div
                onClick={handleDuplicate}
                className={styles.context_menu_item}
              >
                {i18n.t('context_menu.step.duplicate')}
              </div>
            )}
            <div onClick={confirmDelete} className={styles.context_menu_item}>
              {i18n.t('context_menu.step.delete')}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
