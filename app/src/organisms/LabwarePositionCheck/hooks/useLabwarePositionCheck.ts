import * as React from 'react'
import { useSteps } from './useSteps'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '../types'

export type LabwarePositionCheckUtils =
  | {
    currentStepIndex: number,
    totalStepCount: number,
    currentStep: LabwarePositionCheckStep,
    proceed: () => void
  }
  | { error: Error }

export function useLabwarePositionCheck(protocolData: CompletedProtocolAnalysis | null): LabwarePositionCheckUtils {
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const LPCSteps = useSteps(protocolData)

  if (protocolData == null) return {error: new Error('no protocol data found')}

  return {
    currentStepIndex,
    totalStepCount: LPCSteps.length,
    currentStep: LPCSteps?.[currentStepIndex],
    proceed: () => setCurrentStepIndex(currentStepIndex !== LPCSteps.length - 1 ? currentStepIndex + 1 : currentStepIndex)
  }
}
