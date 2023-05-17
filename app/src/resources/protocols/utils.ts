import { CompletedProtocolAnalysis } from "@opentrons/shared-data";

export function isGripperRequired(analysis: CompletedProtocolAnalysis): boolean {
  return analysis.commands.some(
    c =>
      c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
  ) ?? false
}
