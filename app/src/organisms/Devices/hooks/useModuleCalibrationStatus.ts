import omitBy from 'lodash/omitBy'
import { MAGNETIC_BLOCK_TYPE } from '@opentrons/shared-data'
import { useModuleRenderInfoForProtocolById } from './useModuleRenderInfoForProtocolById'
import { ProtocolCalibrationStatus } from './useRunCalibrationStatus'
import { useIsFlex } from './useIsFlex'

export function useModuleCalibrationStatus(
  robotName: string,
  runId: string
): ProtocolCalibrationStatus {
  const isFlex = useIsFlex(robotName)
  // TODO: can probably use getProtocolModulesInfo but in a rush to get out 7.0.1
  const moduleRenderInfoForProtocolById = omitBy(
    useModuleRenderInfoForProtocolById(runId),
    moduleRenderInfo =>
      moduleRenderInfo.moduleDef.moduleType === MAGNETIC_BLOCK_TYPE
  )

  // only check module calibration for Flex
  if (!isFlex) {
    return { complete: true }
  }

  const moduleInfoKeys = Object.keys(moduleRenderInfoForProtocolById)
  if (moduleInfoKeys.length === 0) {
    return { complete: true }
  }
  const moduleData = moduleInfoKeys.map(
    key => moduleRenderInfoForProtocolById[key]
  )
  if (
    moduleData.some(
      m => m.attachedModuleMatch?.moduleOffset?.last_modified == null
    )
  ) {
    return { complete: false, reason: 'calibrate_module_failure_reason' }
  } else {
    return { complete: true }
  }
}
