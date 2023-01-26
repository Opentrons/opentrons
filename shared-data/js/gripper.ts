import gripperV1 from '../gripper/definitions/1/gripperV1.json'

import {
  GRIPPER_V1,
} from './constants'

import type {
  GripperModel,
  GripperDefinition,
} from './types'

export const getGripperDef = (gripperModel: GripperModel): GripperDefinition => {
  console.log(gripperModel)
  switch (gripperModel) {
    case 1:// TODO IMMEDIATELY, remove this case once #12067 is merged
    case GRIPPER_V1: {
      return gripperV1 
      break
    }

    default:
      throw new Error(`Invalid gripper model ${gripperModel as string}`)
  }
}

export function getGripperDisplayName(gripperModel: GripperModel): string {
  return getGripperDef(gripperModel).displayName
}
