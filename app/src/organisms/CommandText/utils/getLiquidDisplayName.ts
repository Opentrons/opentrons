import type { CompletedProtocolAnalysis, ProtocolAnalysisOutput } from '@opentrons/shared-data'

export function getLiquidDisplayName(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput,
  liquidId: string
): CompletedProtocolAnalysis['liquids'][number]['displayName'] {
  const liquidDisplayName = (analysis?.liquids ?? []).find(
    liquid => liquid.id === liquidId
  )?.displayName
  return liquidDisplayName ?? ''
}
