import { useState } from 'react'
import { connect, useSelector } from 'react-redux'

import { useConditionalConfirm } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import {
  BonusStepModal,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '/protocol-designer/components/organisms'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { selectors as labwareDefSelectors } from '/protocol-designer/labware-defs'
import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import {
  getHydratedForm,
  selectors as stepFormSelectors,
} from '/protocol-designer/step-forms'
import { createLabwareAndQueueForHopper } from '/protocol-designer/step-forms/actions/thunks'
import {
  getInvariantContext,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { actions } from '/protocol-designer/steplist'
import { actions as stepsActions } from '/protocol-designer/ui/steps'

import { StepFormToolbox } from './StepFormToolbox'
import { getDirtyFields } from './utils'

import type { ConnectedComponent } from 'react-redux'
import type { InvariantContext } from '@opentrons/step-generation'
import type { BonusStepModalType } from '/protocol-designer/components/organisms'
import type { FormData, StepFieldName } from '/protocol-designer/form-types'
import type { LabwareDefByDefURI } from '/protocol-designer/labware-defs'
import type { BaseState, ThunkDispatch } from '/protocol-designer/types'

interface StateProps {
  canSave: boolean
  formHasChanges: boolean
  isNewStep: boolean
  bonusStepModalType: BonusStepModalType | null
  invariantContext: InvariantContext
  allLabwareDefs: LabwareDefByDefURI
  enableConcurrentModuleActions: boolean
  formData?: FormData | null
}
interface DispatchProps {
  cancelStepForm: () => void
  saveStepForm: (options?: { userWantsBonusStep?: boolean }) => void
  createdLabwareForQueue: (moduleId: string, fillLabwareIds: string[]) => void
  deleteLabwares: (labwareIds: string[]) => void
}
type StepFormManagerProps = StateProps & DispatchProps

function StepFormManager(props: StepFormManagerProps): JSX.Element | null {
  const {
    canSave,
    formData,
    formHasChanges,
    cancelStepForm,
    isNewStep,
    bonusStepModalType,
    saveStepForm,
    invariantContext,
    allLabwareDefs,
    createdLabwareForQueue,
    deleteLabwares,
  } = props
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = useState<StepFieldName[]>(
    getDirtyFields(isNewStep, formData)
  )
  const savedStepForms = useSelector(getSavedStepForms)
  const savedStepForm = formData != null ? savedStepForms[formData.id] : null

  const handleBlur = (fieldName: StepFieldName): void => {
    if (fieldName === focusedField) {
      setFocusedField(null)
    }
    setDirtyFields(prevDirtyFields => {
      if (!prevDirtyFields.includes(fieldName)) {
        return [...prevDirtyFields, fieldName]
      }
      return prevDirtyFields
    })
  }

  const {
    confirm: confirmClose,
    showConfirmation: showConfirmCancelModal,
    cancel: cancelClose,
  } = useConditionalConfirm(cancelStepForm, isNewStep || formHasChanges)

  const [currentBonusStepDialogType, setCurrentBonusStepDialogType] =
    useState<BonusStepModalType | null>(null)

  // no form selected
  if (formData == null) {
    return null
  }
  const hydratedForm = getHydratedForm(
    formData,
    invariantContext,
    allLabwareDefs
  )
  const focusHandlers = {
    focusedField,
    dirtyFields,
    focus: setFocusedField,
    blur: handleBlur,
  }

  const handleSave = (): void => {
    if (bonusStepModalType == null) {
      // No dialog to show. Just save the step directly.
      saveStepForm()
      if (
        hydratedForm.stepType === 'flexStacker' &&
        hydratedForm.flexStackerFormType === 'fill'
      ) {
        const initialLabwareIds =
          (savedStepForm?.fillLabwareIds as string[]) ?? null
        const oldFillQuantity = initialLabwareIds?.length ?? 0

        // delete extraneous labware if fill quantity is decreased
        if (oldFillQuantity > hydratedForm.fillLabwareIds.length) {
          const extraneousLabwareIds = initialLabwareIds.slice(
            hydratedForm.fillLabwareIds.length,
            oldFillQuantity
          )
          deleteLabwares(extraneousLabwareIds)
        } else {
          createdLabwareForQueue(
            hydratedForm.moduleId,
            hydratedForm.fillLabwareIds
          )
        }
      }
    } else {
      // There's a dialog we have to show before saving the step.
      // Its confirm/cancel handlers will be the thing that saves the step.
      setCurrentBonusStepDialogType(bonusStepModalType)
    }
  }
  const handleSkipPauseClick = (): void => {
    saveStepForm({ userWantsBonusStep: false })
    setCurrentBonusStepDialogType(null)
  }
  const handleAddPauseClick = (): void => {
    saveStepForm({ userWantsBonusStep: true })
    setCurrentBonusStepDialogType(null)
  }

  return (
    <>
      {showConfirmCancelModal && (
        <ConfirmDeleteModal
          modalType={
            isNewStep ? CLOSE_UNSAVED_STEP_FORM : CLOSE_STEP_FORM_WITH_CHANGES
          }
          onCancelClick={cancelClose}
          onContinueClick={confirmClose}
        />
      )}

      {currentBonusStepDialogType === 'explainWaitForTemperatureModuleTemp' && (
        <BonusStepModal
          modalType={currentBonusStepDialogType}
          displayTemperature={formData.targetTemperature ?? '?'}
          handleAddPauseClick={handleAddPauseClick}
        />
      )}
      {currentBonusStepDialogType === 'explainWaitForHeaterShakerTemp' && (
        <BonusStepModal
          modalType={currentBonusStepDialogType}
          displayTemperature={formData.targetHeaterShakerTemperature ?? '?'}
          handleAddPauseClick={handleAddPauseClick}
        />
      )}
      {currentBonusStepDialogType === 'explainWaitForThermocyclerProfile' && (
        <BonusStepModal
          modalType={currentBonusStepDialogType}
          handleAddPauseClick={handleAddPauseClick}
        />
      )}
      {currentBonusStepDialogType === 'optionallyWaitForTemp' && (
        <BonusStepModal
          modalType="optionallyWaitForTemp"
          displayTemperature={
            formData.targetTemperature ??
            formData.targetHeaterShakerTemperature ??
            '?'
          }
          displayModule={
            formData.moduleId != null
              ? getModuleDisplayName(
                  invariantContext.moduleEntities[formData.moduleId].model
                )
              : ''
          }
          handleAddPauseClick={handleAddPauseClick}
          handleSkipPauseClick={handleSkipPauseClick}
        />
      )}

      <StepFormToolbox
        {...{
          canSave,
          dirtyFields,
          focusedField,
          focusHandlers,
          formData,
          handleClose: confirmClose,
          handleSave,
          hydratedForm,
        }}
      />
    </>
  )
}

const mapStateToProps = (state: BaseState): StateProps => {
  return {
    canSave: stepFormSelectors.getCurrentFormCanBeSaved(state),
    formData: stepFormSelectors.getUnsavedForm(state),
    formHasChanges: stepFormSelectors.getCurrentFormHasUnsavedChanges(state),
    isNewStep: stepFormSelectors.getCurrentFormIsPresaved(state),
    bonusStepModalType: stepFormSelectors.getBonusStepModalType(state),
    invariantContext: getInvariantContext(state),
    allLabwareDefs: labwareDefSelectors.getLabwareDefsByURI(state),
    enableConcurrentModuleActions: getEnableConcurrentModuleActions(state),
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DispatchProps => {
  const cancelStepForm = (): void => {
    dispatch(actions.cancelStepForm())
  }

  const saveStepForm = (options?: { userWantsBonusStep?: boolean }): void => {
    dispatch(stepsActions.saveStepForm(options))
  }

  const createdLabwareForQueue = (
    moduleId: string,
    fillLabwareIds: string[]
  ): void => {
    dispatch(
      createLabwareAndQueueForHopper({
        moduleId,
        fillLabwareIds,
      })
    )
  }

  const deleteLabwares = (labwareIds: string[]): void => {
    for (const labwareId of labwareIds) {
      dispatch(deleteContainer({ labwareId }))
    }
  }

  return {
    cancelStepForm,
    saveStepForm,
    createdLabwareForQueue,
    deleteLabwares,
  }
}

// NOTE(IL, 2020-04-22): This is using connect instead of useSelector in order to
// avoid zombie children in the many connected field components.
// (Children of a useSelector parent must always be written to use selectors defensively
// if their parent (StepEditForm) is NOT using connect.
// It doesn't matter if the children are using connect or useSelector,
// only the parent matters.)
// https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
export const StepForm: ConnectedComponent<typeof StepFormManager, {}> = connect(
  mapStateToProps,
  mapDispatchToProps
)((props: StepFormManagerProps) => {
  const { formData } = props
  return (
    // key by ID so manager state doesn't persist across different forms
    <StepFormManager
      key={formData?.id ?? 'empty'}
      formData={formData}
      {...props}
    />
  )
})
