import { useMissingProtocolHardwareFromRequiredProtocolHardware } from './useMissingProtocolHardwareFromRequiredProtocolHardware'
import { useRequiredProtocolHardwareFromAnalysis } from './useRequiredProtocolHardwareFromAnalysis'

import type {
  CompletedProtocolAnalysis,
  RobotType,
} from '@opentrons/shared-data'
import type { ProtocolHardware } from './types'

export const useMissingProtocolHardwareFromAnalysis = (
  robotType: RobotType,
  analysis: CompletedProtocolAnalysis | null
): {
  missingProtocolHardware: ProtocolHardware[]
  conflictedSlots: string[]
  isLoading: boolean
} => {
  const {
    requiredProtocolHardware,
    isLoading,
  } = useRequiredProtocolHardwareFromAnalysis(analysis)

  return useMissingProtocolHardwareFromRequiredProtocolHardware(
    requiredProtocolHardware,
    isLoading,
    robotType,
    analysis ?? null
  )
}
