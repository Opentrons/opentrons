import { useMemo } from 'react'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'

export interface UseCommandStepNumbersProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  currentCommand: RunTimeCommand | null
}

export interface UseCommandStepNumbersResult {
  commandStep: number | null
  totalSteps: number | null
}

// Returns relevant step information.
export function useCommandStepNumbers({
  protocolAnalysis,
  currentCommand,
}: UseCommandStepNumbersProps): UseCommandStepNumbersResult {
  const commandStep = useMemo(() => {
    const matchingIdx =
      protocolAnalysis?.commands.findLastIndex(
        cmd => cmd.key === currentCommand?.key
      ) ?? -1

    return matchingIdx !== -1 ? matchingIdx + 1 : null
  }, [protocolAnalysis, currentCommand])

  return { commandStep, totalSteps: protocolAnalysis?.commands.length ?? null }
}
