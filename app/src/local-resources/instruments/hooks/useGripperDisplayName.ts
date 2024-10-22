import { getGripperDisplayName, GRIPPER_MODELS } from '@opentrons/shared-data'
import { useIsOEMMode } from '/app/resources/robot-settings'

import type { GripperModel } from '@opentrons/shared-data'

export function useGripperDisplayName(gripperModel: GripperModel): string {
  const isOEMMode = useIsOEMMode()

  let brandedDisplayName = ''

  // check to only call display name helper for a gripper model
  if (GRIPPER_MODELS.includes(gripperModel)) {
    brandedDisplayName = getGripperDisplayName(gripperModel)
  }

  const anonymizedDisplayName = brandedDisplayName.replace('Flex ', '')

  return isOEMMode ? anonymizedDisplayName : brandedDisplayName
}
