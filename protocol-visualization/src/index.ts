/**
 * Standalone protocol visualization from protocol analysis.
 * UI will land in follow-up PRs; see PLAN.md in this package.
 */
export type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

export { AnnotatedSteps } from './organisms/AnnotatedSteps'

export type { GroupedCommands, LeafNode } from './types'

export { SlotDetailsEmptyState } from './molecules/SlotDetailsEmptyState'

/**
 * Package identifier string (useful for diagnostics or feature flags).
 */
export function getProtocolVisualizationPackageName(): string {
  return '@opentrons/protocol-visualization'
}
