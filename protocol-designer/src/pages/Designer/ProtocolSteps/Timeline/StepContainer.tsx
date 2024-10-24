import * as React from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  OverflowBtn,
  SPACING,
  StyledText,
  useConditionalConfirm,
} from '@opentrons/components'
import {
  ConfirmDeleteModal,
  DELETE_MULTIPLE_STEP_FORMS,
  DELETE_STEP_FORM,
} from '../../../../components/modals/ConfirmDeleteModal'
import { getTopPortalEl } from '../../../../components/portals/TopPortal'
import { actions as steplistActions } from '../../../../steplist'
import {
  deselectAllSteps,
  populateForm,
} from '../../../../ui/steps/actions/actions'
import { getMultiSelectItemIds } from '../../../../ui/steps/selectors'
import { LINE_CLAMP_TEXT_STYLE } from '../../../../atoms'
import { StepOverflowMenu } from './StepOverflowMenu'
import { capitalizeFirstLetterAfterNumber } from './utils'

import type { ThunkDispatch } from 'redux-thunk'
import type { IconName } from '@opentrons/components'
import type { StepIdType } from '../../../../form-types'
import type { BaseState } from '../../../../types'

const STARTING_DECK_STATE = 'Starting deck state'
const FINAL_DECK_STATE = 'Final deck state'

export interface StepContainerProps {
  title: string
  iconName: IconName
  stepId?: string
  iconColor?: string
  onClick?: (event: React.MouseEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
  selected?: boolean
  hovered?: boolean
  hasError?: boolean
  isStepAfterError?: boolean
}

export function StepContainer(props: StepContainerProps): JSX.Element {
  const {
    stepId,
    iconName,
    onDoubleClick,
    onMouseEnter,
    onMouseLeave,
    selected,
    onClick,
    hovered,
    iconColor,
    title,
    hasError = false,
    isStepAfterError = false,
  } = props
  const [top, setTop] = React.useState<number>(0)
  const menuRootRef = React.useRef<HTMLDivElement | null>(null)
  const [stepOverflowMenu, setStepOverflowMenu] = React.useState<boolean>(false)
  const isStartingOrEndingState =
    title === STARTING_DECK_STATE || title === FINAL_DECK_STATE
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)

  let backgroundColor = isStartingOrEndingState ? COLORS.blue20 : COLORS.grey20
  let color = COLORS.black90
  if (selected) {
    backgroundColor = COLORS.blue50
    color = COLORS.white
  }
  if (hovered && !selected) {
    backgroundColor = COLORS.blue30
    color = COLORS.black90
  }
  if (hasError) {
    backgroundColor = COLORS.red50
    color = COLORS.white
  }

  const handleClick = (event: MouseEvent): void => {
    const wasOutside = !(
      event.target instanceof Node &&
      menuRootRef.current?.contains(event.target)
    )

    if (wasOutside && stepOverflowMenu) {
      setStepOverflowMenu(false)
    }
  }

  const handleOverflowClick = (event: React.MouseEvent): void => {
    const { clientY } = event

    const screenHeight = window.innerHeight
    const rootHeight = menuRootRef.current
      ? menuRootRef.current.offsetHeight
      : 0
    const top =
      screenHeight - clientY > rootHeight
        ? clientY + 5
        : clientY - rootHeight - 5

    setTop(top)
  }

  React.useEffect(() => {
    global.addEventListener('click', handleClick)
    return () => {
      global.removeEventListener('click', handleClick)
    }
  })

  const handleStepItemSelection = (): void => {
    if (stepId != null) {
      dispatch(populateForm(stepId))
    }
    setStepOverflowMenu(false)
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

  return (
    <>
      {showDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showMultiDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_MULTIPLE_STEP_FORMS}
          onContinueClick={confirmMultiDelete}
          onCancelClick={cancelMultiDelete}
        />
      )}
      <Box
        id={stepId}
        {...{
          onMouseEnter: isStepAfterError ? undefined : onMouseEnter,
          onMouseLeave: isStepAfterError ? undefined : onMouseLeave,
        }}
      >
        <Btn
          onDoubleClick={onDoubleClick}
          onClick={onClick}
          padding={SPACING.spacing12}
          borderRadius={BORDERS.borderRadius8}
          width="100%"
          backgroundColor={backgroundColor}
          color={color}
          opacity={isStepAfterError ? '50%' : '100%'}
          cursor={isStepAfterError ? CURSOR_DEFAULT : CURSOR_POINTER}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
            height="1.75rem"
          >
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing8}
              justifyContent={JUSTIFY_START}
              width="100%"
            >
              {iconName && (
                <Icon
                  size="1rem"
                  name={iconName}
                  color={iconColor ?? color}
                  minWidth="1rem"
                />
              )}
              <StyledText
                desktopStyle="bodyDefaultRegular"
                css={`
                  ${LINE_CLAMP_TEXT_STYLE(1)}
                  word-break: break-all
                `}
              >
                {capitalizeFirstLetterAfterNumber(title)}
              </StyledText>
            </Flex>
            {selected && !isStartingOrEndingState ? (
              <OverflowBtn
                data-testid={`StepContainer_${stepId}`}
                fillColor={COLORS.white}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setStepOverflowMenu(prev => !prev)
                  handleOverflowClick(e)
                }}
              />
            ) : null}
          </Flex>
        </Btn>
      </Box>
      {stepOverflowMenu && stepId != null
        ? createPortal(
            <StepOverflowMenu
              setStepOverflowMenu={setStepOverflowMenu}
              stepId={stepId}
              menuRootRef={menuRootRef}
              top={top}
              handleEdit={handleStepItemSelection}
              confirmDelete={confirmDelete}
              confirmMultiDelete={confirmMultiDelete}
              multiSelectItemIds={multiSelectItemIds}
            />,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
