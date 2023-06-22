export interface SetGripperAction {
  type: 'IS_GRIPPER_REQUIRED'
}

export const toggleIsGripperRequired = (): SetGripperAction => ({
  type: 'IS_GRIPPER_REQUIRED',
})
