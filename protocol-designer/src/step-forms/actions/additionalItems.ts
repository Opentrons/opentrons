import { FLEX_ROBOT_TYPE, RobotType } from '@opentrons/shared-data'
import { FLEX_TRASH_DEF_URI, OT_2_TRASH_DEF_URI } from '../../constants'
import { uuid } from '../../utils'

export interface ToggleIsGripperRequiredAction {
  type: 'TOGGLE_IS_GRIPPER_REQUIRED'
}

export const toggleIsGripperRequired = (): ToggleIsGripperRequiredAction => ({
  type: 'TOGGLE_IS_GRIPPER_REQUIRED',
})

export type TrashDefUriTypes =
  | 'opentrons/opentrons_1_trash_1100ml_fixed/1'
  | 'opentrons/opentrons_1_trash_3200ml_fixed/1'
export interface CreateDeckFixtureAction {
  type: 'CREATE_DECK_FIXTURE'
  payload: {
    name: 'wasteChute' | 'trashBin'
    id: string
    location: string
    defUri?: string
  }
}

export const createDeckFixture = (
  name: 'wasteChute' | 'trashBin',
  location: string,
  robotType: RobotType
): CreateDeckFixtureAction => ({
  type: 'CREATE_DECK_FIXTURE',
  payload: {
    name,
    id:
      name !== 'trashBin'
        ? `${uuid()}:${name}`
        : `${uuid()}:${
            robotType === FLEX_ROBOT_TYPE
              ? FLEX_TRASH_DEF_URI
              : OT_2_TRASH_DEF_URI
          }`,
    location,
    defUri:
      name !== 'trashBin'
        ? undefined
        : robotType === FLEX_ROBOT_TYPE
        ? FLEX_TRASH_DEF_URI
        : OT_2_TRASH_DEF_URI,
  },
})

export interface DeleteDeckFixtureAction {
  type: 'DELETE_DECK_FIXTURE'
  payload: {
    id: string
  }
}

export const deleteDeckFixture = (id: string): DeleteDeckFixtureAction => ({
  type: 'DELETE_DECK_FIXTURE',
  payload: {
    id,
  },
})
