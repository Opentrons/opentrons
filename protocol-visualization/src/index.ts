/**
 * Standalone protocol visualization from protocol analysis.
 * UI will land in follow-up PRs; see PLAN.md in this package.
 */
export type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

/**
 * Package identifier string (useful for diagnostics or feature flags).
 */
export function getProtocolVisualizationPackageName(): string {
  return '@opentrons/protocol-visualization'
}
