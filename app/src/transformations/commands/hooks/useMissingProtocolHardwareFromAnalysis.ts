import type {
  RobotType,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import { useRequiredProtocolHardwareFromAnalysis } from './useRequiredProtocolHardwareFromAnalysis'
import { useMissingProtocolHardwareFromRequiredProtocolHardware } from './useMissingProtocolHardwareFromRequiredProtocolHardware'
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
