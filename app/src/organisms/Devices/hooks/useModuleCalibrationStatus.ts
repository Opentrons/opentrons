import {
  useIsOT3,
  useModuleRenderInfoForProtocolById,
  ProtocolCalibrationStatus,
} from '.'

export function useModuleCalibrationStatus(
  robotName: string,
  runId: string
): ProtocolCalibrationStatus {
  const isOT3 = useIsOT3(robotName)
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  // only check module calibration for Flex
  if (!isOT3) {
    return { complete: true }
  }

  const moduleKeys = Object.keys(moduleRenderInfoForProtocolById)
  if (moduleKeys.length === 0) {
    return { complete: true }
  }
  const moduleData = moduleKeys.map(key => moduleRenderInfoForProtocolById[key])
  if (!moduleData.every(m => m.attachedModuleMatch?.moduleOffset != null)) {
    return { complete: false, reason: 'calibrate_module_failure_reason' }
  } else {
    return { complete: true }
  }
}
