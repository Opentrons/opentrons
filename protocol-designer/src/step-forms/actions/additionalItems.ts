import { WASTE_CHUTE_SLOT } from '../../constants'

export interface ToggleIsGripperRequiredAction {
  type: 'TOGGLE_IS_GRIPPER_REQUIRED'
}

export const toggleIsGripperRequired = (): ToggleIsGripperRequiredAction => ({
  type: 'TOGGLE_IS_GRIPPER_REQUIRED',
})

export interface ToggleIsWasteChuteRequiredAction {
  type: 'TOGGLE_IS_WASTE_CHUTE_REQUIRED'
  payload: {
    location: string
  }
}

export const toggleIsWasteChuteRequired = (): ToggleIsWasteChuteRequiredAction => ({
  type: 'TOGGLE_IS_WASTE_CHUTE_REQUIRED',
  payload: {
    location: WASTE_CHUTE_SLOT,
  },
})
