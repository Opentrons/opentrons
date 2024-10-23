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
} from '@opentrons/components'
import { actions as stepsActions } from '../../../../ui/steps'
import {
  hoverOnStep,
  toggleViewSubstep,
} from '../../../../ui/steps/actions/actions'
import {
  getBatchEditFormHasUnsavedChanges,
  getCurrentFormHasUnsavedChanges,
  getSavedStepForms,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../../types'
import type { StepIdType } from '../../../../form-types'

interface StepOverflowMenuProps {
  stepId: string
  menuRootRef: React.MutableRefObject<HTMLDivElement | null>
  top: number
  setStepOverflowMenu: React.Dispatch<React.SetStateAction<boolean>>
  handleEdit: () => void
  confirmDelete: () => void
  confirmMultiDelete: () => void
  multiSelectItemIds: string[] | null
}

export function StepOverflowMenu(props: StepOverflowMenuProps): JSX.Element {
  const {
    stepId,
    menuRootRef,
    top,
    setStepOverflowMenu,
    handleEdit,
    confirmDelete,
    confirmMultiDelete,
    multiSelectItemIds,
  } = props
  const { t } = useTranslation('protocol_steps')
  const singleEditFormHasUnsavedChanges = useSelector(
    getCurrentFormHasUnsavedChanges
  )
  const batchEditFormHasUnstagedChanges = useSelector(
    getBatchEditFormHasUnsavedChanges
  )
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const formData = useSelector(getUnsavedForm)
  const savedStepFormData = useSelector(getSavedStepForms)[stepId]
  const isPipetteStep =
    savedStepFormData.stepType === 'moveLiquid' ||
    savedStepFormData.stepType === 'mix'
  const isThermocyclerProfile = savedStepFormData.stepType === 'thermocycler'

  const duplicateStep = (
    stepId: StepIdType
  ): ReturnType<typeof stepsActions.duplicateStep> =>
    dispatch(stepsActions.duplicateStep(stepId))

  const duplicateMultipleSteps = (): void => {
    if (multiSelectItemIds) {
      dispatch(stepsActions.duplicateMultipleSteps(multiSelectItemIds))
    } else {
      console.warn(
        'something went wrong, you cannot duplicate multiple steps if none are selected'
      )
    }
  }

  return (
    <>
      <Flex
        ref={menuRootRef}
        zIndex={12}
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
        {multiSelectItemIds != null && multiSelectItemIds.length > 0 ? (
          <>
            <MenuButton
              disabled={batchEditFormHasUnstagedChanges}
              onClick={() => {
                duplicateMultipleSteps()
                setStepOverflowMenu(false)
              }}
            >
              {t('duplicate_steps')}
            </MenuButton>
            <Divider marginY="0" />
            <MenuButton
              onClick={() => {
                confirmMultiDelete()
                setStepOverflowMenu(false)
              }}
            >
              {t('delete_steps')}
            </MenuButton>
          </>
        ) : (
          <>
            {formData != null ? null : (
              <MenuButton onClick={handleEdit}>{t('edit_step')}</MenuButton>
            )}
            {isPipetteStep || isThermocyclerProfile ? (
              <MenuButton
                disabled={formData != null}
                onClick={() => {
                  setStepOverflowMenu(false)
                  dispatch(hoverOnStep(stepId))
                  dispatch(toggleViewSubstep(stepId))
                }}
              >
                {t('view_details')}
              </MenuButton>
            ) : null}
            <MenuButton
              disabled={singleEditFormHasUnsavedChanges}
              onClick={() => {
                duplicateStep(stepId)
                setStepOverflowMenu(false)
              }}
            >
              {t('duplicate')}
            </MenuButton>
            <Divider marginY="0" />
            <MenuButton
              onClick={() => {
                confirmDelete()
                setStepOverflowMenu(false)
              }}
            >
              {t('delete')}
            </MenuButton>
          </>
        )}
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
    &:hover {
      background-color: ${COLORS.transparent};
    }
  }
`
