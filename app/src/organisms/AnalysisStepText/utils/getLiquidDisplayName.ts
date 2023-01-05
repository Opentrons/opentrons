import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

export function getLiquidDisplayName(analysis: CompletedProtocolAnalysis, liquidId: string): CompletedProtocolAnalysis['liquid'][number]['displayName'] {
  const liquidDisplayName = (analysis?.liquids ?? []).find(liquid => liquid.id === liquidId)?.displayName
  return liquidDisplayName ?? ''
}