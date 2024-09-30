import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
export type AnalysisStatus =
  | 'missing'
  | 'loading'
  | 'error'
  | 'complete'
  | 'stale'
  | 'parameterRequired'

export function getAnalysisStatus(
  isAnalyzing: boolean,
  analysis?: ProtocolAnalysisOutput | null
): AnalysisStatus {
  if (isAnalyzing) {
    return 'loading'
  }
  if (analysis == null || analysis === undefined) {
    return 'missing'
  }
  if (analysis.liquids == null || analysis.runTimeParameters == null) {
    return 'stale'
  }
  if (analysis.result === 'parameter-value-required') {
    return 'parameterRequired'
  }
  if (analysis.errors.length > 0) {
    return 'error'
  }
  return 'complete'
}
