import type { CommandTextData } from '../types'

export function getLiquidDisplayName(
  protocolData: CommandTextData,
  liquidId: string
): CommandTextData['liquids'][number]['displayName'] {
  const liquidDisplayName = (protocolData?.liquids ?? []).find(
    liquid => liquid.id === liquidId
  )?.displayName
  return liquidDisplayName ?? ''
}
