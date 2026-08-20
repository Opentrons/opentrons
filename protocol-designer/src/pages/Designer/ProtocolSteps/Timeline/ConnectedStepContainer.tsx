import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  useConditionalConfirm,
} from '@opentrons/components'

import { StepContainer } from '/protocol-designer/components/molecules'
import {
  ConfirmDeleteModal,
  DELETE_MULTIPLE_STEP_FORMS,
  DELETE_STEP_FORM,
  getMainPagePortalEl,
} from '/protocol-designer/components/organisms'
import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import {
  getInitialDeckSetup,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { actions as steplistActions } from '/protocol-designer/steplist'
import {
  deselectAllSteps,
  populateForm,
} from '/protocol-designer/ui/steps/actions/actions'
import { getMultiSelectItemIds } from '/protocol-designer/ui/steps/selectors'

import { StepOverflowMenu } from './StepOverflowMenu'
import {
  capitalizeFirstLetterAfterNumber,
  getFillLabwareToDeleteData,
} from './utils'

import type { ThunkDispatch } from 'redux-thunk'
import type { Dispatch, MouseEvent as ReactMouseEvent, ReactNode, SetStateAction } from 'react'
import type { IconName } from '@opentrons/components'
import type { BaseState } from '/protocol-designer/types'

const STARTING_DECK_STATE = 'Starting deck'
const FINAL_DECK_STATE = 'Ending deck'
const PX_HEIGHT_TO_TOP_OF_CONTAINER = 32
export const PX_SIDEBAR_MIN_WIDTH_FOR_ICON = 170

export interface ConnectedStepContainerProps {
  stepNumber: number | null
  text: string
  subtext?: string | null
  iconName: IconName
  sidebarWidth: number
  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>
  stepId?: string
  onClick?: (event: ReactMouseEvent) => void
  onDoubleClick?: (event: ReactMouseEvent) => void
  onMouseEnter?: (event: ReactMouseEvent) => void
  onMouseLeave?: (event: ReactMouseEvent) => void
  selected?: boolean
  hovered?: boolean
  hasError?: boolean
  isStepAfterError?: boolean
}

// todo(mm, 2025-11-14): I've made a mess of ConnectedStepInfo and ConnectedStepContainer.
// We should try to either merge them, or clarify each one's responsibilities.
export function ConnectedStepContainer(
  props: ConnectedStepContainerProps
): ReactNode {
  const {
    stepId,
    iconName,
    onDoubleClick,
    onMouseEnter,
    onMouseLeave,
    selected,
    onClick,
    hovered,
    stepNumber,
    text,
    subtext,
    hasError = false,
    isStepAfterError = false,
    setOpenedOverflowMenuId,
    openedOverflowMenuId,
    sidebarWidth,
  } = props
  const [top, setTop] = useState<number>(0)
  const menuRootRef = useRef<HTMLDivElement | null>(null)
  const isStartingOrEndingState =
    text === STARTING_DECK_STATE || text === FINAL_DECK_STATE
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const savedStepForms = useSelector(getSavedStepForms)
  const { modules: deckSetupModules } = useSelector(getInitialDeckSetup)
  const hasText = sidebarWidth > PX_SIDEBAR_MIN_WIDTH_FOR_ICON

  const handleClick = (event: MouseEvent): void => {
    const wasOutside = !(
      event.target instanceof Node &&
      menuRootRef.current?.contains(event.target)
    )

    if (wasOutside) {
      setOpenedOverflowMenuId?.(null)
    }
  }

  const handleOverflowClick = (event: ReactMouseEvent): void => {
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const screenHeight = window.innerHeight
    const rootHeight = menuRootRef.current?.offsetHeight || 0

    const spaceBelow = screenHeight - buttonRect.bottom
    const top =
      spaceBelow > rootHeight
        ? buttonRect.bottom - PX_HEIGHT_TO_TOP_OF_CONTAINER
        : buttonRect.top - rootHeight + PX_HEIGHT_TO_TOP_OF_CONTAINER

    setTop(top)
  }

  useEffect(() => {
    global.addEventListener('click', handleClick)
    return () => {
      global.removeEventListener('click', handleClick)
    }
  })

  const handleStepItemSelection = (): void => {
    if (stepId != null) {
      dispatch(populateForm(stepId))
    }
    setOpenedOverflowMenuId?.(null)
  }

  const handleDeleteFillLabware = (stepIds: string[]): void => {
    const fillLabwareToDeleteData = getFillLabwareToDeleteData(
      stepIds,
      savedStepForms,
      deckSetupModules
    )
    for (const { labwareIds, module } of fillLabwareToDeleteData) {
      labwareIds.forEach(id => {
        dispatch(deleteContainer({ labwareId: id, stacker: module }))
      })
    }
  }

  const onDeleteClickAction = (): void => {
    if (multiSelectItemIds) {
      handleDeleteFillLabware(multiSelectItemIds)
      dispatch(steplistActions.deleteMultipleSteps(multiSelectItemIds))
      // todo(mm, 2025-10-31): Why are we doing deselectAllSteps here?
      // deleteMultipleSteps already adjusts the selection when any of them are deleted.
      dispatch(deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'))
    } else {
      console.warn(
        'something went wrong, you cannot delete multiple steps if none are selected'
      )
    }
  }

  const {
    confirm: confirmMultiDelete,
    showConfirmation: showMultiDeleteConfirmation,
    cancel: cancelMultiDelete,
  } = useConditionalConfirm(onDeleteClickAction, true)

  const handleDelete = (): void => {
    if (stepId != null) {
      handleDeleteFillLabware([stepId])
      dispatch(steplistActions.deleteMultipleSteps([stepId]))
    } else {
      console.warn(
        'something went wrong, cannot delete a step without a step id'
      )
    }
  }
  const {
    confirm: confirmDelete,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDelete,
  } = useConditionalConfirm(handleDelete, true)

  const handleOpenForm = (clickNum: number, e: ReactMouseEvent): void => {
    if (clickNum === 0) {
      onClick?.(e)
    } else {
      onDoubleClick?.(e)
    }
  }

  return (
    <>
      {showDeleteConfirmation === true && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showMultiDeleteConfirmation === true && (
        <ConfirmDeleteModal
          modalType={DELETE_MULTIPLE_STEP_FORMS}
          onContinueClick={confirmMultiDelete}
          onCancelClick={cancelMultiDelete}
        />
      )}
      <Box
        id={stepId}
        {...(!isStepAfterError
          ? {
              onMouseEnter,
              onMouseLeave,
            }
          : {})}
      >
        <StepContainer
          stepNumber={stepNumber}
          // todo(mm, 2025-09-05): This can be simplified now that stepNumber has been
          // pulled into its own property. We no longer need to skip leading numbers.
          text={capitalizeFirstLetterAfterNumber(text)}
          subtext={subtext}
          iconName={iconName}
          type={isStartingOrEndingState ? 'alt' : 'default'}
          size={hasText ? 'iconAndText' : 'iconOnly'}
          cursor={isStepAfterError ? CURSOR_DEFAULT : CURSOR_POINTER}
          active={selected ?? false}
          error={hasError}
          hover={hovered ?? false}
          semiTransparent={isStepAfterError}
          onClick={e => {
            handleOpenForm(0, e)
          }}
          onDoubleClick={e => {
            handleOpenForm(1, e)
          }}
          onOverflowMenuButtonClick={e => {
            e.preventDefault()
            e.stopPropagation()
            if (openedOverflowMenuId === stepId) {
              setOpenedOverflowMenuId?.(null)
            } else {
              setOpenedOverflowMenuId?.(stepId ?? null)
            }

            handleOverflowClick(e)
          }}
          dataTestId={`StepContainer_${stepId}`}
        />
      </Box>
      {stepId != null &&
      openedOverflowMenuId === stepId &&
      setOpenedOverflowMenuId != null
        ? createPortal(
            <StepOverflowMenu
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              stepId={stepId}
              menuRootRef={menuRootRef}
              top={top}
              handleEdit={handleStepItemSelection}
              confirmDelete={confirmDelete}
              confirmMultiDelete={confirmMultiDelete}
              multiSelectItemIds={multiSelectItemIds}
              sidebarWidth={sidebarWidth}
            />,
            getMainPagePortalEl()
          )
        : null}
    </>
  )
}
