// @flow

export type CreatePipettesAction = {
  type: 'CREATE_PIPETTES',
  payload: {
    [pipetteId: string]: {
      name: string,
      tiprackModel: string, // TODO: Ian 2018-12-17 this matches old var, but labware "model/type/name" is inconsistent and needs to be standardized
    },
  },
}

export const createPipettes = (payload: $PropertyType<CreatePipettesAction, 'payload'>): CreatePipettesAction => ({
  type: 'CREATE_PIPETTES',
  payload,
})

export type DeletePipettesAction = {
  type: 'DELETE_PIPETTES',
  payload: Array<string>, // pipette ids to delete, order doesn't matter
}

export const deletePipettes = (payload: $PropertyType<DeletePipettesAction, 'payload'>): DeletePipettesAction => ({
  type: 'DELETE_PIPETTES',
  payload,
})

export type ModifyPipettesTiprackAssignmentAction = {
  type: 'MODIFY_PIPETTES_TIPRACK_ASSIGNMENT',
  payload: {
    [pipetteId: string]: string, // new assigned tiprack model
  },
}

export const modifyPipettesTiprackAssignment = (payload: $PropertyType<ModifyPipettesTiprackAssignmentAction, 'payload'>): ModifyPipettesTiprackAssignmentAction => ({
  type: 'MODIFY_PIPETTES_TIPRACK_ASSIGNMENT',
  payload,
})
