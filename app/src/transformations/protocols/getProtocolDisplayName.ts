import first from 'lodash/first'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

export function getProtocolDisplayName(
  protocolKey: string,
  srcFileNames: string[],
  analysis?: ProtocolAnalysisOutput | null
): string {
  return analysis?.metadata?.protocolName ?? first(srcFileNames) ?? protocolKey
}
