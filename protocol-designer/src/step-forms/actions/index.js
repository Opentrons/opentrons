// @flow
import type { StepIdType } from '../../form-types'

export type CreatePipettesAction = {
  type: 'CREATE_PIPETTES',
  payload: {
    [pipetteId: string]: {
      name: string,
      tiprackModel: string, // TODO: Ian 2018-12-17 this matches old var, but labware "model/type/name" is inconsistent and needs to be standardized
    },
  },
}

export const createPipettes = (
  payload: $PropertyType<CreatePipettesAction, 'payload'>
): CreatePipettesAction => {
  return {
    type: 'CREATE_PIPETTES',
    payload,
  }
}

export type DeletePipettesAction = {
  type: 'DELETE_PIPETTES',
  payload: Array<string>, // pipette ids to delete, order doesn't matter
}

export const deletePipettes = (
  payload: $PropertyType<DeletePipettesAction, 'payload'>
): DeletePipettesAction => ({
  type: 'DELETE_PIPETTES',
  payload,
})

export type SubstituteStepFormPipettesAction = {
  type: 'SUBSTITUTE_STEP_FORM_PIPETTES',
  payload: {
    // step range to modify (inclusive)
    startStepId: StepIdType,
    endStepId: StepIdType,

    // old pipette id -> new id
    substitutionMap: { [oldPipetteId: string]: string },
  },
}

export const substituteStepFormPipettes = (
  payload: $PropertyType<SubstituteStepFormPipettesAction, 'payload'>
): SubstituteStepFormPipettesAction => ({
  type: 'SUBSTITUTE_STEP_FORM_PIPETTES',
  payload,
})
