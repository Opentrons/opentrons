import type {
  ProtocolAnalysisOutput,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

export function getProtocolUsesGripper(
  analysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
): boolean {
  return (
    analysis?.commands.some(
      c =>
        c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
    ) ?? false
  )
}
