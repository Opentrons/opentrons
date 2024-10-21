import {
  getGripperDisplayName,
  getPipetteModelSpecs,
  getPipetteNameSpecs,
  getPipetteSpecsV2,
  GRIPPER_MODELS,
} from '@opentrons/shared-data'
import { useIsOEMMode } from '/app/resources/robot-settings/hooks'
import { useRobotControlCommands } from '/app/resources/maintenance_runs'

import type {
  GripperModel,
  PipetteModel,
  PipetteModelSpecs,
  PipetteName,
  PipetteNameSpecs,
  PipetteV2Specs,
  CreateCommand,
} from '@opentrons/shared-data'
import type {
  UseRobotControlCommandsProps,
  UseRobotControlCommandsResult,
} from '/app/resources/maintenance_runs'

export function usePipetteNameSpecs(
  name: PipetteName
): PipetteNameSpecs | null {
  const isOEMMode = useIsOEMMode()
  const pipetteNameSpecs = getPipetteNameSpecs(name)

  if (pipetteNameSpecs == null) {
    return null
  }

  const brandedDisplayName = pipetteNameSpecs.displayName
  const anonymizedDisplayName = pipetteNameSpecs.displayName.replace(
    'Flex ',
    ''
  )

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteNameSpecs, displayName }
}

export function usePipetteModelSpecs(
  model: PipetteModel
): PipetteModelSpecs | null {
  const modelSpecificFields = getPipetteModelSpecs(model)
  const pipetteNameSpecs = usePipetteNameSpecs(
    modelSpecificFields?.name as PipetteName
  )

  if (modelSpecificFields == null || pipetteNameSpecs == null) {
    return null
  }

  return { ...modelSpecificFields, displayName: pipetteNameSpecs.displayName }
}

export function usePipetteSpecsV2(
  name?: PipetteName | PipetteModel
): PipetteV2Specs | null {
  const isOEMMode = useIsOEMMode()
  const pipetteSpecs = getPipetteSpecsV2(name)

  if (pipetteSpecs == null) {
    return null
  }

  const brandedDisplayName = pipetteSpecs.displayName
  const anonymizedDisplayName = pipetteSpecs.displayName.replace('Flex ', '')

  const displayName = isOEMMode ? anonymizedDisplayName : brandedDisplayName

  return { ...pipetteSpecs, displayName }
}

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

export interface UseHomePipettesResult {
  isHoming: UseRobotControlCommandsResult['isExecuting']
  homePipettes: UseRobotControlCommandsResult['executeCommands']
}

export type UseHomePipettesProps = Pick<
  UseRobotControlCommandsProps,
  'pipetteInfo' | 'onSettled'
>

// Home pipettes except for plungers.
export function useHomePipettes(
  props: UseHomePipettesProps
): UseHomePipettesResult {
  const { executeCommands, isExecuting } = useRobotControlCommands({
    ...props,
    commands: [HOME_EXCEPT_PLUNGERS],
    continuePastCommandFailure: true,
  })

  return {
    isHoming: isExecuting,
    homePipettes: executeCommands,
  }
}

const HOME_EXCEPT_PLUNGERS: CreateCommand = {
  commandType: 'home' as const,
  params: { axes: ['leftZ', 'rightZ', 'x', 'y'] },
}
