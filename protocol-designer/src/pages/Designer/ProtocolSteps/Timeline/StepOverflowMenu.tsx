import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  NO_WRAP,
  POSITION_ABSOLUTE,
  SPACING,
  useConditionalConfirm,
} from '@opentrons/components'
import { actions as steplistActions } from '../../../../steplist'
import { actions as stepsActions } from '../../../../ui/steps'
import { populateForm } from '../../../../ui/steps/actions/actions'
import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
  DELETE_STEP_FORM,
} from '../../../../components/modals/ConfirmDeleteModal'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import type * as React from 'react'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../../types'
import type { StepIdType } from '../../../../form-types'
import type { DeleteModalType } from '../../../../components/modals/ConfirmDeleteModal'

interface StepOverflowMenuProps {
  stepId: string
  menuRootRef: React.MutableRefObject<HTMLDivElement | null>
  top: number
  setStepOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
}

export function StepOverflowMenu(props: StepOverflowMenuProps): JSX.Element {
  const { stepId, menuRootRef, top, setStepOverflowMenu } = props
  const { t } = useTranslation('protocol_steps')
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const deleteStep = (stepId: StepIdType): void => {
    dispatch(steplistActions.deleteStep(stepId))
  }
  const formData = useSelector(getUnsavedForm)
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)
  const singleEditFormHasUnsavedChanges = useSelector(
    getCurrentFormHasUnsavedChanges
  )
  const duplicateStep = (
    stepId: StepIdType
  ): ReturnType<typeof stepsActions.duplicateStep> =>
    dispatch(stepsActions.duplicateStep(stepId))

  const handleStepItemSelection = (): void => {
    dispatch(populateForm(stepId))
    setStepOverflowMenu(false)
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

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStepItemSelection,
    currentFormIsPresaved || singleEditFormHasUnsavedChanges
  )

  const {
    confirm: confirmDelete,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDelete,
  } = useConditionalConfirm(handleDelete, true)

  const getModalType = (): DeleteModalType => {
    if (currentFormIsPresaved) {
      return CLOSE_UNSAVED_STEP_FORM
    } else {
      return CLOSE_STEP_FORM_WITH_CHANGES
    }
  }

  return (
    <>
      {/* TODO: update this modal */}
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      {/* TODO: update this modal */}
      {showDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      <Flex
        ref={menuRootRef}
        zIndex={5}
        top={top}
        left="19.5rem"
        position={POSITION_ABSOLUTE}
        whiteSpace={NO_WRAP}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {formData != null ? null : (
          <MenuButton onClick={confirm}>{t('edit_step')}</MenuButton>
        )}
        <MenuButton
          onClick={() => {
            dispatch(stepsActions.toggleStepCollapsed(stepId))
          }}
        >
          {t('view_commands')}
        </MenuButton>
        <MenuButton
          onClick={() => {
            duplicateStep(stepId)
          }}
        >
          {t('duplicate')}
        </MenuButton>
        <Divider marginY="0" />
        <MenuButton onClick={confirmDelete}>{t('delete')}</MenuButton>
      </Flex>
    </>
  )
}

const MenuButton = styled.button`
  background-color: ${COLORS.transparent};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8};
  width: 100%;
  cursor: pointer;
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  border: none;
  border-radius: inherit;
  display: flex;
  &:hover {
    background-color: ${COLORS.blue10};
  }
  &:disabled {
    color: ${COLORS.grey40};
    cursor: auto;
  }
`
