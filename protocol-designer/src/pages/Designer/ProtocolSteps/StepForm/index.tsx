import { useState } from 'react'
import { connect, useSelector } from 'react-redux'

import { useConditionalConfirm } from '@opentrons/components'
import { flexStackerStateGetter } from '@opentrons/step-generation'

import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '/protocol-designer/components/organisms'
import { FLEX_STACKER_FILL } from '/protocol-designer/constants'
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
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { actions as stepsActions } from '/protocol-designer/ui/steps'

import { StepFormToolbox } from './StepFormToolbox'
import { getDirtyFields } from './utils'

import type { ConnectedComponent } from 'react-redux'
import type { InvariantContext } from '@opentrons/step-generation'
import type { FormData, StepFieldName } from '/protocol-designer/form-types'
import type { LabwareDefByDefURI } from '/protocol-designer/labware-defs'
import type { BaseState, ThunkDispatch } from '/protocol-designer/types'

interface StateProps {
  canSave: boolean
  formHasChanges: boolean
  isNewStep: boolean
  invariantContext: InvariantContext
  allLabwareDefs: LabwareDefByDefURI
  enableConcurrentModuleActions: boolean
  formData?: FormData | null
}
interface DispatchProps {
  cancelStepForm: () => void
  saveStepForm: (options?: { userWantsBonusStep?: boolean }) => void
  createdLabwareForQueue: (
    moduleId: string,
    fillLabwareIds: string[],
    isLidConfigured: boolean
  ) => void
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
    saveStepForm,
    invariantContext,
    allLabwareDefs,
    createdLabwareForQueue,
    deleteLabwares,
  } = props
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [dirtyFields, setDirtyFields] = useState<StepFieldName[]>(() =>
    getDirtyFields(isNewStep, formData)
  )
  const savedStepForms = useSelector(getSavedStepForms)
  const robotState = useSelector(getRobotStateAtActiveItem)
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
    // No dialog to show. Just save the step directly.
    saveStepForm()
    if (
      hydratedForm.stepType === 'flexStacker' &&
      hydratedForm.flexStackerFormType === FLEX_STACKER_FILL
    ) {
      const moduleState =
        robotState != null
          ? flexStackerStateGetter(robotState, hydratedForm.moduleId)
          : null
      const isLidConfigured =
        moduleState?.storedLabwareDetails?.lidLabwareURI != null

      // logic for editing a fill step form
      if (savedStepForm != null) {
        const initialLabwareIds =
          (savedStepForm.fillLabwareIds as string[] | null) ?? []
        const oldFillQuantity = initialLabwareIds.length

        // if new fill quantity is less than the preivously saved quantity, delete the extraneous labware
        if (oldFillQuantity > hydratedForm.fillLabwareIds.length) {
          const extraneousLabwareIds = initialLabwareIds.slice(
            hydratedForm.fillLabwareIds.length,
            oldFillQuantity
          )
          deleteLabwares(extraneousLabwareIds)
        }
        // if new fill quantity is greater than the preivously saved quantity, create the new labware
        else if (oldFillQuantity < hydratedForm.fillLabwareIds.length) {
          const newLabwareIds = hydratedForm.fillLabwareIds.slice(
            oldFillQuantity,
            hydratedForm.fillLabwareIds.length
          )
          createdLabwareForQueue(
            hydratedForm.moduleId,
            newLabwareIds,
            isLidConfigured
          )
        }
      } else {
        // if no saved step form exists, create all the new labware
        createdLabwareForQueue(
          hydratedForm.moduleId,
          hydratedForm.fillLabwareIds,
          isLidConfigured
        )
      }
    } else if (
      hydratedForm.stepType === 'flexStacker' &&
      savedStepForm?.flexStackerFormType === FLEX_STACKER_FILL &&
      hydratedForm.flexStackerFormType !== FLEX_STACKER_FILL
    ) {
      // logic for deleting fill labware if the stacker form type changes from fill to something else
      const fillLabwareIds =
        (savedStepForm.fillLabwareIds as string[] | null) ?? []
      deleteLabwares(fillLabwareIds)
    }
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
    invariantContext: getInvariantContext(state),
    allLabwareDefs: labwareDefSelectors.getLabwareDefsByURI(state),
    enableConcurrentModuleActions: getEnableConcurrentModuleActions(state),
  }
}

const mapDispatchToProps = (dispatch: ThunkDispatch<any>): DispatchProps => {
  const cancelStepForm = (): void => {
    dispatch(actions.cancelStepForm())
  }

  const saveStepForm = (): void => {
    dispatch(stepsActions.saveStepForm())
  }

  const createdLabwareForQueue = (
    moduleId: string,
    fillLabwareIds: string[],
    isLidConfigured: boolean
  ): void => {
    dispatch(
      createLabwareAndQueueForHopper({
        moduleId,
        fillLabwareIds,
        isLidConfigured,
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
