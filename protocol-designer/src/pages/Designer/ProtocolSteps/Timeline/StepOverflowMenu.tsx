import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  MenuItem,
  NO_WRAP,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import {
  getBatchEditFormHasUnsavedChanges,
  getCurrentFormHasUnsavedChanges,
  getSavedStepForms,
  getUnsavedForm,
} from '/protocol-designer/step-forms/selectors'
import { actions as stepsActions } from '/protocol-designer/ui/steps'
import {
  hoverOnStep,
  toggleViewSubstep,
} from '/protocol-designer/ui/steps/actions/actions'

import { analyticsEvent } from '../../../../analytics/actions'
import { OPEN_STEP_DETAILS_EVENT } from '../../../../analytics/constants'
import { OVERFLOW_MENU_POSITION_ADJUSTMENT } from '../../../../constants'

import type { ThunkDispatch } from 'redux-thunk'
import type {
  Dispatch,
  MouseEvent,
  MutableRefObject,
  ReactNode,
  SetStateAction,
} from 'react'
import type { AnalyticsEvent } from '/protocol-designer/analytics/mixpanel'
import type { BaseState } from '/protocol-designer/types'

interface StepOverflowMenuProps {
  stepId: string
  menuRootRef: MutableRefObject<HTMLDivElement | null>
  top: number
  setOpenedOverflowMenuId: Dispatch<SetStateAction<string | null>>
  handleEdit: () => void
  confirmDelete: () => void
  confirmMultiDelete: () => void
  multiSelectItemIds: string[] | null
  sidebarWidth: number // adjust the position of the overflow menu
}

export function StepOverflowMenu(props: StepOverflowMenuProps): ReactNode {
  const {
    stepId,
    menuRootRef,
    top,
    setOpenedOverflowMenuId,
    handleEdit,
    confirmDelete,
    confirmMultiDelete,
    multiSelectItemIds,
    sidebarWidth,
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
  const isThermocyclerProfile =
    savedStepFormData.stepType === 'thermocycler' &&
    savedStepFormData.thermocyclerFormType === 'thermocyclerProfile'

  const selectViewDetailsEvent: AnalyticsEvent = {
    name: OPEN_STEP_DETAILS_EVENT,
    properties: {},
  }

  const isStackerFillStep =
    savedStepFormData.stepType === 'flexStacker' &&
    savedStepFormData.flexStackerFormType === 'fill'
  return (
    <>
      <Flex
        ref={menuRootRef}
        zIndex={12}
        top={top}
        left={sidebarWidth + OVERFLOW_MENU_POSITION_ADJUSTMENT} // the space between kebab menu button and overflow menu is 8px
        position={POSITION_ABSOLUTE}
        whiteSpace={NO_WRAP}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        onClick={(e: MouseEvent<HTMLDivElement>) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {multiSelectItemIds != null && multiSelectItemIds.length > 0 ? (
          <>
            <MenuItem
              disabled={batchEditFormHasUnstagedChanges}
              onClick={() => {
                dispatch(stepsActions.duplicateSelectedSteps())
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('duplicate_steps')}
            </MenuItem>
            <Divider marginY="0" />
            <MenuItem
              onClick={() => {
                confirmMultiDelete()
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('delete_steps')}
            </MenuItem>
          </>
        ) : (
          <>
            {formData != null ? null : (
              <MenuItem onClick={handleEdit}>{t('edit_step')}</MenuItem>
            )}
            {isPipetteStep || isThermocyclerProfile ? (
              <MenuItem
                disabled={formData != null}
                onClick={() => {
                  setOpenedOverflowMenuId(null)
                  dispatch(hoverOnStep(stepId))
                  dispatch(toggleViewSubstep(stepId))
                  dispatch(analyticsEvent(selectViewDetailsEvent))
                }}
              >
                {t('view_details')}
              </MenuItem>
            ) : null}
            {isStackerFillStep ? null : (
              <MenuItem
                disabled={singleEditFormHasUnsavedChanges}
                onClick={() => {
                  dispatch(stepsActions.duplicateSelectedSteps())
                  setOpenedOverflowMenuId(null)
                }}
              >
                {t('duplicate')}
              </MenuItem>
            )}
            <Divider marginY="0" />
            <MenuItem
              onClick={() => {
                confirmDelete()
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('delete')}
            </MenuItem>
          </>
        )}
      </Flex>
    </>
  )
}
