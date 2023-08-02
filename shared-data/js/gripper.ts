import gripperV1 from '../gripper/definitions/1/gripperV1.json'
import gripperV1_1 from '../gripper/definitions/1/gripperV1.1.json'
import gripperV1_2 from '../gripper/definitions/1/gripperV1.2.json'

import { GRIPPER_V1, GRIPPER_V1_1, GRIPPER_V1_2 } from './constants'

import type { GripperModel, GripperDefinition } from './types'

export const getGripperDef = (
  gripperModel: GripperModel
): GripperDefinition => {
  switch (gripperModel) {
    case GRIPPER_V1:
      return gripperV1 as GripperDefinition
    case GRIPPER_V1_1:
      return gripperV1_1 as GripperDefinition
    case GRIPPER_V1_2:
      return gripperV1_2 as GripperDefinition
    default:
      console.warn(
        `Could not find a gripper with model ${gripperModel}, falling back to most recent definition: ${GRIPPER_V1_1}`
      )
      return gripperV1_1 as GripperDefinition
  }
}

export function getGripperDisplayName(gripperModel: GripperModel): string {
  return getGripperDef(gripperModel).displayName
}
