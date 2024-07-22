import {
  ADD_STEPS_TO_GROUP,
  CLEAR_GROUP,
  CREATE_GROUP,
  SELECT_STEP_FOR_GROUP,
} from '../reducers'

export interface SaveGroupAction {
  type: typeof CREATE_GROUP
  payload: { groupName: string }
}
export interface AddStepToGroupAction {
  type: typeof ADD_STEPS_TO_GROUP
  payload: { groupName: string; stepIds: string[] }
}
export interface ClearGroupAction {
  type: typeof CLEAR_GROUP
}
export interface SelectedStepForGroupAction {
  type: typeof SELECT_STEP_FOR_GROUP
  payload: { stepId: string }
}

export const addStepToGroup = (
  args: AddStepToGroupAction['payload']
): AddStepToGroupAction => ({
  type: ADD_STEPS_TO_GROUP,
  payload: args,
})

export const createGroup = (
  args: SaveGroupAction['payload']
): SaveGroupAction => ({
  type: CREATE_GROUP,
  payload: args,
})

export const selectStepForGroup = (
  args: SelectedStepForGroupAction['payload']
): SelectedStepForGroupAction => ({
  type: SELECT_STEP_FOR_GROUP,
  payload: args,
})

export const clearGroup = (): ClearGroupAction => ({
  type: CLEAR_GROUP,
})
