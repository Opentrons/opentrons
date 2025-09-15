import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import {
  BORDERS,
  Box,
  COLORS,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  useConditionalConfirm,
} from '@opentrons/components'

import { StepContainer } from '/protocol-designer/components/molecules'
import {
  ConfirmDeleteModal,
  DELETE_MULTIPLE_STEP_FORMS,
  DELETE_STEP_FORM,
  getMainPagePortalEl,
} from '/protocol-designer/components/organisms'
import { actions as steplistActions } from '/protocol-designer/steplist'
import {
  deselectAllSteps,
  populateForm,
} from '/protocol-designer/ui/steps/actions/actions'
import { getMultiSelectItemIds } from '/protocol-designer/ui/steps/selectors'

import { StepOverflowMenu } from './StepOverflowMenu'
import { capitalizeFirstLetterAfterNumber } from './utils'

import type { ThunkDispatch } from 'redux-thunk'
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  SetStateAction,
} from 'react'
import type { IconName } from '@opentrons/components'
import type { StepIdType } from '/protocol-designer/form-types'
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
  dragHovered?: boolean
}

export function ConnectedStepContainer(
  props: ConnectedStepContainerProps
): JSX.Element {
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
    dragHovered = false,
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
    globalThis.addEventListener('click', handleClick)
    return () => {
      globalThis.removeEventListener('click', handleClick)
    }
  })

  const handleStepItemSelection = (): void => {
    if (stepId != null) {
      dispatch(populateForm(stepId))
    }
    setOpenedOverflowMenuId?.(null)
  }

  const onDeleteClickAction = (): void => {
    if (multiSelectItemIds) {
      dispatch(steplistActions.deleteMultipleSteps(multiSelectItemIds))
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

  const deleteStep = (stepId: StepIdType): void => {
    dispatch(steplistActions.deleteStep(stepId))
  }

  const handleDelete = (): void => {
    if (stepId != null) {
      deleteStep(stepId)
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
      <Flex
        id={stepId}
        {...(!isStepAfterError
          ? {
              onMouseEnter,
              onMouseLeave,
            }
          : {})}
        flexDirection={DIRECTION_COLUMN}
      >
        {dragHovered && (
          <Box paddingY={SPACING.spacing2}>
            <Divider
              // eslint-disable-next-line opentrons/no-margins-inline
              marginY="0"
              height="0.25rem"
              width="100%"
              backgroundColor={COLORS.blue50}
              borderRadius={BORDERS.borderRadius2}
            />
          </Box>
        )}

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
      </Flex>
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
